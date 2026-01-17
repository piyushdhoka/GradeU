"use client";

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface Module {
  id: string;
  name: string;
}

interface GeneratedCourse {
  courseTitle: string;
  description: string;
  modules: {
    moduleName: string;
    topics: {
      topicName: string;
      content: string; // Markdown content
    }[];
  }[];
  totalPages: number;
}

export default function GeneratorPage() {
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [currentModule, setCurrentModule] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [progress, setProgress] = useState('');
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addModule = () => {
    if (currentModule.trim()) {
      setModules([...modules, { id: Date.now().toString(), name: currentModule }]);
      setCurrentModule('');
    }
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setGenerationLog(prev => [...prev, logMessage]);
  };

  const generateCourse = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      setError('Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file');
      return;
    }

    if (!courseTitle || modules.length === 0) {
      setError('Please provide course title, and at least one module');
      return;
    }

    setIsGenerating(true);
    setProgress('Initializing...');
    setGenerationLog([]);
    setError('');

    try {
      addLog('Starting course generation');
      addLog(`Course: ${courseTitle}`);
      addLog(`Modules: ${modules.length}`);

      const courseStructure: GeneratedCourse = {
        courseTitle,
        description: '',
        modules: [],
        totalPages: 0
      };

      // Test API connection first
      addLog('Testing API connection...');
      setProgress('Testing API connection...');

      try {
        await callGeminiAPI(apiKey, 'Say "OK"');
        addLog('✓ API connection successful');
      } catch (apiError) {
        addLog(`✗ API connection failed: ${apiError}`);
        throw new Error(`API Connection Failed: ${apiError instanceof Error ? apiError.message : 'Check your API key'}`);
      }

      // Generate course description
      addLog('Generating course description...');
      setProgress('Generating course description...');

      const descPrompt = `Generate a comprehensive 2-paragraph description for a course titled "${courseTitle}". Make it engaging and professional.`;
      const descResponse = await callGeminiAPI(apiKey, descPrompt);
      courseStructure.description = descResponse.trim();
      addLog('✓ Course description generated');

      let totalTopics = 0;

      // Process each module
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        addLog(`\n--- Processing Module ${i + 1}/${modules.length}: ${module.name} ---`);
        setProgress(`Module ${i + 1}/${modules.length}: ${module.name}`);

        // Generate topics for this module
        // Asking for 6 topics to balance length (Target: ~70 pages total)
        addLog('Requesting topics from AI...');
        const topicsPrompt = `For a comprehensive course titled "${courseTitle}", list exactly 6 topic names for the module "${module.name}". 
Format your response as a simple JSON array like this:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6"]

Only respond with the JSON array, nothing else.`;

        let topics: string[] = [];
        try {
          const topicsResponse = await callGeminiAPI(apiKey, topicsPrompt);
          addLog(`Raw topics response: ${topicsResponse.substring(0, 100)}...`);

          const cleaned = topicsResponse
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

          topics = JSON.parse(cleaned);

          if (!Array.isArray(topics) || topics.length === 0) {
            throw new Error('Invalid topics array');
          }

          addLog(`✓ Generated ${topics.length} topics`);
        } catch (parseError) {
          // Unused var parseError
          console.warn(parseError);
          addLog(`⚠ Topics parsing failed, using defaults`);
          topics = [
            `Introduction to ${module.name}`,
            `Core Concepts of ${module.name}`,
            `Advanced ${module.name} Techniques`,
            `Practical Applications`,
            `Best Practices and Tips`,
            `Common Challenges and Solutions`,
            `Case Studies in ${module.name}`,
            `Future Trends`,
            `Tools and Resources`,
            `Final Project`
          ];
        }

        totalTopics += topics.length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const moduleContent: any = {
          moduleName: module.name,
          topics: []
        };

        // Generate content for each topic
        for (let j = 0; j < topics.length; j++) {
          const topic = topics[j];
          setProgress(`Module ${i + 1}/${modules.length} → Topic ${j + 1}/${topics.length}`);
          addLog(`\nGenerating: "${topic}"`);

          const topicPrompt = `Create a detailed educational guide for:
Course: ${courseTitle}
Module: ${module.name}
Topic: ${topic}

Output Format: Markdown.
Target Length: Approximately 800 words.

Structure:
# ${topic}
## Introduction
(Write a detailed introduction, at least 300 words)

## Key Concepts
(Explain 5-7 key concepts in depth, use bolding for terms)

## Detailed Exploration
(This is the main body. Go deep into technical details, theories, or methodologies. Use subsections like ### as needed. Minimum 800 words.)

## Practical Examples
(Provide 3 detailed real-world examples or code snippets if applicable)

## Exercises
(List 3 comprehensive exercises for the student)

## Summary
(A solid conclusion)

IMPORTANT: Do not wrap the response in JSON. Return pure Markdown text.`;

          try {
            const topicContent = await callGeminiAPI(apiKey, topicPrompt);
            addLog(`Received ${topicContent.length} characters`);

            moduleContent.topics.push({
              topicName: topic,
              content: topicContent
            });
            addLog(`✓ Generated content for "${topic}"`);
          } catch (topicError) {
            // Unused
            console.warn(topicError);
            addLog(`⚠ Generation failed for "${topic}", using fallback`);
            moduleContent.topics.push({
              topicName: topic,
              content: `# ${topic}\n\nContent generation failed for this topic. Please regenerate or check API limits.`
            });
          }

          // Delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        courseStructure.modules.push(moduleContent);
        addLog(`✓ Module "${module.name}" completed\n`);
      }

      // Estimate pages (approx 400 words per page? ~2 pages per topic if 800 words)
      courseStructure.totalPages = Math.round(totalTopics * 2);

      setProgress('Complete!');
      addLog(`\n🎉 SUCCESS! Course generated with ${totalTopics} topics (~${courseStructure.totalPages} pages)`);
      setGeneratedCourse(courseStructure);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Generation error:', error);
      addLog(`\n❌ ERROR: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const callGeminiAPI = async (key: string, prompt: string): Promise<string> => {
    // Using gemini-2.5-flash as requested
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192, // Increased for longer output
          topP: 0.95,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error(`Invalid response structure: ${JSON.stringify(data)}`);
  };

  const downloadMarkdown = () => {
    if (!generatedCourse) return;

    let markdownContent = `# ${generatedCourse.courseTitle}\n\n`;
    markdownContent += `${generatedCourse.description}\n\n`;
    markdownContent += `---\n\n`;
    markdownContent += `## Table of Contents\n`;

    generatedCourse.modules.forEach((mod, i) => {
      markdownContent += `- [Module ${i + 1}: ${mod.moduleName}](#module-${i + 1})\n`;
      mod.topics.forEach(t => {
        markdownContent += `  - [${t.topicName}](#${t.topicName.toLowerCase().replace(/\s+/g, '-')})\n`;
      });
    });
    markdownContent += `\n---\n\n`;

    generatedCourse.modules.forEach((mod, i) => {
      markdownContent += `<a name="module-${i + 1}"></a>\n`;
      markdownContent += `# Module ${i + 1}: ${mod.moduleName}\n\n`;

      mod.topics.forEach(topic => {
        markdownContent += `${topic.content}\n\n`;
        markdownContent += `---\n\n`;
      });
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseTitle.replace(/\s+/g, '_')}_course.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 p-10">
          <div className="flex items-center gap-4 mb-10 pb-10 border-b border-zinc-800">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">AI Course Generator</h1>
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mt-2">Enterprise Edition v3.2</span>
            </div>
            <div className="ml-auto">
              <Link href="/generate/upload" className="px-6 py-3 bg-zinc-800 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-zinc-700 shadow-sm">
                <FileText className="w-4 h-4" /> Upload Document
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-red-400 text-sm uppercase tracking-wider">System Error</p>
                <p className="text-red-300 text-sm mt-1 font-medium">{error}</p>
              </div>
            </div>
          )}

          {!generatedCourse ? (
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Course Objectives & Title
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g., Advanced Quantum Computing for Beginners"
                  className="w-full px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none text-white font-bold placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Curriculum Modules (6 topics each)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={currentModule}
                    onChange={(e) => setCurrentModule(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addModule()}
                    placeholder="e.g., Introduction to Qubits"
                    className="flex-1 px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none text-white font-bold placeholder-slate-600"
                  />
                  <button
                    onClick={addModule}
                    disabled={isGenerating}
                    className="px-8 py-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="w-5 h-5" />
                    Add
                  </button>
                </div>
              </div>

              {modules.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {modules.map((module, idx) => (
                    <div key={module.id} className="flex justify-between items-center bg-zinc-800/50 px-6 py-4 rounded-2xl border border-zinc-700 group hover:border-blue-500/50 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-xs font-black text-blue-400 shadow-sm">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white">{module.name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Automated Content Draft Enabled</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeModule(module.id)}
                        disabled={isGenerating}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {modules.length > 0 && (
                <div className="space-y-4 pt-6">
                  <button
                    onClick={generateCourse}
                    disabled={isGenerating}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[1.5rem] hover:shadow-2xl hover:shadow-blue-500/30 transition-all font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 tracking-tight"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Analyzing Potential...
                      </>
                    ) : (
                      <>Generate Full Curriculum</>
                    )}
                  </button>

                  {isGenerating && (
                    <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 shadow-inner">
                      <div className="flex items-center gap-3 mb-4">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{progress}</p>
                      </div>
                      <div className="bg-black/50 rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar">
                        {generationLog.map((log, idx) => (
                          <p key={idx} className="text-[10px] text-zinc-500 font-mono leading-relaxed mb-1 selection:bg-blue-500 selection:text-white">{log}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center justify-between flex-wrap gap-4 bg-green-500/10 p-6 rounded-2xl border border-green-500/20">
                <div className="flex items-center gap-3 text-green-400">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-green-400 leading-none">Status</p>
                    <p className="text-sm font-bold mt-0.5 text-green-300">Generation Complete</p>
                  </div>
                </div>
                <button
                  onClick={downloadMarkdown}
                  className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-black flex items-center gap-2 shadow-lg shadow-blue-500/20 text-xs uppercase tracking-widest"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-8 border border-zinc-700 shadow-sm">
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">{generatedCourse.courseTitle}</h2>
                <p className="text-slate-400 mb-8 leading-relaxed font-medium">{generatedCourse.description}</p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800">
                    <p className="text-4xl font-black text-blue-400 leading-none">{generatedCourse.modules.length}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Modules</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800">
                    <p className="text-4xl font-black text-indigo-400 leading-none">
                      {generatedCourse.modules.reduce((sum, m) => sum + m.topics.length, 0)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Topics</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800">
                    <p className="text-4xl font-black text-blue-400 leading-none">~{generatedCourse.totalPages}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Pages</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 rounded-2xl p-8 overflow-hidden shadow-2xl relative border border-zinc-800">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest">Live Metadata Preview</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-zinc-500 font-mono text-xs leading-relaxed selection:bg-blue-500 selection:text-white">
                    {generatedCourse.modules[0]?.topics[0]?.content.substring(0, 800)}...
                  </pre>
                </div>
              </div>

              <button
                onClick={() => {
                  setGeneratedCourse(null);
                  setModules([]);
                  setCourseTitle('');
                  setGenerationLog([]);
                  setError('');
                }}
                className="w-full py-4 bg-zinc-800 text-slate-400 hover:bg-zinc-700 hover:text-slate-300 transition-all font-black text-xs uppercase tracking-[0.2em] rounded-2xl"
              >
                Reset Workshop
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
