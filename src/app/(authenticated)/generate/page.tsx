"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, ChevronDown, ChevronRight, Loader2, Sparkles, BookOpen, GraduationCap, FileText, CheckCircle2, AlertCircle, BrainCircuit, ListChecks, RefreshCcw, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Module {
  id: string;
  name: string;
  topics: string[]; // Added topics array
  quiz: QuizQuestion[];
  isOpen?: boolean;
}

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
  totalPages: number;
}

export default function GeneratorPage() {
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [generalQuiz, setGeneralQuiz] = useState<QuizQuestion[]>([]); // New State
  const [currentModule, setCurrentModule] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [progress, setProgress] = useState('');
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addModule = () => {
    if (currentModule.trim()) {
      if (currentModule.trim()) {
        setModules([...modules, { id: Date.now().toString(), name: currentModule, topics: [], quiz: [], isOpen: false }]);
        setCurrentModule('');
      } setCurrentModule('');
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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setGenerationLog(prev => [...prev, logMessage]);
  };

  const generateStructure = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY_1 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_2 || process.env.NEXT_PUBLIC_GEMINI_API_KEY_3 || process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      setError('Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file');
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
    - "topics": array of 3 strings (Sub-topics)
    - "quiz": array of 3 objects (Module specific quiz)
2. "generalQuiz": array of objects. An INITIAL general course assessment based on the Course Title.
   - The number of questions must be EXACTLY equal to the number of modules generated.
   - "question": string
   - "options": array of 4 strings
   - "correctAnswer": number (0-3 index)

Each quiz object has:
    - "question": string
    - "options": array of 4 strings
    - "correctAnswer": number (0-3 index)

Return ONLY valid JSON. Do not use markdown formatting.`;

      const response = await callGeminiAPI(apiKey, prompt);

      // Robust JSON extraction
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const cleaned = jsonMatch ? jsonMatch[0] : response.replace(/```json/g, '').replace(/```/g, '').trim();

      const data = JSON.parse(cleaned);

      if (data.modules && Array.isArray(data.modules)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newModules = data.modules.map((m: any) => ({
          id: uuidv4(),
          name: m.name,
          topics: m.topics || [],
          quiz: m.quiz?.map((q: any) => ({ ...q, id: uuidv4() })) || [],
          isOpen: true
        }));

        // Parse General Quiz
        const newGeneralQuiz = data.generalQuiz?.map((q: any) => ({ ...q, id: uuidv4() })) || [];

        setModules(newModules);
        setGeneralQuiz(newGeneralQuiz); // Set State
        setGenerationLog(prev => [...prev, `Structure generated: ${newModules.length} modules, ${newGeneralQuiz.length} general questions.`]);
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
            quiz: m.quiz
          })),
          generalQuiz: generalQuiz // Add to payload
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
              modules: [],
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

    if (response.status === 503) {
      console.warn('Model overloaded (503). Retrying in 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return callGeminiAPI(key, prompt);
    }

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
      <div className="w-full max-w-[95%] mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 p-10">
          <div className="flex items-center gap-4 mb-10 pb-10 border-b border-zinc-800">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">AI Course Generator</h1>
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mt-2">Enterprise Edition v3.3</span>
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
              <div className="flex gap-4">
                <div className="flex-1">
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



              {/* Initial Assessment UI */}
              {generalQuiz.length > 0 && (
                <div className="mt-8 bg-zinc-900 rounded-2xl border border-indigo-500/30 overflow-hidden">
                  <div className="p-6 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Initial Assessment</h3>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Base Knowledge Check</p>
                      </div>
                    </div>
                    <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30">
                      {generalQuiz.length} Questions
                    </span>
                  </div>
                  <div className="p-6 space-y-4">
                    {generalQuiz.map((q, qIdx) => (
                      <div key={q.id} className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 mt-1 shrink-0">
                            {qIdx + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <input
                              value={q.question}
                              onChange={(e) => {
                                const newQuiz = [...generalQuiz];
                                newQuiz[qIdx].question = e.target.value;
                                setGeneralQuiz(newQuiz);
                              }}
                              className="w-full bg-transparent text-white text-sm font-bold border-none p-0 focus:ring-0 placeholder-zinc-600"
                              placeholder="Question text..."
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((option, oIdx) => (
                                <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border ${q.correctAnswer === oIdx ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
                                  <input
                                    type="radio"
                                    name={`gen-q-${q.id}`}
                                    checked={q.correctAnswer === oIdx}
                                    onChange={() => {
                                      const newQuiz = [...generalQuiz];
                                      newQuiz[qIdx].correctAnswer = oIdx;
                                      setGeneralQuiz(newQuiz);
                                    }}
                                    className="w-3 h-3 text-green-500 bg-zinc-900 border-zinc-700 focus:ring-green-500/20"
                                  />
                                  <input
                                    value={option}
                                    onChange={(e) => {
                                      const newQuiz = [...generalQuiz];
                                      newQuiz[qIdx].options[oIdx] = e.target.value;
                                      setGeneralQuiz(newQuiz);
                                    }}
                                    className="block w-full bg-transparent text-xs text-zinc-300 focus:outline-none"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setGeneralQuiz(prev => prev.filter(item => item.id !== q.id));
                            }}
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
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
                      className="w-full py-3 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Initial Question
                    </button>
                  </div>
                </div>
              )}

              {modules.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {modules.map((module, idx) => (
                    <div key={module.id} className={`bg-zinc-800/50 rounded-2xl border ${module.isOpen ? 'border-blue-500/50' : 'border-zinc-700'} transition-all overflow-hidden`}>
                      <div
                        className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-zinc-800/80"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-xs font-black text-blue-400 shadow-sm">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-white">{module.name}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                              {module.topics?.length || 0} Topics • {module.quiz?.length || 0} Quiz Questions
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); removeModule(module.id); }}
                            disabled={isGenerating}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          {module.isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </div>
                      </div>

                      {module.isOpen && (
                        <div className="px-6 pb-6 pt-2 border-t border-zinc-700/50">
                          <div className="space-y-6">
                            {/* Topics Section */}
                            <div>
                              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">
                                Planned Topics
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {module.topics?.map((topic, tIdx) => (
                                  <div key={tIdx} className="bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300">
                                    {topic}
                                  </div>
                                ))}
                                {(!module.topics || module.topics.length === 0) && (
                                  <p className="text-xs text-zinc-600 italic">No specific topics defined (AI will generate automatically)</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                  Module Quiz
                                </label>
                                <button
                                  onClick={() => addQuizToModule(module.id)}
                                  className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Question
                                </button>
                              </div>

                              <div className="grid gap-3">
                                {module.quiz?.map((q, qIdx) => (
                                  <div key={q.id} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                    <div className="flex items-start gap-4">
                                      <div className="text-[10px] font-black text-slate-500 mt-2">Q{qIdx + 1}</div>
                                      <div className="flex-1 space-y-3">
                                        <input
                                          value={q.question}
                                          onChange={(e) => updateModuleQuizQuestion(module.id, q.id, 'question', e.target.value)}
                                          className="w-full bg-transparent text-white text-sm font-bold border-none p-0 focus:ring-0 placeholder-zinc-600"
                                          placeholder="Question text..."
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {q.options.map((option, oIdx) => (
                                            <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border ${q.correctAnswer === oIdx ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
                                              <input
                                                type="radio"
                                                name={`mod-${module.id}-q-${q.id}`}
                                                checked={q.correctAnswer === oIdx}
                                                onChange={() => updateModuleQuizQuestion(module.id, q.id, 'correctAnswer', oIdx)}
                                                className="w-3 h-3 text-green-500 bg-zinc-900 border-zinc-700 focus:ring-green-500/20"
                                              />
                                              <input
                                                value={option}
                                                onChange={(e) => updateModuleQuizOption(module.id, q.id, oIdx, e.target.value)}
                                                className="block w-full bg-transparent text-xs text-zinc-300 focus:outline-none"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeQuizFromModule(module.id, q.id)}
                                        className="text-zinc-600 hover:text-red-400 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
                  {generatedCourse.modules.some(m => m.quiz && m.quiz.length > 0) && (
                    <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800">
                      <p className="text-4xl font-black text-purple-400 leading-none">
                        {generatedCourse.modules.reduce((sum, m) => sum + (m.quiz?.length || 0), 0)}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Total Questions</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-zinc-950 rounded-2xl p-8 overflow-hidden shadow-2xl relative border border-zinc-800">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest">Live Metadata Preview</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-zinc-500 font-mono text-xs leading-relaxed selection:bg-blue-500 selection:text-white aspect-square overflow-y-auto custom-scrollbar">
                    {generatedCourse.modules[0]?.topics[0]?.content}
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
    </div >
  );
}
