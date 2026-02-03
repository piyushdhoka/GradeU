"use client";

import { useState, useEffect } from 'react';
import { getGeneratedCourses, GeneratedCourse } from '@/actions/get-generated-courses';
import { BookOpen, ChevronDown, ChevronRight, ListChecks, CheckCircle2, GraduationCap, ChevronUp } from 'lucide-react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';

export default function GeneratedCoursesSection() {
    const [courses, setCourses] = useState<GeneratedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [openCourses, setOpenCourses] = useState<Record<string, boolean>>({});
    const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function fetchCourses() {
            try {
                const data = await getGeneratedCourses();
                setCourses(data);
            } catch (error) {
                console.error("Failed to load courses", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCourses();
    }, []);

    const toggleCourse = (courseId: string) => {
        setOpenCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const toggleModule = (moduleId: string) => {
        setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const downloadTopic = async (topicName: string, path: string) => {
        if (!path) return;

        try {
            // Retrieve public URL or download directly
            // Since the path in DB is likely just the relative path 'courseId/module/topic.md'
            // We can construct a download link or content display

            // For now, let's just alert or log, as actual viewing requires a viewer component
            // But based on user request "keep expandable structure... markdown... topics", 
            // maybe I should show content inline? 
            // "Parsing the Markdown... for the Test and quiz" 
            // The user request says "showcase the course which are generated... keep expandable structure"
            // I will implement a basic download/view link strategy for now.

            const { data } = supabaseClient.storage.from('courses').getPublicUrl(path);
            if (data) {
                window.open(data.publicUrl, '_blank');
            }

        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Loading generated courses...</div>;
    }

    if (courses.length === 0) {
        return null; // Don't show section if no courses
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Generated Courses</h2>
            </div>

            <div className="space-y-4">
                {courses.map((course) => (
                    <div key={course.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all hover:border-indigo-500/30">
                        <button
                            onClick={() => toggleCourse(course.id)}
                            className="w-full flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                            <div className="flex flex-col">
                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{course.title}</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">{course.description}</p>
                            </div>
                            {openCourses[course.id] ? (
                                <ChevronUp className="w-5 h-5 text-zinc-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-zinc-400" />
                            )}
                        </button>

                        {/* Course Content */}
                        {openCourses[course.id] && (
                            <div className="p-5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                                {course.modules.length === 0 && (
                                    <p className="text-sm text-zinc-500 italic">No modules found.</p>
                                )}

                                {course.modules.map((module) => (
                                    <div key={module.id} className="border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                        <button
                                            onClick={() => toggleModule(module.id)}
                                            className="w-full flex items-center justify-between p-3 px-4 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold 
                                                    ${module.title === 'Initial Assessment' || module.title === 'Final Assessment' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                    {module.title === 'Initial Assessment' || module.title === 'Final Assessment' ? <GraduationCap className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
                                                </div>
                                                <span className="font-semibold text-sm text-zinc-700 dark:text-zinc-200">{module.title}</span>
                                            </div>
                                            {openModules[module.id] ? (
                                                <ChevronUp className="w-4 h-4 text-zinc-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            )}
                                        </button>

                                        {/* Module Details (Topics & Quiz) */}
                                        {openModules[module.id] && (
                                            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-black/20 space-y-6">

                                                {/* Topics */}
                                                {module.topics && module.topics.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">Topics</h4>
                                                        <ul className="space-y-2">
                                                            {module.topics.map((topic, idx) => (
                                                                <li key={idx} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 flex-shrink-0" />
                                                                    <span className="flex-1">{topic.name}</span>
                                                                    {topic.path && (
                                                                        <button
                                                                            onClick={() => downloadTopic(topic.name, topic.path)}
                                                                            className="text-indigo-500 hover:text-indigo-600 text-xs font-bold uppercase tracking-wide"
                                                                        >
                                                                            View
                                                                        </button>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Quiz */}
                                                {module.quiz && module.quiz.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                                                            {module.title.includes('Assessment') ? 'Assessment Questions' : 'Module Quiz'}
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {module.quiz.map((q, qIdx) => (
                                                                <div key={q.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                                                                        {qIdx + 1}. {q.question}
                                                                    </p>
                                                                    <div className="grid grid-cols-1 gap-1 pl-2">
                                                                        {q.options.map((opt, oIdx) => (
                                                                            <div key={oIdx} className={`text-xs flex items-center gap-2 ${oIdx === q.correct_option ? 'text-green-600 dark:text-green-400 font-bold' : 'text-zinc-500 dark:text-zinc-500'}`}>
                                                                                {oIdx === q.correct_option ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 block" />}
                                                                                {opt}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {(!module.topics?.length && !module.quiz?.length) && (
                                                    <p className="text-xs text-zinc-400 italic">No content available for this module.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
