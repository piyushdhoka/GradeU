"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, ChevronDown, ChevronRight, Loader2, Sparkles, BookOpen, GraduationCap, FileText, CheckCircle2, AlertCircle, BrainCircuit, ListChecks, RefreshCcw, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Module {
  id: string;
  name: string;
  topics: { name: string; content: string }[]; // Updated topics array to object array
  quiz: QuizQuestion[];
  labs?: { title: string; url: string }[]; // New: Labs for this module
  isOpen?: boolean;
}

const NLP_LABS = [
  { title: "Text Basics", url: "https://vulnarable-labs.onrender.com/lab/nlp/text-basics" },
  { title: "Preprocessing", url: "https://vulnarable-labs.onrender.com/lab/nlp/preprocessing" },
  { title: "Vectorization", url: "https://vulnarable-labs.onrender.com/lab/nlp/vectorization" },
  { title: "Classification", url: "https://vulnarable-labs.onrender.com/lab/nlp/classification" },
  { title: "Topic Modeling", url: "https://vulnarable-labs.onrender.com/lab/nlp/topic-modeling" },
  { title: "Embeddings", url: "https://vulnarable-labs.onrender.com/lab/nlp/embeddings" },
  { title: "Sentiment Analysis", url: "https://vulnarable-labs.onrender.com/lab/nlp/sentiment" },
  { title: "Named Entity Recognition (NER)", url: "https://vulnarable-labs.onrender.com/lab/nlp/ner" },
  { title: "Resume Parser", url: "https://vulnarable-labs.onrender.com/lab/nlp/resume-parser" },
  { title: "Neural Networks", url: "https://vulnarable-labs.onrender.com/lab/nlp/neural-net" },
  { title: "Text Generation", url: "https://vulnarable-labs.onrender.com/lab/nlp/text-gen" }
];

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
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
    quiz?: QuizQuestion[];
  }[];
  finalAssessment?: QuizQuestion[];
  totalPages: number;
}

