import React, { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import { AiTutorChat } from './AiTutorChat';
import { toast } from 'sonner';

import { courseService } from '@services/courseService';
import type { Module, Course } from '@types';
import { ModuleTest } from './ModuleTest';
import { Proctoring } from '../Proctoring/ProctoringEngine';
import { CameraSetup } from '../Proctoring/CameraSetup';
import { ProctoringVideoFeed } from '../Proctoring/ProctoringVideoFeed';
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

const createAttemptId = (moduleId: string) =>
  `${moduleId}-attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  const { modules, fetchModuleContent, completeModule, updateModuleLocal } = useCourseStore();
  const [showCertificate, setShowCertificate] = useState(false);

  // const [course, setCourse] = useState<Course | null>(null); // REMOVED local state
  // const [loading, setLoading] = useState(false); // REMOVED local loading logic

  // Proctoring State
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = React.useState<MediaStream | null>(null);
  const [showCameraSetup, setShowCameraSetup] = useState(false);

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

  // Cleanup camera when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      if (mediaStream) {
        console.log('[ModuleViewer] Unmounting - stopping camera');
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  // Lazy Loading: Fetch module content if missing
  useEffect(() => {
    if (moduleId) {
      fetchModuleContent(moduleId);
    }
  }, [moduleId, fetchModuleContent]);

  // Backend Proctoring Logging - stable attempt id per test session.
  const [attemptId, setAttemptId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`proctor_attempt_${moduleId}`);
      if (saved) return saved;
      const newId = createAttemptId(moduleId);
      sessionStorage.setItem(`proctor_attempt_${moduleId}`, newId);
      return newId;
    }
    return createAttemptId(moduleId);
  });
  const { logEvent, requestFullscreen } = useProctoring({
    studentId: user?.id || 'anonymous',
    courseId,
    attemptId,
    enabled: isProctoringActive,
  });
  const proctoringSessionId = isProctoringActive ? attemptId : undefined;

  // eslint-disable-next-line @next/next/no-assign-module-variable
  const module: Module | undefined = (course?.course_modules ?? course?.modules ?? []).find(
    (m: Module) => m.id === moduleId
  );

  const allModules = course?.modules || course?.course_modules || [];
  const currentIndex = allModules.findIndex((m: Module) => m.id === moduleId);

  const isAssessmentModule =
    module?.type === 'initial_assessment' ||
    module?.type === 'final_assessment' ||
    moduleId === 'vu-final-exam';

  const startTestSession = () => {
    console.log('startTestSession called, isAssessmentModule:', isAssessmentModule);
    if (isAssessmentModule) {
      setAttemptId(createAttemptId(moduleId));
      setViolationCount(0);
      // Show camera setup screen first
      console.log('Showing camera setup');
      setShowCameraSetup(true);
    } else {
      setIsProctoringActive(false);
      setActiveTab('test');
      setShowTest(true);
    }
  };

  const handleCameraReady = (stream: MediaStream) => {
    console.log('handleCameraReady called with stream:', stream);
    setMediaStream(stream);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      console.log('Video srcObject set');
    }
    setIsProctoringActive(true);
    setShowCameraSetup(false);
    setActiveTab('test');
    setShowTest(true);
    console.log('Proctoring active, test started');
  };

  const handleCameraSetupCancel = () => {
    setShowCameraSetup(false);
    setIsProctoringActive(false);
  };

  const stopTestSession = () => {
    // Stop camera stream
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setShowTest(false);
    setIsProctoringActive(false);
  };

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

  const handleProctoringViolation = async (status: 'ok' | 'violation', engineCount?: number) => {
    if (status === 'violation' && isProctoringActive) {
      const currentCount = engineCount !== undefined ? engineCount : violationCount + 1;
      logEvent('face-violation', { count: currentCount });
      setViolationCount(currentCount);

      const maxWarnings = 3;
      const remainingWarnings = maxWarnings - currentCount;

      if (currentCount < maxWarnings) {
        toast.warning('Suspicious Activity Detected', {
          description: `You have ${remainingWarnings} warnings remaining before the test is locked.`,
          duration: 5000,
        });
      } else {
        console.warn('Proctoring Violation - Locking out!');
        setIsProctoringActive(false);
        setShowTest(false);

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
          } else {
            // Default alert for non-VU students or missing email
            alert('❌ Examination terminated due to persistent proctoring violations (3/3).');
            onBack();
          }
        } catch (e) {
          console.error('Lockout failed', e);
          alert('❌ Examination terminated due to proctoring violations.');
          onBack();
        }
      }
    }
  };

  // Auto-trigger camera setup for assessments when module changes
  useEffect(() => {
    if (!module || module.id !== moduleId) return;

    const isModuleAssessment =
      module.type === 'initial_assessment' || module.type === 'final_assessment';

    if (isModuleAssessment && !module.completed && !showTest && !showCameraSetup) {
      console.log('[ModuleViewer] Entering assessment assessment - initializing proctoring');
      setAttemptId(createAttemptId(moduleId));
      setViolationCount(0);
      setIsProctoringActive(false);
      setShowCameraSetup(true);
    } else if (!isModuleAssessment) {
      setIsProctoringActive(false);
      setShowTest(false);
      setShowCameraSetup(false);
      if (activeTab === 'test') setActiveTab('content');
    }
  }, [moduleId, module?.id, module?.type, module?.completed]); // Removed showTest/showCameraSetup from deps to prevent loops

  useEffect(() => {
    if (!isProctoringActive || !showTest) return;
    requestFullscreen();
    logEvent('exam_start', { moduleId, attemptId });

    return () => {
      logEvent('exam_end', { moduleId, attemptId });
    };
  }, [isProctoringActive, showTest, requestFullscreen, logEvent, moduleId, attemptId]);

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

  // Loading State for Lazy Content
  if (
    !module.content &&
    module.type !== 'initial_assessment' &&
    module.type !== 'final_assessment' &&
    moduleId !== 'vu-final-exam'
  ) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground animate-pulse">Spinning up...</p>
      </div>
    );
  }

  const normalizedTopics = (module.topics || []).map((topic: any, index: number) => ({
    ...topic,
    title:
      (typeof topic?.title === 'string' && topic.title.trim()) ||
      (typeof topic?.name === 'string' && topic.name.trim()) ||
      `Topic ${index + 1}`,
    content: typeof topic?.content === 'string' ? topic.content : '',
  }));
  const currentTopic = normalizedTopics[currentTopicIndex];

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
      const courseIdentifier = course.slug || courseId;
      window.history.pushState({}, '', `/courses/${courseIdentifier}?module=${next.id}`);
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
    stopTestSession();
    const passed = score >= 70 || module.type === 'initial_assessment';

    try {
      if (user?.id) {
        // Optimistic update locally
        updateModuleLocal(moduleId, { completed: passed, testScore: score });

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
          if (passed) {
            await completeModule(user.id, courseId, moduleId, score, topics);
          } else {
            await courseService.updateProgress(user.id, moduleId, false, score, courseId, topics);
          }
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
      // Fallback: never mark failed quiz attempts as completed
      if (user?.id) {
        const topics = module.topics?.map((t) => t.title) || [];
        if (passed) {
          await completeModule(user.id, courseId, moduleId, score, topics);
        } else {
          await courseService.updateProgress(user.id, moduleId, false, score, courseId, topics);
          updateModuleLocal(moduleId, { completed: false, testScore: score });
        }
        if (onModuleStatusChange) onModuleStatusChange();
      }
    }
  };

  // Show camera setup before test
  if (showCameraSetup) {
    return <CameraSetup onCameraReady={handleCameraReady} onCancel={handleCameraSetupCancel} />;
  }

  if (showTest) {
    return (
      <>
        <ModuleTest
          moduleId={moduleId}
          moduleTitle={module.title}
          onComplete={handleTestCompletion}
          onBack={stopTestSession}
          questions={module.quiz || []}
          isInitialAssessment={module.type === 'initial_assessment'}
        />
        <Proctoring
          mediaStream={mediaStream}
          enabled={isProctoringActive}
          onViolation={(count, reason) => {
            console.log(`🚨 Violation: ${reason} (${count}/${3})`);
            // Pass the count directly from the engine to ensure accuracy
            void handleProctoringViolation('violation', count);
          }}
          onEndExam={() => {
            console.log('❌ Exam terminated - stopping camera');
            // Stop camera immediately
            if (mediaStream) {
              mediaStream.getTracks().forEach((track) => track.stop());
              setMediaStream(null);
            }
            setIsProctoringActive(false);
            setShowTest(false);
          }}
          onStatusChange={(status) => {
            console.log('Proctoring status:', status);
          }}
          threshold={3}
        />
        <ProctoringVideoFeed mediaStream={mediaStream} isActive={isProctoringActive} />
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

  const isAssessment = isAssessmentModule;

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
              {normalizedTopics.length > 0 && (
                <div className="border-border/50 w-full shrink-0 space-y-2 border-r pr-6 md:w-64">
                  <h4 className="text-muted-foreground mb-4 px-2 text-sm font-semibold tracking-wider uppercase">
                    Topics
                  </h4>
                  {normalizedTopics.map((topic, index) => (
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
                      normalizedTopics.length > 0
                        ? currentTopic?.content?.trim() || module.content || ''
                        : module.content || ''
                    ),
                  }}
                />

                {/* Topic Navigation Buttons */}
                {normalizedTopics.length > 0 && (
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
                      Topic {currentTopicIndex + 1} of {normalizedTopics.length}
                    </div>
                    {currentTopicIndex < normalizedTopics.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={async () => {
                          // Mark topic as completed
                          const topicAtIndex = normalizedTopics[currentTopicIndex];
                          const alreadyCompleted = module.completedTopics?.includes(
                            topicAtIndex.title
                          );

                          if (!alreadyCompleted && user?.id) {
                            const newCompletedTopics = [
                              ...(module.completedTopics || []),
                              topicAtIndex.title,
                            ];

                            await courseService.updateProgress(
                              user.id,
                              moduleId,
                              false,
                              module.testScore,
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
                          const topicAtIndex = normalizedTopics[currentTopicIndex];
                          const alreadyCompleted = module.completedTopics?.includes(
                            topicAtIndex.title
                          );
                          if (!alreadyCompleted && user?.id) {
                            const newCompletedTopics = [
                              ...(module.completedTopics || []),
                              topicAtIndex.title,
                            ];
                            await courseService.updateProgress(
                              user.id,
                              moduleId,
                              false,
                              module.testScore,
                              courseId,
                              newCompletedTopics
                            );
                            if (onModuleStatusChange) onModuleStatusChange();
                          }
                          startTestSession();
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
              <Button onClick={startTestSession}>
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
              <Button onClick={startTestSession}>Take Module Test</Button>
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
                      : 'You&apos;ve successfully completed this training module.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={startTestSession}>
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
                    Congratulations! You&apos;ve completed all training modules.
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

      {/* Proctoring component is rendered inside the showTest block above */}
      {/* AI Tutor Chat Widget */}
      <AiTutorChat context={currentContext} />
    </div>
  );
};
