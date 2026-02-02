import React, { useState, useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import { labs } from '@data/labs';
import { ArrowLeft, ArrowRight, FileText, CheckCircle, Award, Terminal, Play, Shield, ChevronRight } from 'lucide-react';
import { CertificateModal } from '../Certificates/CertificateModal';
import { courseService } from '@services/courseService';
import type { Module, Course } from '@types';
import { ModuleTest } from './ModuleTest';
import { ProctoringComponent } from '../Proctoring/ProctoringComponent';
import { learningPathService } from '../../../../shared/services/learningPathService';
import { useAuth } from '@context/AuthContext';
import { useExperienceTracker } from '../../../../shared/hooks/useExperienceTracker';
import { useProctoring } from '../../../../shared/hooks/useProctoring';
import { supabase } from '@lib/supabase';
import { getApiUrl } from '@lib/apiConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';
import { useCourseStore } from '@shared/stores/useCourseStore';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    primaryColor: 'hsl(152 100% 50%)',
    primaryTextColor: '#000000',
    primaryBorderColor: 'hsl(152 100% 50%)',
    lineColor: 'hsl(152 100% 50%)',
    secondaryColor: 'hsl(120 20% 4%)',
    tertiaryColor: 'hsl(150 100% 10%)'
  }
});

interface ModuleViewerProps {
  courseId: string;
  moduleId: string;
  course: Course; // Now required
  onBack: () => void;
  onNavigateToModule?: (moduleId: string) => void;
  onModuleStatusChange?: () => void;
}