export default function GeneratorPage() {
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [generalQuiz, setGeneralQuiz] = useState<QuizQuestion[]>([]); // New State
  const [finalAssessment, setFinalAssessment] = useState<QuizQuestion[]>([]); // Final Assessment State
  const [currentModule, setCurrentModule] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [progress, setProgress] = useState('');
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState({
    quiz: true,
    modules: true,
    finalAssessment: true,
    preview: false
  });
  const [syllabusText, setSyllabusText] = useState('');
  const [isSyllabusEdited, setIsSyllabusEdited] = useState(false);

  const addModule = () => {
    if (currentModule.trim()) {
      setModules([...modules, { id: Date.now().toString(), name: currentModule, topics: [], quiz: [], labs: [], isOpen: false }]);
      setCurrentModule('');
    }
  };


  const removeModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
  };

  const toggleModule = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, isOpen: !m.isOpen } : m));
  };

  const updateModuleQuizQuestion = (moduleId: string, qId: string, field: keyof QuizQuestion, value: any) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          quiz: m.quiz.map(q => q.id === qId ? { ...q, [field]: value } : q)
        };
      }
      return m;
    }));
  };

  const updateModuleQuizOption = (moduleId: string, qId: string, oIndex: number, value: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          quiz: m.quiz.map(q => {
            if (q.id === qId) {
              const newOptions = [...q.options];
              newOptions[oIndex] = value;
              return { ...q, options: newOptions };
            }
            return q;
          })
        };
      }
      return m;
    }));
  };

  const addQuizToModule = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          quiz: [...m.quiz, {
            id: Date.now().toString(),
            question: 'New Question',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0
          }],
          isOpen: true
        };
      }
      return m;
    }));
  };

  const removeQuizFromModule = (moduleId: string, qId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          quiz: m.quiz.filter(q => q.id !== qId)
        };
      }
      return m;
    }));
  };

  const addLabToModule = (lab: { title: string; url: string }, moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        // Check if lab already exists
        if (m.labs?.some(l => l.url === lab.url)) return m;
        return {
          ...m,
          labs: [...(m.labs || []), lab]
        };
      }
      return m;
    }));
  };

  const removeLabFromModule = (moduleId: string, labUrl: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          labs: m.labs?.filter(l => l.url !== labUrl) || []
        };
      }
      return m;
    }));
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setGenerationLog(prev => [...prev, logMessage]);
  };

  const getApiKey = () => {
    const keys = [
      process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_1,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_2,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_3,
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3
    ].filter(k => k && k.length > 10 && k !== 'your_api_key_here');

    if (keys.length === 0) return '';
    return keys[Math.floor(Math.random() * keys.length)];
  };

  const generateStructure = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('No valid API keys found in .env file');
      return;
    }

    if (!courseTitle.trim()) {
      setError('Please enter a course title first');
      return;
    }

    setIsGeneratingStructure(true);
    setError('');

    try {
      const prompt = `Generate a comprehensive course structure for: "${courseTitle}".
Return a JSON object with:
1. "modules": array of objects. Each module has:
    - "name": string (Module Name)
    - "topics": array of objects (Sub-topics), cover the module comprehensively. Each object:
        - "name": string (Topic Name)
        - "content": string (Brief summary of what this topic covers, approx 1-2 sentences)
    - "quiz": array of 3 objects (Module specific quiz), each having:
        - "question": string
        - "options": array of 4 strings
        - "correctAnswer": number (0-3 index)
2. "generalQuiz": array of objects. An INITIAL general course assessment based on the Course Title.
   - The number of questions must be EXACTLY equal to the number of modules generated.
   - "question": string
   - "options": array of 4 strings
   - "correctAnswer": number (0-3 index)
3. "finalAssessment": array of objects. A COMPREHENSIVE Final Assessment based on the Course Title (approx 20 questions).
   - "question": string
   - "options": array of 4 strings
   - "correctAnswer": number (0-3 index)

Return ONLY valid JSON. Do not use markdown formatting. Do not include trailing commas. Ensure valid JSON syntax.`;

      const response = await callLLM(apiKey, prompt);

      // Robust JSON extraction and parsing
      let cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];

      let data;
      try {
        data = JSON.parse(cleaned);
      } catch (e) {
        console.warn('Initial JSON parse failed, attempting repairs...', e);
        // Attempt to fix common JSON errors
        // 1. Remove trailing commas
        const fixed = cleaned.replace(/,(\s*[}\]])/g, '$1');
        try {
          data = JSON.parse(fixed);
        } catch (e2) {
          console.error('JSON Repair failed:', e2);
          // One last desperate attempt: if it looks like it was truncated (no closing brace)
          // This is harder to fix safely without a library, so we will throw for now but log the content
          console.log('Failed JSON content:', cleaned);
          throw new Error('Failed to parse (and repair) generated JSON.');
        }
      }

      if (data.modules && Array.isArray(data.modules)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newModules = data.modules.map((m: any) => ({
          id: uuidv4(),
          name: m.name,
          topics: m.topics?.map((t: any) => ({
            name: t.name || t, // Fallback if still string
            content: t.content || ''
          })) || [],
          quiz: m.quiz?.map((q: any) => ({ ...q, id: uuidv4() })) || [],
          labs: [], // Initialize labs
          isOpen: true
        }));

        // Parse General Quiz
        const newGeneralQuiz = data.generalQuiz?.map((q: any) => ({ ...q, id: uuidv4() })) || [];

        // Parse Final Assessment
        const newFinalAssessment = data.finalAssessment?.map((q: any) => ({ ...q, id: uuidv4() })) || [];

        setModules(newModules);
        setGeneralQuiz(newGeneralQuiz); // Set State
        setFinalAssessment(newFinalAssessment); // Set Final Assessment State
        setGenerationLog(prev => [...prev, `Structure generated: ${newModules.length} modules, ${newGeneralQuiz.length} general questions, ${newFinalAssessment.length} final questions.`]);
      }

    } catch (err) {
      setError('Failed to generate structure. Please try again.');
      console.error(err);
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  const generateCourse = async () => {
    if (!courseTitle || modules.length === 0) {
      setError('Please provide course title, and at least one module');
      return;
    }

    setIsGenerating(true);
    setProgress('Initializing Production Pipeline...');
    setGenerationLog([]);
    setError('');

    try {
      addLog('🚀 Starting Production-Grade Pipeline');
      addLog(`Course: ${courseTitle}`);
      addLog(`Sending ${modules.length} modules to secure background queue...`);

      const response = await fetch('/api/generate/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle,
          modules: modules.map(m => ({
            name: m.name,
            topics: m.topics, // Pass topics to API
            quiz: m.quiz,
            labs: m.labs // Pass labs to API
          })),
          generalQuiz: generalQuiz, // Add to payload
          finalAssessment: finalAssessment // Add Final Assessment to payload
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to queue job');
      }

      const jobId = data.jobId;
      addLog(`✓ Job Queued: ${jobId}`);
      addLog('Polling for progress...');

      // Start Polling
      const pollJob = async () => {
        try {
          const pollResp = await fetch(`/api/jobs/${jobId}`);
          const pollData = await pollResp.json();

          if (!pollData.success) throw new Error('Polling failed');

          const job = pollData.job;
          setProgress(`${job.status}: ${job.progress}%`);

          if (job.current_module) {
            addLog(`Processing: ${job.current_module} (${job.progress}%)`);
          }

          if (job.status === 'COMPLETED') {
            addLog(`\n🎉 SUCCESS! Course generated and indexed.`);
            setGeneratedCourse({
              courseTitle,
              description: 'Course successfully processed via secure background queue and stored in Supabase.',
              modules: modules.map(m => ({
                moduleName: m.name,
                topics: m.topics.map(t => ({
                  topicName: t.name, // Use name as topicName
                  content: t.content
                })),
                quiz: m.quiz
              })),
              finalAssessment: finalAssessment,
              totalPages: modules.length * 5
            });
            setIsGenerating(false);
            return;
          }

          if (job.status === 'FAILED') {
            throw new Error(job.error || 'Job worker failed');
          }

          // Continue polling
          setTimeout(pollJob, 3000);
        } catch (pollError: any) {
          setError(pollError.message);
          setIsGenerating(false);
        }
      };

      pollJob();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Generation error:', error);
      addLog(`\n❌ ERROR: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const callLLM = async (key: string, prompt: string): Promise<string> => {
    const isGroq = key.startsWith('gsk_');

    if (isGroq) {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama3-70b-8192',
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } else {
      // Gemini Logic
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
            maxOutputTokens: 8192,
            topP: 0.95,
            topK: 40
          }
        })
      });

      if (response.status === 503) {
        console.warn('Model overloaded (503). Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callLLM(key, prompt);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      throw new Error(`Invalid response structure: ${JSON.stringify(data)}`);
    }
  };

  useEffect(() => {
    if (!isSyllabusEdited) {
      const generatedText = `COURSE: ${courseTitle}

MODULES:
${modules.map((m, i) => `Module ${i + 1}: ${m.name}
  Topics:
${m.topics && m.topics.length > 0 ? m.topics.map(t => `  - ${t.name}: ${t.content}`).join('\n') : '  - (No topics defined yet)'}
  
  Quiz Questions: ${m.quiz?.length || 0}`).join('\n\n')}`;

      setSyllabusText(generatedText);
    }
  }, [modules, generalQuiz, courseTitle, isSyllabusEdited]);

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

      if (mod.quiz && mod.quiz.length > 0) {
        markdownContent += `### Module Quiz\n\n`;
        mod.quiz.forEach((q, idx) => {
          markdownContent += `**${idx + 1}. ${q.question}**\n`;
          q.options.forEach((opt, oIdx) => {
            markdownContent += `- [${oIdx === q.correctAnswer ? 'x' : ' '}] ${opt}\n`;
          });
          markdownContent += `\n> Correct Answer: ${q.options[q.correctAnswer]}\n\n`;
        });
        markdownContent += `---\n\n`;
      }
    });

    if (generatedCourse.finalAssessment && generatedCourse.finalAssessment.length > 0) {
      markdownContent += `\n---\n\n`;
      markdownContent += `# Final Assessment\n\n`;
      generatedCourse.finalAssessment.forEach((q, idx) => {
        markdownContent += `**${idx + 1}. ${q.question}**\n`;
        q.options.forEach((opt, oIdx) => {
          markdownContent += `- [${oIdx === q.correctAnswer ? 'x' : ' '}] ${opt}\n`;
        });
        markdownContent += `\n> Correct Answer: ${q.options[q.correctAnswer]}\n\n`;
      });
    }

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
    <div className="min-h-full bg-white dark:bg-zinc-950 p-8 transition-colors">
      <div className="w-full max-w-[95%] mx-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/40 p-10 transition-colors">
          <div className="flex items-center gap-4 mb-10 pb-10 border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">AI Course Generator</h1>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] mt-2">Enterprise Edition v3.3</span>
            </div>
            <div className="ml-auto">
              <Link href="/generate/upload" className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 shadow-sm">
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
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                    Course Objectives & Title
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g., Advanced Quantum Computing for Beginners"
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none text-zinc-900 dark:text-white font-bold placeholder-zinc-400 dark:placeholder-slate-600"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={generateStructure}
                    disabled={isGeneratingStructure || !courseTitle}
                    className="h-[60px] px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isGeneratingStructure ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    Auto-Plan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Curriculum Modules (6 topics each)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={currentModule}
                    onChange={(e) => setCurrentModule(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addModule()}
                    placeholder="e.g., Introduction to Qubits"
                    className="flex-1 px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none text-zinc-900 dark:text-white font-bold placeholder-zinc-400 dark:placeholder-slate-600"
                  />
                  <button
                    onClick={addModule}
                    disabled={isGenerating}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="w-5 h-5" />
                    Add
                  </button>
                </div>
              </div>

              {/* NLP Labs Catalog */}
              {(courseTitle.toLowerCase().includes('nlp') || courseTitle.toLowerCase().includes('natural language processing')) && modules.length > 0 && (
                <div className="mt-8 border border-indigo-200 dark:border-indigo-800 rounded-2xl overflow-hidden shadow-sm transition-all bg-indigo-50/50 dark:bg-indigo-900/10">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">NLP Hands-On Labs</h3>
                        <p className="text-[10px] text-zinc-500 dark:text-indigo-300 font-bold uppercase tracking-widest mt-1">
                          Interactive Labs detected for this topic
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {NLP_LABS.map((lab, idx) => (
                        <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{lab.title}</h4>
                            <a href={lab.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">View</a>
                          </div>

                          <div className="mt-auto">
                            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Assign to Module:</label>
                            <select
                              className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-2 focus:ring-indigo-500"
                              onChange={(e) => {
                                if (e.target.value) {
                                  addLabToModule(lab, e.target.value);
                                  e.target.value = ""; // Reset select
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Select Module...</option>
                              {modules.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}



              {/* Section 1: Initial Assessment */}
              {generalQuiz.length > 0 && (
                <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all">
                  <button
                    onClick={() => setOpenSections(prev => ({ ...prev, quiz: !prev.quiz }))}
                    className="w-full flex items-center justify-between p-6 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Initial Assessment</h3>
                        <p className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {generalQuiz.length} Questions • Base Knowledge Check
                        </p>
                      </div>
                    </div>
                    {openSections.quiz ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>

                  {openSections.quiz && (
                    <div className="p-6 bg-zinc-50 dark:bg-black/20 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                      {generalQuiz.map((q, qIdx) => (
                        <div key={q.id} className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-indigo-500/30 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 mt-1 shrink-0">
                              {qIdx + 1}
                            </div>
                            <div className="flex-1 space-y-4">
                              <input
                                value={q.question}
                                onChange={(e) => {
                                  const newQuiz = [...generalQuiz];
                                  newQuiz[qIdx].question = e.target.value;
                                  setGeneralQuiz(newQuiz);
                                }}
                                className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-bold border-none p-0 focus:ring-0 placeholder-zinc-400 dark:placeholder-zinc-600"
                                placeholder="Question text..."
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options.map((option, oIdx) => (
                                  <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${q.correctAnswer === oIdx ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'}`}>
                                    <input
                                      type="radio"
                                      name={`gen-q-${q.id}`}
                                      checked={q.correctAnswer === oIdx}
                                      onChange={() => {
                                        const newQuiz = [...generalQuiz];
                                        newQuiz[qIdx].correctAnswer = oIdx;
                                        setGeneralQuiz(newQuiz);
                                      }}
                                      className="w-4 h-4 text-green-500 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:ring-green-500/20"
                                    />
                                    <input
                                      value={option}
                                      onChange={(e) => {
                                        const newQuiz = [...generalQuiz];
                                        newQuiz[qIdx].options[oIdx] = e.target.value;
                                        setGeneralQuiz(newQuiz);
                                      }}
                                      className="block w-full bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setGeneralQuiz(prev => prev.filter(item => item.id !== q.id));
                              }}
                              className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setGeneralQuiz(prev => [...prev, {
                            id: uuidv4(),
                            question: "New Initial Question",
                            options: ["Option A", "Option B", "Option C", "Option D"],
                            correctAnswer: 0
                          }]);
                        }}
                        className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-indigo-500 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Initial Question
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Section 2: Modules */}
              {modules.length > 0 && (
                <div className="mt-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all">
                  <button
                    onClick={() => setOpenSections(prev => ({ ...prev, modules: !prev.modules }))}
                    className="w-full flex items-center justify-between p-6 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <ListChecks className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Course Modules</h3>
                        <p className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {modules.length} Modules • Topics & Quizzes
                        </p>
                      </div>
                    </div>
                    {openSections.modules ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>

                  {openSections.modules && (
                    <div className="p-6 bg-zinc-50 dark:bg-black/20 border-t border-zinc-200 dark:border-zinc-800 grid gap-4">
                      {modules.map((module, idx) => (
                        <div key={module.id} className={`bg-white dark:bg-zinc-800/50 rounded-2xl border ${module.isOpen ? 'border-blue-500/30' : 'border-zinc-200 dark:border-zinc-700'} transition-all overflow-hidden shadow-sm`}>
                          <div
                            className="flex justify-between items-center px-6 py-5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
                            onClick={() => toggleModule(module.id)}
                          >
                            <div className="flex items-center gap-4">
                              <span className="w-8 h-8 bg-zinc-100 dark:bg-blue-500/10 border border-zinc-200 dark:border-blue-500/20 rounded-lg flex items-center justify-center text-xs font-black text-zinc-500 dark:text-blue-400">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-white">{module.name}</p>
                                <p className="text-[10px] text-zinc-500 dark:text-slate-500 font-black uppercase tracking-widest mt-1">
                                  {module.topics?.length || 0} Topics • {module.quiz?.length || 0} Quiz Questions
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {module.isOpen ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                              <button
                                onClick={(e) => { e.stopPropagation(); removeModule(module.id); }}
                                disabled={isGenerating}
                                className="p-2 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {module.isOpen && (
                            <div className="px-6 pb-8 pt-2">
                              <div className="space-y-8">
                                {/* Assigned Labs Section */}
                                {module.labs && module.labs.length > 0 && (
                                  <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <label className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                      <Sparkles className="w-3 h-3" /> Assigned Labs
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                      {module.labs.map((lab, lIdx) => (
                                        <div key={lIdx} className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 shadow-sm">
                                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{lab.title}</span>
                                          <button
                                            onClick={() => removeLabFromModule(module.id, lab.url)}
                                            className="text-zinc-400 hover:text-red-500"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Topics Section */}
                                <div>
                                  <label className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3 block">
                                    Planned Topics
                                  </label>
                                  <div className="space-y-3">
                                    {module.topics && module.topics.length > 0 ? (
                                      module.topics.map((topic, tIdx) => (
                                        <div key={tIdx} className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                                            <input
                                              value={topic.name}
                                              onChange={(e) => {
                                                const newModules = [...modules];
                                                newModules.find(m => m.id === module.id)!.topics[tIdx].name = e.target.value;
                                                setModules(newModules);
                                              }}
                                              className="w-full bg-transparent border-none text-sm font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-0 p-0"
                                              placeholder="Topic Name"
                                            />
                                          </div>
                                          <textarea
                                            value={topic.content}
                                            onChange={(e) => {
                                              const newModules = [...modules];
                                              newModules.find(m => m.id === module.id)!.topics[tIdx].content = e.target.value;
                                              setModules(newModules);
                                            }}
                                            className="w-full bg-transparent border-l-2 border-zinc-200 dark:border-zinc-800/50 pl-3 text-xs text-zinc-500 dark:text-zinc-400 focus:outline-none focus:ring-0 resize-none h-auto min-h-[3rem] leading-relaxed"
                                            placeholder="Topic brief description (e.g. key concepts covered)..."
                                          />
                                          <button
                                            onClick={() => {
                                              const newModules = [...modules];
                                              const mod = newModules.find(m => m.id === module.id);
                                              if (mod) {
                                                mod.topics = mod.topics.filter((_, i) => i !== tIdx);
                                                setModules(newModules);
                                              }
                                            }}
                                            className="self-end text-[10px] text-red-300 hover:text-red-500 font-bold uppercase tracking-widest transition-colors"
                                          >
                                            Remove Topic
                                          </button>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-zinc-400 italic">No specific topics defined (AI will generate automatically)</p>
                                    )}
                                    <button
                                      onClick={() => {
                                        const newModules = [...modules];
                                        const mod = newModules.find(m => m.id === module.id);
                                        if (mod) {
                                          mod.topics.push({ name: 'New Topic', content: '' });
                                          setModules(newModules);
                                        }
                                      }}
                                      className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Topic
                                    </button>
                                  </div>
                                </div>

                                {/* Module Quiz Section */}
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">
                                      Module Quiz
                                    </label>
                                    <button
                                      onClick={() => addQuizToModule(module.id)}
                                      className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:text-blue-500 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                      <Plus className="w-3 h-3" /> Add Question
                                    </button>
                                  </div>

                                  <div className="grid gap-3">
                                    {module.quiz?.map((q, qIdx) => (
                                      <div key={q.id} className="bg-white dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <div className="flex items-start gap-4">
                                          <div className="text-[10px] font-black text-zinc-400 mt-2">Q{qIdx + 1}</div>
                                          <div className="flex-1 space-y-4">
                                            <input
                                              value={q.question}
                                              onChange={(e) => updateModuleQuizQuestion(module.id, q.id, 'question', e.target.value)}
                                              className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-bold border-none p-0 focus:ring-0 placeholder-zinc-400 dark:placeholder-zinc-600"
                                              placeholder="Question text..."
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {q.options.map((option, oIdx) => (
                                                <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${q.correctAnswer === oIdx ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'}`}>
                                                  <input
                                                    type="radio"
                                                    name={`mod-${module.id}-q-${q.id}`}
                                                    checked={q.correctAnswer === oIdx}
                                                    onChange={() => updateModuleQuizQuestion(module.id, q.id, 'correctAnswer', oIdx)}
                                                    className="w-4 h-4 text-green-500 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:ring-green-500/20"
                                                  />
                                                  <input
                                                    value={option}
                                                    onChange={(e) => updateModuleQuizOption(module.id, q.id, oIdx, e.target.value)}
                                                    className="block w-full bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none"
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => removeQuizFromModule(module.id, q.id)}
                                            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {(!module.quiz || module.quiz.length === 0) && (
                                      <div className="text-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                        <p className="text-xs text-zinc-400">No quiz questions for this module yet.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section: Final Assessment */}
              {finalAssessment.length > 0 && (
                <div className="mt-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all">
                  <button
                    onClick={() => setOpenSections(prev => ({ ...prev, finalAssessment: !prev.finalAssessment }))}
                    className="w-full flex items-center justify-between p-6 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <ListChecks className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Final Assessment</h3>
                        <p className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {finalAssessment.length} Questions • Comprehensive Exam
                        </p>
                      </div>
                    </div>
                    {openSections.finalAssessment ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>

                  {openSections.finalAssessment && (
                    <div className="p-6 bg-zinc-50 dark:bg-black/20 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                      {finalAssessment.map((q, qIdx) => (
                        <div key={q.id} className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-orange-500/30 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 mt-1 shrink-0">
                              {qIdx + 1}
                            </div>
                            <div className="flex-1 space-y-4">
                              <input
                                value={q.question}
                                onChange={(e) => {
                                  const newQuiz = [...finalAssessment];
                                  newQuiz[qIdx].question = e.target.value;
                                  setFinalAssessment(newQuiz);
                                }}
                                className="w-full bg-transparent text-zinc-900 dark:text-white text-sm font-bold border-none p-0 focus:ring-0 placeholder-zinc-400 dark:placeholder-zinc-600"
                                placeholder="Question text..."
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options.map((option, oIdx) => (
                                  <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${q.correctAnswer === oIdx ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'}`}>
                                    <input
                                      type="radio"
                                      name={`final-q-${q.id}`}
                                      checked={q.correctAnswer === oIdx}
                                      onChange={() => {
                                        const newQuiz = [...finalAssessment];
                                        newQuiz[qIdx].correctAnswer = oIdx;
                                        setFinalAssessment(newQuiz);
                                      }}
                                      className="w-4 h-4 text-green-500 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:ring-green-500/20"
                                    />
                                    <input
                                      value={option}
                                      onChange={(e) => {
                                        const newQuiz = [...finalAssessment];
                                        newQuiz[qIdx].options[oIdx] = e.target.value;
                                        setFinalAssessment(newQuiz);
                                      }}
                                      className="block w-full bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setFinalAssessment(prev => prev.filter(item => item.id !== q.id));
                              }}
                              className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setFinalAssessment(prev => [...prev, {
                            id: uuidv4(),
                            question: "New Final Assessment Question",
                            options: ["Option A", "Option B", "Option C", "Option D"],
                            correctAnswer: 0
                          }]);
                        }}
                        className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-orange-500 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Question
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: Preview */}
              {(modules.length > 0 || generalQuiz.length > 0) && (
                <div className="mt-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all">
                  <button
                    onClick={() => setOpenSections(prev => ({ ...prev, preview: !prev.preview }))}
                    className="w-full flex items-center justify-between p-6 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Curriculum Preview</h3>
                        <p className="text-[10px] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                          Live Syllabus View
                        </p>
                      </div>
                    </div>
                    {openSections.preview ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>

                  {openSections.preview && (
                    <div className="p-0 bg-zinc-950/5 dark:bg-black/40 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="w-full h-96 relative group">
                        <textarea
                          className="w-full h-full p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-slate-300 font-mono text-xs leading-relaxed resize-none focus:outline-none custom-scrollbar"
                          value={syllabusText}
                          onChange={(e) => {
                            setSyllabusText(e.target.value);
                            setIsSyllabusEdited(true);
                          }}
                          placeholder="Syllabus preview will appear here..."
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          {isSyllabusEdited && (
                            <button
                              onClick={() => setIsSyllabusEdited(false)}
                              className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                              Reset
                            </button>
                          )}
                          <div className="bg-zinc-900/10 dark:bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none">
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Live Preview</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

              <div className="bg-white dark:bg-zinc-800/50 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors">
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight leading-tight">{generatedCourse.courseTitle}</h2>
                <p className="text-zinc-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">{generatedCourse.description}</p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <p className="text-4xl font-black text-blue-600 dark:text-blue-400 leading-none">{generatedCourse.modules.length}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-slate-500 uppercase font-black tracking-widest mt-2">Modules</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                      {generatedCourse.modules.reduce((sum, m) => sum + m.topics.length, 0)}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-slate-500 uppercase font-black tracking-widest mt-2">Topics</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <p className="text-4xl font-black text-blue-600 dark:text-blue-400 leading-none">~{generatedCourse.totalPages}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-slate-500 uppercase font-black tracking-widest mt-2">Pages</p>
                  </div>
                  {generatedCourse.modules.some(m => m.quiz && m.quiz.length > 0) && (
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                      <p className="text-4xl font-black text-purple-600 dark:text-purple-400 leading-none">
                        {generatedCourse.modules.reduce((sum, m) => sum + (m.quiz?.length || 0), 0)}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-slate-500 uppercase font-black tracking-widest mt-2">Total Questions</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-950 rounded-2xl p-8 overflow-hidden shadow-2xl relative border border-zinc-200 dark:border-zinc-800 transition-colors">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest">Live Metadata Preview</span>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-zinc-500 font-mono text-xs leading-relaxed selection:bg-blue-500 selection:text-white aspect-square overflow-y-auto custom-scrollbar">
                    {JSON.stringify(generatedCourse, null, 2)}
                  </pre>
                </div>
              </div>

              <button
                onClick={() => {
                  setGeneratedCourse(null);
                  setModules([]);
                  setGeneralQuiz([]);
                  setFinalAssessment([]);
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
    </div >
  );
}
