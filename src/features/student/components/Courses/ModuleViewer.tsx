import React, { useState, useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import { labs } from '@data/labs';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle,
  Award,
  Terminal,
  Play,
  Shield,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { AiTutorChat } from './AiTutorChat';
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
    tertiaryColor: 'hsl(150 100% 10%)',
  },
});

interface ModuleViewerProps {
  courseId: string;
  moduleId: string;
  course: Course; // Now required
  onBack: () => void;
  onNavigateToModule?: (moduleId: string) => void;
  onModuleStatusChange?: () => void;
}

export const ModuleViewer: React.FC<ModuleViewerProps> = ({
  courseId,
  moduleId,
  course,
  onBack,
  onNavigateToModule,
  onModuleStatusChange,
}) => {
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
    studentEmail: user?.email || '',
    courseId,
    moduleId,
    enabled: !!user?.id,
  });

  // Backend Proctoring Logging - Generate stable attemptId per module session
  const attemptId = useMemo(() => `${moduleId}-${Date.now()}`, [moduleId]);
  const { logEvent } = useProctoring({
    studentId: user?.id || 'anonymous',
    courseId,
    attemptId,
    enabled: isProctoringActive,
  });

  // Set proctoring session ID when proctoring becomes active
  useEffect(() => {
    if (isProctoringActive && !proctoringSessionId) {
      setProctoringSessionId(attemptId);
    } else if (!isProctoringActive) {
      setProctoringSessionId(undefined);
    }
  }, [isProctoringActive, attemptId, proctoringSessionId]);

  const module: Module | undefined = (course?.course_modules ?? course?.modules ?? []).find(
    (m: Module) => m.id === moduleId
  );

  // Calculate current context for AI Tutor
  const currentContext = {
    courseTitle: course?.title || '',
    moduleTitle: module?.title || '',
    moduleDescription: module?.description || '',
    topicContent:
      module?.topics && module?.topics.length > 0
        ? module?.topics[currentTopicIndex]?.content
        : module?.content || '',
  };

  const handleProctoringViolation = async (status: 'ok' | 'violation') => {
    if (status === 'violation' && isProctoringActive) {
      logEvent('face-violation', { count: violationCount + 1 });
      const isFinalExam =
        moduleId === 'vu-final-exam' ||
        module?.type === 'final_assessment' ||
        module?.type === 'initial_assessment';
      const maxWarnings = 3;

      if (violationCount < maxWarnings) {
        setViolationCount((prev) => prev + 1);
        alert(
          `PROCTORING WARNING: Suspicious activity detected! You have ${maxWarnings - violationCount} warnings remaining.`
        );
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
                locked_until: lockedUntil.toISOString(),
              }),
            });
            const durationText =
              moduleId === 'vu-final-exam' || module?.type === 'final_assessment'
                ? '3 hours'
                : '1 hour';
            alert(
              `PROCTORING VIOLATION: Test has been locked for ${durationText} due to suspicious activity.`
            );
            onBack();
          }
        } catch (e) {
          console.error('Lockout failed', e);
        }
      }
    }
  };

  useEffect(() => {
    // Assessment behavior: Show landing page first, or auto-start if configured
    const isModuleAssessment = module?.type === 'initial_assessment' || module?.type === 'final_assessment';

    if (isModuleAssessment) {
      setIsProctoringActive(true);
      // If it's an assessment with no content/topics, we skip landing and go straight to test
      if (!module?.content && (!module?.topics || module?.topics.length === 0)) {
        setActiveTab('test');
        setShowTest(true);
      }
    } else {
      setIsProctoringActive(false);
      setShowTest(false);
      setActiveTab('content');
    }
  }, [module?.id, module?.type, module?.content, module?.topics]);

  useEffect(() => {
    if (activeTab === 'content') {
      const timer = setTimeout(() => {
        mermaid
          .run({
            querySelector: '.mermaid',
          })
          .catch((err) => console.error('Mermaid rendering failed:', err));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, currentTopicIndex, module?.content, moduleId]);

  const isAllModulesCompleted = (course: Course) => {
    const modules = course.course_modules ?? course.modules ?? [];
    return modules.every((m: Module) => m.completed);
  };

  // Loading State - Removed as course is passed via props

  // Module Not Found
  if (!course || !module) {
    return (
      <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
        <Button variant="ghost" onClick={onBack} className="-ml-2 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Terminal className="text-destructive mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">Module Not Found</h2>
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
          const response = await fetch(
            getApiUrl(`/api/student/experience/${courseId}/${moduleId}`),
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );

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
        const topics = module.topics?.map((t) => t.title) || [];
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
          await courseService.submitAssessment(moduleId, answersMap, score, proctoringSessionId);
          // Just to be sure sync with store's full reload but after optimistic update
          if (onModuleStatusChange) onModuleStatusChange();
          await learningPathService.rebalance(user.id, courseId);
        } else {
          // Legacy fallback / Simple progress update
          const topics = module.topics?.map((t) => t.title) || [];
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
        const topics = module.topics?.map((t) => t.title) || [];
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
      (_match, videoId) =>
        `<div class="aspect-video w-full my-8 bg-muted rounded-xl overflow-hidden border border-border"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    );

    const tokens: string[] = [];
    const saveToken = (text: string) => {
      tokens.push(text);
      return `__TOKEN_${tokens.length - 1}__`;
    };

    content = content.replace(/```mermaid([\s\S]*?)```/gi, (_match, code) => {
      return saveToken(
        `<div class="mermaid my-8 bg-card p-6 rounded-xl border border-border flex justify-center overflow-x-auto text-left">${code.trim()}</div>`
      );
    });

    content = content.replace(/```([\s\S]*?)```/gi, (_match, code) => {
      return saveToken(
        `<pre class="bg-card border border-border p-4 rounded-lg my-4 overflow-x-auto"><code class="text-primary font-mono">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
      );
    });

    content = content
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');

    content = content
      .replace(
        /^# (.+)$/gm,
        '<h1 class="text-3xl font-bold mb-6 mt-8 border-b border-border pb-2">$1</h1>'
      )
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mb-4 mt-8">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mb-3 mt-6 text-primary">$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-bold mb-2 mt-4 text-primary">$1</h4>')
      .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc marker:text-primary">$1</li>')
      .replace(/^\* (.+)$/gm, '<li class="ml-6 mb-2 list-disc marker:text-primary">$1</li>')
      .replace(
        /^(\d+)\. (.+)$/gm,
        '<li class="ml-6 mb-2 list-decimal marker:text-primary">$2</li>'
      );

    content = content.replace(
      /`([^`]+)`/g,
      '<code class="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-mono border border-primary/20">$1</code>'
    );

    const blocks = content.split(/\n\s*\n/);
    content = blocks
      .map((block) => {
        if (
          block.trim().startsWith('<h') ||
          block.trim().startsWith('<li') ||
          block.trim().startsWith('<pre') ||
          block.trim().startsWith('<div') ||
          block.trim().startsWith('__TOKEN')
        ) {
          return block;
        }
        return `<p class="mb-4 leading-relaxed text-muted-foreground">${block.trim().replace(/\n/g, '<br/>')}</p>`;
      })
      .join('\n');

    tokens.forEach((token, index) => {
      content = content.replace(`__TOKEN_${index}__`, token);
    });

    return content;
  };

  const isAssessment =
    module.type === 'initial_assessment' ||
    module.type === 'final_assessment' ||
    moduleId === 'vu-final-exam';

  // Assessment Landing View (Special) - High Stakes / Diagnostic Home
  if (isAssessment && !module.completed && !showTest) {
    return (
      <div className="animate-in fade-in mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 duration-500 md:p-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground -ml-2 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <Card className="relative overflow-hidden border-primary/20 bg-black/40 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-primary/10">
          {/* Animated background gradient */}
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="bg-primary/5 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
          <div className="bg-primary/5 absolute -bottom-24 -left-24 h-64 w-64 rounded-full blur-3xl" />

          <CardHeader className="py-16 text-center">
            <div className="bg-primary/10 border-primary/20 ring-primary/20 mx-auto mb-8 flex h-28 w-28 animate-pulse items-center justify-center rounded-3xl border p-4 shadow-2xl ring-4">
              <Shield className="text-primary h-14 w-14" />
            </div>
            <CardTitle className="from-foreground to-foreground/60 bg-linear-to-b bg-clip-text text-5xl font-black tracking-tight text-transparent md:text-6xl">
              {module.type === 'initial_assessment' ? 'Diagnostic Assessment' : 'Final Examination'}
            </CardTitle>
            <CardDescription className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground/80">
              {module.description ||
                'This evaluation helps tailor your learning path and validate your expertise in the field.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-12 pb-20">
            {/* Stats / Overview Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-6 text-center backdrop-blur-md">
                <Clock className="mb-2 h-5 w-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Duration</span>
                <span className="text-lg font-bold">15 Minutes</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-6 text-center backdrop-blur-md">
                <FileText className="mb-2 h-5 w-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Questions</span>
                <span className="text-lg font-bold">{module.quiz?.length || 10} Items</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-6 text-center backdrop-blur-md">
                <Shield className="mb-2 h-5 w-5 text-green-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                <span className="text-lg font-bold text-green-500">Secure</span>
              </div>
            </div>

            {/* Preparation Section */}
            {(module.content || (module.topics && module.topics.length > 0)) && (
              <div className="group relative rounded-3xl border border-white/10 bg-white/5 p-10 shadow-inner transition-all hover:bg-white/[0.07]">
                <div className="mb-8 flex items-center gap-4">
                  <div className="h-0.5 w-12 rounded-full bg-primary" />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary/80">
                    Mission Briefing
                  </h3>
                </div>
                <div
                  className="prose prose-invert prose-p:text-muted-foreground/90 prose-headings:text-foreground prose-strong:text-primary max-w-none space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: processContent(
                      module.content ||
                      (module.topics && module.topics.length > 0
                        ? module.topics.map((t) => `### ${t.title}\n${t.content}`).join('\n\n')
                        : '')
                    ),
                  }}
                />
              </div>
            )}

            <div className="flex flex-col items-center gap-8">
              <Button
                size="lg"
                className="group relative h-20 overflow-hidden rounded-2xl bg-primary px-16 text-xl font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30 active:scale-95"
                onClick={() => setShowTest(true)}
              >
                <div className="bg-white/20 absolute inset-0 -translate-x-full skew-x-12 transition-transform duration-500 group-hover:translate-x-full" />
                <span className="relative z-10 flex items-center gap-3">
                  Initialize Assessment
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Proctored Session Ready
                  </span>
                </div>
                <p className="max-w-xs text-center text-xs text-muted-foreground/50">
                  By starting, you agree to follow the standard investigation protocols.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground -ml-2 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={module.completed ? 'outline' : 'default'}
            onClick={() => markModuleCompleted(true)}
            disabled={
              module.completed ||
              module.type === 'initial_assessment' ||
              module.type === 'final_assessment'
            }
            className={cn(
              (module.type === 'initial_assessment' || module.type === 'final_assessment') &&
              !module.completed &&
              'hidden'
            )}
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
            disabled={
              currentIndex < 0 ||
              currentIndex >= allModules.length - 1 ||
              (!canAccessModule(currentIndex + 1) && user?.role !== 'admin')
            }
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
            <div className="bg-primary/10 border-primary/20 rounded-lg border p-2">
              <Terminal className="text-primary h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">{module.title}</CardTitle>
              <CardDescription>
                Module {String(currentIndex + 1).padStart(2, '0')} of{' '}
                {String(allModules.length).padStart(2, '0')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{module.description}</p>
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="text-primary h-4 w-4" />
              <span>Content</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="border-border/50">
        <div className="border-border/50 border-b">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                activeTab === 'content'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <FileText className="h-4 w-4" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                activeTab === 'test'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <CheckCircle className="h-4 w-4" />
              Test
            </button>
          </div>
        </div>

        <CardContent className="p-6">
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Topics Sidebar (Mobile-friendly list) */}
              {module.topics && module.topics.length > 0 && (
                <div className="border-border/50 w-full shrink-0 space-y-2 border-r pr-6 md:w-64">
                  <h4 className="text-muted-foreground mb-4 px-2 text-sm font-semibold tracking-wider uppercase">
                    Topics
                  </h4>
                  {module.topics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTopicIndex(index)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all',
                        currentTopicIndex === index
                          ? 'bg-primary/10 text-primary border-primary/20 border font-medium'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          module.completedTopics?.includes(topic.title)
                            ? 'bg-primary'
                            : currentTopicIndex === index
                              ? 'bg-primary/50'
                              : 'bg-muted-foreground/30'
                        )}
                      />
                      <span className="truncate">{topic.title}</span>
                      {module.completedTopics?.includes(topic.title) && (
                        <CheckCircle className="text-primary ml-auto h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Main Content Area */}
              <div
                className="prose module-content max-w-none flex-1"
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
                          detail: { tab: 'labs', labId: labId },
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
                    ),
                  }}
                />

                {/* Topic Navigation Buttons */}
                {module.topics && module.topics.length > 0 && (
                  <div className="border-border/50 mt-12 flex items-center justify-between border-t pt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentTopicIndex === 0}
                      onClick={() => setCurrentTopicIndex((prev) => Math.max(0, prev - 1))}
                    >
                      Previous Topic
                    </Button>
                    <div className="text-muted-foreground text-sm">
                      Topic {currentTopicIndex + 1} of {module.topics.length}
                    </div>
                    {currentTopicIndex < module.topics.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={async () => {
                          // Mark topic as completed
                          const currentTopic = module.topics![currentTopicIndex];
                          const alreadyCompleted = module.completedTopics?.includes(
                            currentTopic.title
                          );

                          if (!alreadyCompleted && user?.id) {
                            const newCompletedTopics = [
                              ...(module.completedTopics || []),
                              currentTopic.title,
                            ];
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
                          setCurrentTopicIndex((prev) => prev + 1);
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
                          const alreadyCompleted = module.completedTopics?.includes(
                            currentTopic.title
                          );
                          if (!alreadyCompleted && user?.id) {
                            const newCompletedTopics = [
                              ...(module.completedTopics || []),
                              currentTopic.title,
                            ];
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
            <div className="py-12 text-center">
              <div className="bg-primary/10 border-primary/20 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border p-4">
                <Shield className="text-primary h-10 w-10" />
              </div>
              <h3 className="mb-4 text-xl font-bold">Module Assessment</h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-md">
                Test your understanding of this module with a focused quiz to validate your
                knowledge.
              </p>
              {module.testScore && (
                <div className="mb-6">
                  <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium">
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
                <p className="text-muted-foreground text-sm">
                  Take the assessment to complete this module.
                </p>
              </div>
              <Button onClick={() => setShowTest(true)}>Take Module Test</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 border-primary/20 rounded-lg border p-2">
                  <CheckCircle className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-primary font-semibold">
                    {module.type === 'initial_assessment'
                      ? 'Diagnostic Complete!'
                      : 'Module Completed!'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {module.type === 'initial_assessment'
                      ? 'Your pre-course assessment is finished. You can now proceed to the main course.'
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
                  <Button onClick={goToNextModule} disabled={!canAccessModule(currentIndex + 1)}>
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
        <Card className="border-primary/30 from-primary/5 to-primary/10 bg-linear-to-r">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 border-primary/20 rounded-full border p-3">
                  <Award className="text-primary h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-primary text-lg font-bold">Course Complete!</h3>
                  <p className="text-muted-foreground">
                    Congratulations! You've completed all training modules.
                  </p>
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
      {/* AI Tutor Chat Widget */}
      <AiTutorChat context={currentContext} />
    </div>
  );
};