export const ModuleViewer: React.FC<ModuleViewerProps> = ({ courseId, moduleId, course, onBack, onNavigateToModule, onModuleStatusChange }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'test'>('content');
  const [showTest, setShowTest] = useState(false);
  const { user } = useAuth();
  const { completeModule, updateModuleLocal } = useCourseStore();
  const [showCertificate, setShowCertificate] = useState(false);

  // const [course, setCourse] = useState<Course | null>(null); // REMOVED local state
  // const [loading, setLoading] = useState(false); // REMOVED local loading logic

  // Proctoring State
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [proctoringSessionId, setProctoringSessionId] = useState<string | undefined>(undefined);

  // Topics State
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  // Experience Tracking
  useExperienceTracker({
    studentId: user?.id || 'anonymous',
    courseId,
    moduleId,
    enabled: !!user?.id
  });

  // Backend Proctoring Logging - Generate stable attemptId per module session
  const attemptId = useMemo(() => `${moduleId}-${Date.now()}`, [moduleId]);
  const { logEvent } = useProctoring({
    studentId: user?.id || 'anonymous',
    courseId,
    attemptId,
    enabled: isProctoringActive
  });

  // Set proctoring session ID when proctoring becomes active
  useEffect(() => {
    if (isProctoringActive && !proctoringSessionId) {
      setProctoringSessionId(attemptId);
    } else if (!isProctoringActive) {
      setProctoringSessionId(undefined);
    }
  }, [isProctoringActive, attemptId, proctoringSessionId]);

  const module: Module | undefined = (course?.course_modules ?? course?.modules ?? []).find((m: Module) => m.id === moduleId);

  const handleProctoringViolation = async (status: 'ok' | 'violation') => {
    if (status === 'violation' && isProctoringActive) {
      logEvent('face-violation', { count: violationCount + 1 });
      const isFinalExam = moduleId === 'vu-final-exam' || module?.type === 'final_assessment' || module?.type === 'initial_assessment';
      const maxWarnings = 3;

      if (violationCount < maxWarnings) {
        setViolationCount(prev => prev + 1);
        alert(`PROCTORING WARNING: Suspicious activity detected! You have ${maxWarnings - violationCount} warnings remaining.`);
      } else {
        console.warn('Proctoring Violation - Locking out!');
        setIsProctoringActive(false);
        setShowTest(false);
        setViolationCount(0);

        try {
          const lockedUntil = new Date();
          // Lockout duration: 3 hours for Final Assessment / Exams, 1 hour for others
          const isFinalExam = moduleId === 'vu-final-exam' || module?.type === 'final_assessment';
          lockedUntil.setHours(lockedUntil.getHours() + (isFinalExam ? 3 : 1));

          const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '';
          const email = localStorage.getItem('vu_student_email');

          if (course?.category === 'vishwakarma-university' && email) {
            await fetch(`${API_URL}/api/vu/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vu_email: email,
                course_id: courseId,
                module_id: moduleId,
                locked_until: lockedUntil.toISOString()
              })
            });
            const durationText = (moduleId === 'vu-final-exam' || module?.type === 'final_assessment') ? '3 hours' : '1 hour';
            alert(`PROCTORING VIOLATION: Test has been locked for ${durationText} due to suspicious activity.`);
            onBack();
          }
        } catch (e) {
          console.error('Lockout failed', e);
        }
      }
    }
  };

  useEffect(() => {
    // Only auto-start tests if the module has no topics
    if ((module?.type === 'final_assessment' || module?.type === 'initial_assessment') && (!module.topics || module.topics.length === 0)) {
      setActiveTab('test');
      setShowTest(true);
      setIsProctoringActive(true); // Enable proctoring automatically
    } else if (module?.type === 'final_assessment' || module?.type === 'initial_assessment') {
      // If it has topics, we stay on content tab but enable proctoring readiness
      setIsProctoringActive(true);
    } else {
      setIsProctoringActive(false);
    }
  }, [module?.id, module?.type, module?.topics]);

  useEffect(() => {
    if (activeTab === 'content') {
      // Use setTimeout to ensure the DOM has updated with the new HTML
      const timer = setTimeout(() => {
        mermaid.run({
          querySelector: '.mermaid'
        }).catch(err => console.error('Mermaid rendering failed:', err));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, module?.content, moduleId]);


  const isAllModulesCompleted = (course: Course) => {
    const modules = course.course_modules ?? course.modules ?? [];
    return modules.every((m: Module) => m.completed);
  };

  // Loading State - Removed as course is passed via props

  // Module Not Found
  if (!course || !module) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={onBack} className="w-fit -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Terminal className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Module Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested module does not exist.</p>
            <Button onClick={onBack}>Return to Course</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allModules = course.course_modules ?? course.modules ?? [];
  const currentIndex = allModules.findIndex((m: Module) => m.id === moduleId);

  // Check if a module can be accessed (prerequisites met)
  const canAccessModule = (moduleIndex: number): boolean => {
    if (moduleIndex < 0 || moduleIndex >= allModules.length) return false;

    // First module is always accessible
    if (moduleIndex === 0) return true;

    // Admin can access all modules
    if (user?.role === 'admin') return true;

    // Check if previous module is completed
    const previousModule = allModules[moduleIndex - 1];
    if (!previousModule?.completed) {
      return false;
    }

    // For modules with quizzes, check if minimum score is met (70%)
    if (previousModule.testScore !== undefined && previousModule.testScore < 70) {
      // Allow if it's an initial assessment (can proceed even if failed)
      if (previousModule.type === 'initial_assessment') {
        return true;
      }
      return false;
    }

    return true;
  };

  const goToNextModule = async () => {
    if (currentIndex >= 0 && currentIndex < allModules.length - 1) {
      // Ensure current module is marked complete before moving on
      if (!module.completed) {
        await markModuleCompleted();
      }

      const nextIndex = currentIndex + 1;
      const next = allModules[nextIndex];

      // Validate prerequisites before navigating
      if (!canAccessModule(nextIndex)) {
        const previousModule = allModules[currentIndex];
        let message = 'Cannot proceed to next module. ';

        if (!previousModule.completed) {
          message += 'Please complete the current module first.';
        } else if (previousModule.testScore !== undefined && previousModule.testScore < 70) {
          message += 'You need to score at least 70% on the quiz to proceed.';
        } else {
          message += 'Prerequisites not met.';
        }

        alert(message);
        return;
      }

      if (onNavigateToModule) {
        onNavigateToModule(next.id);
        return;
      }
      window.history.pushState({}, '', `/course/${courseId}?module=${next.id}`);
      const evt = new CustomEvent('navigateModule', { detail: { moduleId: next.id } });
      window.dispatchEvent(evt);
    }
  };

  const markModuleCompleted = async (_skipTest = false) => {
    try {
      // Validate experience-based completion requirements (unless admin or test completion)
      if (user?.id && user.role !== 'admin' && !module.testScore) {
        const token = (await supabase.auth.getSession()).data.session?.access_token;

        try {
          const response = await fetch(getApiUrl(`/api/student/experience/${courseId}/${moduleId}`), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          if (response.ok) {
            const experienceData = await response.json();
            if (!experienceData.canComplete) {
              alert(`Cannot complete module: ${experienceData.reason}`);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to validate experience data, proceeding anyway:', e);
        }
      }

      if (user?.id) {
        const topics = module.topics?.map(t => t.title) || [];
        await completeModule(user.id, courseId, moduleId, module.testScore ?? undefined, topics);
        if (onModuleStatusChange) onModuleStatusChange();
      }
    } catch (e) {
      console.error('Failed to mark module completed:', e);
    }
  };

  const completeCourseAndGenerateCertificate = async () => {
    try {
      if (user?.id) {
        for (const m of allModules) {
          await courseService.updateProgress(user.id, m.id, true, m.testScore ?? undefined);
        }
        if (onModuleStatusChange) await onModuleStatusChange();
        setShowCertificate(true);
      } else {
        setShowCertificate(true);
      }
    } catch (e) {
      console.error('Failed to complete course:', e);
    }
  };

  const handleTestCompletion = async (score: number, answers: number[]) => {
    setShowTest(false);

    try {
      if (user?.id) {
        // Optimistic update locally
        updateModuleLocal(moduleId, { completed: true, testScore: score });

        // Transform answers array to map { questionId: answerIndex }
        const answersMap: Record<string, number> = {};
        const quizQuestions = module.quiz || module.questions || [];

        quizQuestions.forEach((q: any, i: number) => {
          const qId = q.id || q._id;
          if (qId) {
            answersMap[qId.toString()] = answers[i];
          }
        });

        if (Object.keys(answersMap).length > 0) {
          await courseService.submitAssessment(moduleId, answersMap, proctoringSessionId);
          // Just to be sure sync with store's full reload but after optimistic update
          if (onModuleStatusChange) onModuleStatusChange();
          await learningPathService.rebalance(user.id, courseId);
        } else {
          // Legacy fallback / Simple progress update
          const topics = module.topics?.map(t => t.title) || [];
          await completeModule(user.id, courseId, moduleId, score, topics);
          if (onModuleStatusChange) onModuleStatusChange();
        }

        // Auto-navigate for initial assessments
        if (module.type === 'initial_assessment') {
          setTimeout(() => {
            goToNextModule();
          }, 300); // Faster navigation with optimistic state
        }
      }
    } catch (e) {
      console.error('Failed to persist progress or rebalance:', e);
      // Fallback
      if (user?.id) {
        const topics = module.topics?.map(t => t.title) || [];
        await completeModule(user.id, courseId, moduleId, score, topics);
        if (onModuleStatusChange) onModuleStatusChange();
      }
    }
  };

  if (showTest) {
    return (
      <>
        <ModuleTest
          moduleId={moduleId}
          moduleTitle={module.title}
          onComplete={handleTestCompletion}
          onBack={() => setShowTest(false)}
          questions={module.quiz || []}
          isInitialAssessment={module.type === 'initial_assessment'}
        />
        <ProctoringComponent
          isActive={isProctoringActive}
          onStatusChange={handleProctoringViolation}
        />
      </>
    );
  }

  const processContent = (rawContent: string) => {
    let content = rawContent || '';

    // YouTube embeds
    content = content.replace(
      /<a\s+(?:[^>]*?\s+)?href=["'](?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)(?:&[\w%=]*)?["'][^>]*>.*?<\/a>/gi,
      (_match, videoId) => `<div class="aspect-video w-full my-8 bg-muted rounded-xl overflow-hidden border border-border"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    );

    const tokens: string[] = [];
    const saveToken = (text: string) => {
      tokens.push(text);
      return `__TOKEN_${tokens.length - 1}__`;
    };

    content = content.replace(/```mermaid([\s\S]*?)```/gi, (_match, code) => {
      return saveToken(`<div class="mermaid my-8 bg-card p-6 rounded-xl border border-border flex justify-center overflow-x-auto text-left">${code.trim()}</div>`);
    });

    content = content.replace(/```([\s\S]*?)```/gi, (_match, code) => {
      return saveToken(`<pre class="bg-card border border-border p-4 rounded-lg my-4 overflow-x-auto"><code class="text-primary font-mono">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
    });

    content = content
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');

    content = content
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-6 mt-8 border-b border-border pb-2">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mb-4 mt-8">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mb-3 mt-6 text-primary">$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-bold mb-2 mt-4 text-primary">$1</h4>')
      .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc marker:text-primary">$1</li>')
      .replace(/^\* (.+)$/gm, '<li class="ml-6 mb-2 list-disc marker:text-primary">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal marker:text-primary">$2</li>');

    content = content.replace(/`([^`]+)`/g, '<code class="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-mono border border-primary/20">$1</code>');

    const blocks = content.split(/\n\s*\n/);
    content = blocks.map(block => {
      if (block.trim().startsWith('<h') || block.trim().startsWith('<li') || block.trim().startsWith('<pre') || block.trim().startsWith('<div') || block.trim().startsWith('__TOKEN')) {
        return block;
      }
      return `<p class="mb-4 leading-relaxed text-muted-foreground">${block.trim().replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');

    tokens.forEach((token, index) => {
      content = content.replace(`__TOKEN_${index}__`, token);
    });

    return content;
  };

  const isAssessment = module.type === 'initial_assessment' || module.type === 'final_assessment' || moduleId === 'vu-final-exam';

  // Assessment Landing View (Special) - High Stakes / Diagnostic Home
  if (isAssessment && !module.completed && !showTest) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
        <Button variant="ghost" onClick={onBack} className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <Card className="border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center py-12">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-4xl font-black tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {module.type === 'initial_assessment' ? 'Diagnostic Assessment' : 'Final Examination'}
            </CardTitle>
            <CardDescription className="text-lg max-w-lg mx-auto mt-4 leading-relaxed">
              {module.description || "This evaluation helps tailor your learning path and validate your expertise."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10 pb-16">
            {/* Instructions / Content Section */}
            {(module.content || (module.topics && module.topics.length > 0)) && (
              <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-inner">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1.5 w-8 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Preparation & Instructions
                  </h3>
                </div>
                <div
                  className="prose prose-invert max-w-none text-muted-foreground/90 selection:bg-primary/30"
                  dangerouslySetInnerHTML={{
                    __html: processContent(
                      module.content || (module.topics && module.topics.length > 0 ? module.topics.map(t => `### ${t.title}\n${t.content}`).join('\n\n') : '')
                    )
                  }}
                />
              </div>
            )}

            <div className="flex flex-col items-center gap-6">
              <Button
                size="lg"
                className="px-16 py-8 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground"
                onClick={() => setShowTest(true)}
              >
                Start Assessment
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 opacity-70">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Proctored Session Active
                </p>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                  Secure Environment Initialized
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={module.completed ? "outline" : "default"}
            onClick={() => markModuleCompleted(true)}
            disabled={module.completed || module.type === 'initial_assessment' || module.type === 'final_assessment'}
            className={cn((module.type === 'initial_assessment' || module.type === 'final_assessment') && !module.completed && "hidden")}
          >
            {module.completed ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              'Mark Complete'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={goToNextModule}
            disabled={currentIndex < 0 || currentIndex >= allModules.length - 1 || (!canAccessModule(currentIndex + 1) && user?.role !== 'admin')}
          >
            Next Module
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Module Info Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Terminal className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{module.title}</CardTitle>
              <CardDescription>
                Module {String(currentIndex + 1).padStart(2, '0')} of {String(allModules.length).padStart(2, '0')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{module.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Content</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="border-border/50">
        <div className="border-b border-border/50">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                "flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                activeTab === 'content'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <FileText className="h-4 w-4" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={cn(
                "flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                activeTab === 'test'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <CheckCircle className="h-4 w-4" />
              Test
            </button>
          </div>
        </div>

        <CardContent className="p-6">
          {activeTab === 'content' && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Topics Sidebar (Mobile-friendly list) */}
              {module.topics && module.topics.length > 0 && (
                <div className="w-full md:w-64 shrink-0 border-r border-border/50 pr-6 space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                    Topics
                  </h4>
                  {module.topics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTopicIndex(index)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3",
                        currentTopicIndex === index
                          ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        module.completedTopics?.includes(topic.title)
                          ? "bg-primary"
                          : currentTopicIndex === index ? "bg-primary/50" : "bg-muted-foreground/30"
                      )} />
                      <span className="truncate">{topic.title}</span>
                      {module.completedTopics?.includes(topic.title) && (
                        <CheckCircle className="h-4 w-4 ml-auto text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Main Content Area */}
              <div
                className="prose max-w-none flex-1 module-content"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const labBtn = target.closest('[data-lesson-action="launch-lab"]');
                  if (labBtn) {
                    const labId = labBtn.getAttribute('data-lab-id');
                    if (labId) {
                      const lab = labs.find((l: any) => l.id === labId);
                      if (lab && lab.liveUrl) {
                        window.open(lab.liveUrl, '_blank');
                      } else {
                        const evt = new CustomEvent('navigateToTab', {
                          detail: { tab: 'labs', labId: labId }
                        });
                        window.dispatchEvent(evt);
                      }
                    }
                  }
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: processContent(
                      module.topics && module.topics.length > 0
                        ? module.topics[currentTopicIndex]?.content
                        : module.content || ''
                    )
                  }}
                />

                {/* Topic Navigation Buttons */}
                {module.topics && module.topics.length > 0 && (
                  <div className="flex items-center justify-between mt-12 pt-8 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentTopicIndex === 0}
                      onClick={() => setCurrentTopicIndex(prev => Math.max(0, prev - 1))}
                    >
                      Previous Topic
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Topic {currentTopicIndex + 1} of {module.topics.length}
                    </div>
                    {currentTopicIndex < module.topics.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={async () => {
                          // Mark topic as completed
                          const currentTopic = module.topics![currentTopicIndex];
                          const alreadyCompleted = module.completedTopics?.includes(currentTopic.title);

                          if (!alreadyCompleted && user?.id) {
                            const newCompletedTopics = [...(module.completedTopics || []), currentTopic.title];
                            // Check if this was the last topic
                            const isLastTopic = newCompletedTopics.length === module.topics!.length;

                            await courseService.updateProgress(
                              user.id,
                              moduleId,
                              isLastTopic,
                              module.testScore || 0,
                              courseId,
                              newCompletedTopics
                            );
                            if (onModuleStatusChange) onModuleStatusChange();
                          }
                          setCurrentTopicIndex(prev => prev + 1);
                        }}
                      >
                        Next Topic
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={async () => {
                          const currentTopic = module.topics![currentTopicIndex];
                          const alreadyCompleted = module.completedTopics?.includes(currentTopic.title);
                          if (!alreadyCompleted && user?.id) {
                            const newCompletedTopics = [...(module.completedTopics || []), currentTopic.title];
                            const isLastTopic = newCompletedTopics.length === module.topics!.length;
                            await courseService.updateProgress(user.id, moduleId, isLastTopic, module.testScore || 0, courseId, newCompletedTopics);
                            if (onModuleStatusChange) onModuleStatusChange();
                          }
                          setShowTest(true);
                        }}
                      >
                        Proceed to Test
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Module Assessment</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Test your understanding of this module with a focused quiz to validate your knowledge.
              </p>
              {module.testScore && (
                <div className="mb-6">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                    Previous Score: {module.testScore}%
                  </span>
                </div>
              )}
              <Button onClick={() => setShowTest(true)}>
                {module.testScore ? 'Retake Test' : 'Start Test'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Module Section */}
      {!module.completed ? (
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Ready to prove your skills?</h3>
                <p className="text-muted-foreground text-sm">Take the assessment to complete this module.</p>
              </div>
              <Button onClick={() => setShowTest(true)}>
                Take Module Test
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">
                    {module.type === 'initial_assessment' ? 'Diagnostic Complete!' : 'Module Completed!'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {module.type === 'initial_assessment'
                      ? "Your pre-course assessment is finished. You can now proceed to the main course."
                      : "You've successfully completed this training module."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowTest(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Retake Test
                </Button>
                {currentIndex < allModules.length - 1 && (
                  <Button
                    onClick={goToNextModule}
                    disabled={!canAccessModule(currentIndex + 1)}
                  >
                    Next Module
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Section */}
      {course && isAllModulesCompleted(course) && (
        <Card className="border-primary/30 bg-linear-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                  <Award className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-primary text-lg">Course Complete!</h3>
                  <p className="text-muted-foreground">Congratulations! You've completed all training modules.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {currentIndex === allModules.length - 1 ? (
                  <Button onClick={completeCourseAndGenerateCertificate}>
                    <Award className="mr-2 h-5 w-5" />
                    Complete Course
                  </Button>
                ) : (
                  <Button onClick={() => setShowCertificate(true)}>
                    <Award className="mr-2 h-5 w-5" />
                    View Certificate
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Modal */}
      {showCertificate && course && user && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          courseName={course.title}
          studentName={user.name || 'Student'}
          completionDate={new Date()}
          facultyName=""
          isVU={false}
        />
      )}

      {/* ProctoringComponent is rendered inside the showTest block above */}
    </div>
  );
};