"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Loader2, Plus, Trash2, Play, Edit2, X, Save, BookOpen, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';

interface Topic {
    id: string;
    name: string;
    content?: string; // Markdown content
    customInstructions?: string; // User-defined instructions
}

interface Module {
    id: string;
    name: string;
    topics: Topic[];
}

interface CourseStructure {
    title: string;
    description: string;
    modules: Module[];
}

export default function FileCourseGenerator() {
    // Unused router var removed or kept if needed for later? It was used in original code for navigation.
    // Actually original had navigate('/') which corresponds to router.push('/'). 
    // But I replaced the back button with Link href="/".
    // So router might be unused. I'll keep it just in case or remove if lint complains.
    // The previous code had: const router = useRouter(); and Link used for back button.
    // Let's remove unused router if only Link is used.
    // Original: <button onClick={() => navigate('/')} ...>
    // New: <Link href="/" ...>
    // So router is not needed for back button.
    // But keeps it clean.
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processStep, setProcessStep] = useState('');
    const [uploadLog, setUploadLog] = useState<string[]>([]); // Added logging state
    const [error, setError] = useState('');

    const [courseStructure, setCourseStructure] = useState<CourseStructure | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [generatedCourse, setGeneratedCourse] = useState<any>(null); // Final output
    const [generationProgress, setGenerationProgress] = useState(0);

    // Topic Customization State
    const [editingTopic, setEditingTopic] = useState<{ moduleId: string, topicId: string } | null>(null);
    const [tempTopicData, setTempTopicData] = useState<{ name: string, instructions: string, content: string }>({ name: '', instructions: '', content: '' });

    // --- File Handling ---

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = event.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setError('');
        setIsProcessing(true);
        setProcessStep('Extracting text from file...');
        setUploadLog([]); // Reset logs
        addLog(`Started processing file: ${uploadedFile.name}`);

        try {
            let text = '';
            if (uploadedFile.type === 'application/pdf') {
                text = await extractTextFromPDF(uploadedFile);
            } else if (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                text = await extractTextFromDocx(uploadedFile);
            } else {
                throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
            }

            setExtractedText(text);
            setExtractedText(text);
            setProcessStep('Analyzing content with AI...');
            addLog('Text extraction complete. Analyzing content structure...');
            await generateInitialStructure(text);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process file');
            setIsProcessing(false);
        }
    };

    const extractTextFromPDF = async (file: File): Promise<string> => {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Limit to first 20 pages to avoid huge contexts/freezes for now
        const maxPages = Math.min(pdf.numPages, 20);

        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        return fullText;
    };

    const extractTextFromDocx = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    // --- Helper Functions ---
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setUploadLog(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    // --- API Interaction ---
    // Removed: getApiKey and callLLM functions that exposed API keys client-side
    // All LLM calls now go through the secure /api/llm endpoint

    const callLLM = async (prompt: string): Promise<string> => {
        const response = await fetch('/api/llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Server LLM call failed');
        }
        return data.result;
    };

    const generateInitialStructure = async (text: string) => {
        const prompt = `Analyze the following text and create a structured course outline.
    
    Text Preview:
    ${text.substring(0, 15000)}... (truncated)

    Create 4-6 modules, each with 3-5 topics.
    Return ONLY a JSON object with this shape:
    {
      "title": "Suggested Course Title",
      "description": "Brief course description",
      "modules": [
        {
          "name": "Module 1 Name",
          "topics": ["Topic 1", "Topic 2", "Topic 3"]
        }
      ]
    }`;

        try {
            addLog("Sending prompt to Gemini for structure generation...");
            const result = await callLLM(prompt);
            addLog("Structure generated. Parsing response...");

            // Robust JSON extraction
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : result;

            let parsed;
            try {
                parsed = JSON.parse(jsonString);
            } catch (e) {
                console.error("JSON Parse Error:", e);
                console.error("Attempted to parse:", jsonString);
                throw new Error("AI response was not valid JSON. Please try again.");
            }

            if (!parsed.modules || !Array.isArray(parsed.modules)) {
                throw new Error("Invalid structure received from AI.");
            }

            // Map to internal structure with IDs
            const formatted: CourseStructure = {
                title: parsed.title || "Untitled Course",
                description: parsed.description || "",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                modules: parsed.modules.map((m: any, idx: number) => ({
                    id: `mod-${Date.now()}-${idx}`,
                    name: m.name || `Module ${idx + 1}`,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    topics: (m.topics || []).map((t: string, tIdx: number) => ({
                        id: `topic-${Date.now()}-${idx}-${tIdx}`,
                        name: t
                    }))
                }))
            };

            setCourseStructure(formatted);
            addLog(`Structure parsed successfully: ${formatted.modules.length} modules identified.`);
            setIsProcessing(false);
        } catch (err) {
            console.error("Structure Generation Error:", err);
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`Structure Generation Failed: ${msg}`);
        }
    };

    const generateSingleTopic = async () => {
        if (!editingTopic || !courseStructure) return;

        setIsProcessing(true);
        setProcessStep('Generating topic content...');
        addLog(`Generating content for single topic: ${editingTopic.topicId}...`);
        setError('');

        try {
            const module = courseStructure.modules.find(m => m.id === editingTopic.moduleId);
            const topicName = tempTopicData.name;
            const instructions = tempTopicData.instructions;

            const prompt = `Based on the following source text, write a detailed educational guide for the topic "${topicName}".
            
            Source Text (Reference):
            ${extractedText.substring(0, 20000)}... (truncated)

            Target: ${module?.name} -> ${topicName}
            Format: Markdown
            Length: ~800 words
            Custom Instructions: ${instructions ? instructions : 'None'}
            Include: Introduction, Key Concepts, Detailed Explanation, Examples from text (if any), Summary.
            
            Return ONLY Markdown.`;

            const content = await callLLM(prompt);
            setTempTopicData(prev => ({ ...prev, content }));
            setProcessStep('Done!');
            addLog('Topic content generated successfully.');
        } catch (err) {
            console.error("Topic Generation Error:", err);
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to generate topic content: ${msg}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const generateFullCourse = async () => {
        if (!courseStructure) return;

        setIsProcessing(true);
        setGenerationProgress(0);
        addLog("Starting full course deployment...");
        // flattened topics count for progress
        const totalTopics = courseStructure.modules.reduce((acc, m) => acc + m.topics.length, 0);
        let completedTopics = 0;

        let finalMarkdown = `# ${courseStructure.title}\n\n${courseStructure.description}\n\n---\n\n`;

        try {
            for (const module of courseStructure.modules) {
                finalMarkdown += `# Module: ${module.name}\n\n`;

                for (const topic of module.topics) {
                    setProcessStep(`Processing: ${topic.name}`);
                    addLog(`Generating content for user topic: ${topic.name} (${module.name})`);

                    let content = topic.content;

                    if (!content) {
                        try {
                            const prompt = `Based on the following source text, write a detailed educational guide for the topic "${topic.name}".
                            
                            Source Text (Reference):
                            ${extractedText.substring(0, 20000)}... (truncated for context)

                            Target: ${module.name} -> ${topic.name}
                            Format: Markdown
                            Length: ~800 words
                            Custom Instructions: ${topic.customInstructions || 'None'}
                            Include: Introduction, Key Concepts, Detailed Explanation, Examples from text (if any), Summary.
                            
                            Return ONLY Markdown.`;

                            content = await callLLM(prompt);
                        } catch (e) {
                            // Unused var e
                            console.warn(e);
                            content = `## ${topic.name}\n\n(Content generation failed)\n`;
                        }

                        // Rate limit buffer if generating live
                        await new Promise(r => setTimeout(r, 1000));
                    }

                    finalMarkdown += `${content}\n\n---\n\n`;

                    completedTopics++;
                    setGenerationProgress(Math.round((completedTopics / totalTopics) * 100));
                }
            }

            setGeneratedCourse(finalMarkdown);
            setProcessStep('Complete!');
            addLog("Course generation complete. Ready for export.");
        } catch (err) {
            // Unused var err
            console.warn(err);
            setError('Failed during content generation.');
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Rendering ---

    return (
        <div className="flex h-screen bg-white dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white transition-colors">
            {/* Left Panel: Source Document / Preview */}
            <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col m-4 rounded-2xl overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/40">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-4">
                        <Link href="/generate" className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5 text-zinc-400 dark:text-slate-400" />
                        </Link>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-slate-500 leading-none mb-1">Source Asset</h2>
                            <p className="font-bold text-zinc-900 dark:text-white">Extracted Intelligence</p>
                        </div>
                    </div>
                    {file && (
                        <button
                            onClick={() => { setFile(null); setCourseStructure(null); setExtractedText(''); }}
                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all"
                        >
                            Swap Source
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white dark:bg-zinc-900">
                    {!file ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="h-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group"
                        >
                            <div className="w-20 h-20 bg-blue-600/10 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-600/20 dark:border-blue-500/20 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="font-black text-zinc-900 dark:text-white text-lg tracking-tight">Drop Source Material</p>
                            <p className="text-[10px] text-zinc-500 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-2">PDF, DOCX up to 10MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-black/5 dark:shadow-black/20">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-600/10 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-zinc-900 dark:text-white font-bold truncate">{file.name}</p>
                                        <p className="text-[10px] text-zinc-500 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">Active Dataset</p>
                                    </div>
                                </div>
                                {isProcessing && (
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 animate-pulse bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{processStep}</span>
                                    </div>
                                )}
                            </div>

                            {/* Logging Console */}
                            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-inner h-64 flex flex-col">
                                <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 dark:border-zinc-900 pb-2">
                                    <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-zinc-600'}`} />
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">System Operations Log</p>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1">
                                    {uploadLog.length === 0 ? (
                                        <p className="text-zinc-600 dark:text-zinc-700 italic">System ready. Waiting for input...</p>
                                    ) : (
                                        uploadLog.map((log, i) => (
                                            <p key={i} className="text-zinc-400 dark:text-zinc-500 border-l-2 border-zinc-700 dark:border-zinc-800 pl-2 hover:border-blue-500 hover:text-zinc-300 transition-colors">
                                                {log}
                                            </p>
                                        ))
                                    )}
                                    <div id="log-end" />
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -top-3 left-6 px-3 bg-white dark:bg-zinc-900 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Raw Extraction</div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-8">
                                    <pre className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-slate-300 font-medium leading-relaxed font-sans cursor-text selection:bg-blue-500 selection:text-white">
                                        {extractedText || "Awaiting processing metadata..."}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Generator */}
            <div className="w-1/2 flex flex-col bg-white dark:bg-zinc-900 m-4 rounded-2xl overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/40 border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-slate-500 leading-none mb-1">Curriculum Design</h2>
                        <p className="font-bold text-zinc-900 dark:text-white">AI Architect Preview</p>
                    </div>
                    {courseStructure && (
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">Modules</p>
                                <p className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{courseStructure.modules.length}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white dark:bg-zinc-900">
                    {courseStructure ? (
                        <div className="space-y-10">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Enterprise Course Identity</label>
                                <input
                                    value={courseStructure.title}
                                    onChange={(e) => setCourseStructure({ ...courseStructure, title: e.target.value })}
                                    className="w-full text-2xl font-black border-none focus:ring-0 px-0 placeholder-zinc-300 dark:placeholder-slate-700 text-zinc-900 dark:text-white tracking-tight bg-transparent"
                                    placeholder="Enter course title..."
                                />
                                <div className="h-[2px] w-full bg-zinc-100 dark:bg-zinc-800 my-4" />
                                <textarea
                                    value={courseStructure.description}
                                    onChange={(e) => setCourseStructure({ ...courseStructure, description: e.target.value })}
                                    className="w-full text-sm font-medium text-zinc-500 dark:text-slate-400 border-none focus:ring-0 px-0 resize-none leading-relaxed bg-transparent"
                                    placeholder="Brief course objectives and summary..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-6">
                                {courseStructure.modules.map((module, mIdx) => (
                                    <div key={module.id} className="group relative">
                                        <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-zinc-200 dark:bg-zinc-700 group-hover:bg-blue-500/50 transition-colors" />
                                        <div className="flex items-center justify-between mb-4">
                                            <input
                                                value={module.name}
                                                onChange={(e) => {
                                                    const newModules = [...courseStructure.modules];
                                                    newModules[mIdx].name = e.target.value;
                                                    setCourseStructure({ ...courseStructure, modules: newModules });
                                                }}
                                                className="bg-transparent font-black text-zinc-900 dark:text-white border-none focus:ring-0 p-0 text-lg tracking-tight flex-1"
                                                placeholder="Module Name"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newModules = courseStructure.modules.filter((_, idx) => idx !== mIdx);
                                                    setCourseStructure({ ...courseStructure, modules: newModules });
                                                }}
                                                className="p-2 text-zinc-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-3 pl-4">
                                            {module.topics.map((topic, tIdx) => (
                                                <div key={topic.id} className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-500/50 transition-all cursor-pointer group/topic">
                                                    <div className={`w-2 h-2 rounded-full ${topic.content ? 'bg-blue-500 shadow-sm shadow-blue-500/40' : 'bg-zinc-300 dark:bg-zinc-500'}`} />
                                                    <span className="flex-1 text-sm font-bold text-zinc-700 dark:text-white">{topic.name}</span>

                                                    <div className="flex gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTopic({ moduleId: module.id, topicId: topic.id });
                                                                setTempTopicData({
                                                                    name: topic.name,
                                                                    instructions: topic.customInstructions || '',
                                                                    content: topic.content || ''
                                                                });
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/50 transition-all shadow-sm"
                                                            title="Refine Topic"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newModules = [...courseStructure.modules];
                                                                newModules[mIdx].topics = newModules[mIdx].topics.filter((_, idx) => idx !== tIdx);
                                                                setCourseStructure({ ...courseStructure, modules: newModules });
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500/50 transition-all shadow-sm"
                                                            title="Remove Topic"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    const newModules = [...courseStructure.modules];
                                                    newModules[mIdx].topics.push({
                                                        id: `topic-${Date.now()}`,
                                                        name: 'Proposed Topic'
                                                    });
                                                    setCourseStructure({ ...courseStructure, modules: newModules });
                                                }}
                                                className="text-[10px] font-black text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-widest flex items-center gap-2 mt-4 ml-1 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" /> Append Topic
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    setCourseStructure({
                                        ...courseStructure,
                                        modules: [...courseStructure.modules, {
                                            id: `mod-${Date.now()}`,
                                            name: 'New Module Architecture',
                                            topics: []
                                        }]
                                    });
                                }}
                                className="w-full py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-100 rounded-[2rem] text-zinc-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3"
                            >
                                <Plus className="w-4 h-4" /> Add Structural Module
                            </button>

                            <button
                                onClick={generateFullCourse}
                                disabled={isProcessing}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[1.5rem] hover:shadow-2xl hover:shadow-blue-500/40 transition-all font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-500/20 tracking-tight"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Deployment Active ({generationProgress}%)
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 fill-current" /> Deploy Full Framework
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
                            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-[2.5rem] flex items-center justify-center mb-8 border border-zinc-200 dark:border-zinc-700">
                                <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                            </div>
                            <p className="font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] text-xs">Awaiting Source Ingestion</p>
                        </div>
                    )}
                </div>

                {/* Topic Customization Modal */}
                {editingTopic && (
                    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-blue-50 overflow-hidden">
                            <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Edit2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">Refine Intelligence</h3>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Topic Level Deep Dive</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingTopic(null)} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-600 bg-white border border-zinc-200 rounded-xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-10 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 ml-1">Topic Label</label>
                                    <input
                                        type="text"
                                        value={tempTopicData.name}
                                        onChange={(e) => setTempTopicData(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-bold text-zinc-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 ml-1">Behavioral Instructions</label>
                                    <textarea
                                        value={tempTopicData.instructions}
                                        onChange={(e) => setTempTopicData(p => ({ ...p, instructions: e.target.value }))}
                                        placeholder="e.g., Use industrial tone, add complex formulas, focus on case studies..."
                                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none text-sm font-medium h-24 resize-none text-zinc-700"
                                    />
                                </div>

                                <div className="bg-zinc-950 rounded-[2rem] overflow-hidden flex flex-col h-[400px] border border-zinc-800 shadow-inner group">
                                    <div className="bg-white/5 px-8 py-4 border-b border-white/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Workspace Output</span>
                                        <button
                                            onClick={generateSingleTopic}
                                            disabled={isProcessing}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                        >
                                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                                            {tempTopicData.content ? "Override Content" : "Synthesize Draft"}
                                        </button>
                                    </div>
                                    <textarea
                                        value={tempTopicData.content}
                                        onChange={(e) => setTempTopicData(p => ({ ...p, content: e.target.value }))}
                                        placeholder="AI generated intelligence will manifest here..."
                                        className="flex-1 p-8 resize-none border-none outline-none font-mono text-xs bg-transparent text-zinc-400 leading-relaxed custom-scrollbar selection:bg-blue-600 selection:text-white"
                                    />
                                </div>
                            </div>

                            <div className="p-8 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-4">
                                <button
                                    onClick={() => setEditingTopic(null)}
                                    className="px-8 py-3 text-zinc-500 hover:text-zinc-700 font-black text-[10px] uppercase tracking-widest transition-colors"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    onClick={() => {
                                        if (!courseStructure) return;
                                        const newModules = courseStructure.modules.map(m => {
                                            if (m.id === editingTopic.moduleId) {
                                                return {
                                                    ...m,
                                                    topics: m.topics.map(t => {
                                                        if (t.id === editingTopic.topicId) {
                                                            return {
                                                                ...t,
                                                                name: tempTopicData.name,
                                                                instructions: tempTopicData.instructions,
                                                                content: tempTopicData.content
                                                            };
                                                        }
                                                        return t;
                                                    })
                                                };
                                            }
                                            return m;
                                        });
                                        setCourseStructure({ ...courseStructure, modules: newModules });
                                        setEditingTopic(null);
                                    }}
                                    className="px-10 py-3 bg-zinc-900 text-white rounded-2xl hover:bg-black transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl"
                                >
                                    <Save className="w-4 h-4" /> Commit Refinements
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Final Markdown Preview/Download Modal */}
                {generatedCourse && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <div className="bg-zinc-950 rounded-[3rem] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-800/50">
                            <div className="p-10 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-green-500 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-green-500/20">
                                        <CheckCircle2 className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white tracking-tight leading-none">Dataset Finalized</h2>
                                        <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mt-2">{courseStructure?.title} is ready for deployment</p>
                                    </div>
                                </div>
                                <button onClick={() => setGeneratedCourse(null)} className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800 rounded-2xl transition-all hover:bg-zinc-800">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 bg-zinc-950 flex justify-center">
                                <div className="w-full max-w-3xl aspect-square bg-zinc-950 flex flex-col rounded-[2rem] border border-zinc-800 shadow-2xl shrink-0 overflow-hidden">
                                    <div className="px-10 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Metadata Payload Preview</span>
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{Math.round(generatedCourse.length / 1024)} KB Payload</span>
                                    </div>
                                    <textarea
                                        value={generatedCourse}
                                        onChange={(e) => setGeneratedCourse(e.target.value)}
                                        className="flex-1 w-full p-12 resize-none border-none focus:ring-0 font-mono text-xs text-zinc-400 bg-transparent leading-relaxed outline-none custom-scrollbar selection:bg-blue-600 selection:text-white"
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                            <div className="shrink-0 p-10 border-t border-zinc-800 bg-zinc-900/30 flex justify-end gap-6 z-10">
                                <button
                                    onClick={() => {
                                        const blob = new Blob([generatedCourse], { type: 'text/markdown' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${courseStructure?.title.replace(/\s+/g, '_')}_Framework.md`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    }}
                                    className="px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-700 transition-all font-black text-sm uppercase tracking-widest flex items-center gap-4 shadow-2xl shadow-blue-500/30"
                                >
                                    <FileText className="w-6 h-6" /> Export Assets
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
