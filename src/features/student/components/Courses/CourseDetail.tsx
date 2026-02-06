import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  FileText,
  FlaskRound as Flask,
  Award,
  Terminal,
  Lock,
  BookOpen,
  Shield,
} from 'lucide-react';
import { ModuleViewer } from './ModuleViewer';
import { courseService } from '@services/courseService';
import type { Course, Module } from '@types';
import { useAuth } from '@context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Progress } from '@shared/components/ui/progress';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';
import { useCourseStore } from '@shared/stores/useCourseStore';

interface CourseDetailProps {
  courseId: string;
  onBack: () => void;
}

type ProgressRow = {
  module_id?: string;
  completed?: boolean | null;
  quiz_score?: number | null;
  completedTopics?: string[];
};

type CourseModuleLike = Module & {
  id: string;
  testScore?: number | null;
  videoUrl?: string | null;
  labUrl?: string | null;
  completed?: boolean;
};

export const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onBack }) => {
  const { course, loading, fetchCourseProgress, reset } = useCourseStore();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchCourseProgress(courseId, user?.id);
    return () => reset();
  }, [courseId, user?.id]);

  const refreshCourse = () => {
    fetchCourseProgress(courseId, user?.id);
  };

  // ... (renders)

  // Loading State
  if (loading) {
    return (
      <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
        <Skeleton className="h-8 w-40" />
        <Card className="border-border/50">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <div>
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Course Not Found State
  if (!course) {
    return (
      <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
        <Button variant="ghost" onClick={onBack} className="-ml-2 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Terminal className="text-destructive mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">Course Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested course does not exist.</p>
            <Button onClick={onBack}>Return to Courses</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Module Viewer
  if (selectedModuleId) {
    return (
      <ModuleViewer
        courseId={courseId}
        moduleId={selectedModuleId}
        course={course}
        onBack={() => setSelectedModuleId(null)}
        onNavigateToModule={(id: string) => setSelectedModuleId(id)}
        onModuleStatusChange={refreshCourse}
      />
    );
  }

  const completedModules = (course.modules || []).filter((m: Module) => m.completed).length;
  const totalModules = (course.modules || []).length;
  const progressPercentage =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground -ml-2 w-fit"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Courses
      </Button>

      {/* Course Header Card */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Course Info */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 border-primary/20 rounded-lg border p-2">
                  <BookOpen className="text-primary h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{course.title}</h1>
              </div>

              <CardDescription className="text-base">{course.description}</CardDescription>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="text-muted-foreground flex items-center gap-2">
                  <FileText className="text-primary h-4 w-4" />
                  <span>{totalModules} Modules</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Clock className="text-primary h-4 w-4" />
                  <span>{course.estimated_hours ? `${course.estimated_hours} Hours` : `~${totalModules * 2} Hours`}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Flask className="text-primary h-4 w-4" />
                  <span>Hands-on Labs</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Award className="text-primary h-4 w-4" />
                  <span>Certificate</span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
                  Course Progress
                </h3>
                <div className="mb-4 text-center">
                  <div className="text-primary text-4xl font-bold">{progressPercentage}%</div>
                  <div className="text-muted-foreground text-sm">Complete</div>
                </div>
                <Progress value={progressPercentage} className="mb-4 h-2" />
                <div className="text-muted-foreground text-center text-sm">
                  {completedModules} / {totalModules} modules completed
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      <Card className="border-border/50">
        <CardHeader className="border-border/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="text-primary h-5 w-5" />
            Training Modules
          </CardTitle>
        </CardHeader>
        <div className="divide-border/50 divide-y">
          {(course.modules || []).map((module: Module, index: number, array: Module[]) => {
            const previousModule = index > 0 ? array[index - 1] : null;
            const previousIndex = index - 1;

            // Unlock logic:
            // - Admin always unlocked
            // - First module (index 0) always unlocked
            // - For subsequent modules:
            //   - If previous was index 0 (initial assessment): only need completion (any score OK)
            //   - Otherwise: need completion + score >= 70%
            const isPreviousInitialAssessment = previousIndex === 0 || previousModule?.type === 'initial_assessment';

            const isModuleUnlocked =
              user?.role === 'admin' ||
              index === 0 ||
              (previousModule?.completed &&
                (isPreviousInitialAssessment ||
                  previousModule.testScore === undefined ||
                  previousModule.testScore >= 70));

            return (
              <div
                key={module.id || index}
                className={cn(
                  'p-6 transition-colors',
                  isModuleUnlocked && 'hover:bg-muted/50 group cursor-pointer'
                )}
                onClick={() => {
                  console.log('Module clicked:', module);
                  if (isModuleUnlocked) {
                    console.log('Setting selected module:', module.id);
                    setSelectedModuleId(module.id);
                  } else {
                    console.log('Module locked');
                  }
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 items-start gap-4">
                    {/* Module Number/Status */}
                    <div className="mt-1 shrink-0">
                      {module.completed ? (
                        <div className="bg-primary/10 border-primary/20 flex h-8 w-8 items-center justify-center rounded-full border">
                          <CheckCircle className="text-primary h-5 w-5" />
                        </div>
                      ) : module.type === 'initial_assessment' ||
                        module.type === 'final_assessment' ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10">
                          <Shield className="h-4 w-4 text-yellow-500" />
                        </div>
                      ) : isModuleUnlocked ? (
                        <div className="border-border group-hover:border-primary/50 flex h-8 w-8 items-center justify-center rounded-full border transition-colors">
                          <span className="text-muted-foreground group-hover:text-primary text-sm font-bold transition-colors">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-muted border-border flex h-8 w-8 items-center justify-center rounded-full border">
                          <Lock className="text-muted-foreground h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Module Content */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={cn(
                          'mb-1 text-lg font-medium transition-colors',
                          isModuleUnlocked ? 'group-hover:text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {module.title}
                      </h3>
                      <p
                        className={cn(
                          'mb-3 text-sm',
                          isModuleUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/50'
                        )}
                      >
                        {module.description}
                      </p>

                      <div
                        className={cn(
                          'flex items-center gap-4 text-xs',
                          isModuleUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/50'
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Reading</span>
                        </div>
                        {module.videoUrl && (
                          <div className="flex items-center gap-1">
                            <Play className="h-3.5 w-3.5" />
                            <span>Video</span>
                          </div>
                        )}
                        {module.labUrl && (
                          <div className="flex items-center gap-1">
                            <Flask className="h-3.5 w-3.5" />
                            <span>Lab</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>~2 hours</span>
                        </div>
                      </div>

                      {module.testScore && (
                        <div className="mt-2">
                          <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                            Test Score: {module.testScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={module.completed ? 'outline' : 'default'}
                    disabled={!isModuleUnlocked}
                    className={cn(!isModuleUnlocked && 'opacity-50')}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Button clicked for module:', module);

                      if (isModuleUnlocked) {
                        console.log('Navigating to module:', module.id);
                        setSelectedModuleId(module.id);
                      }
                    }}
                  >
                    {isModuleUnlocked ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {module.completed ? 'Review' : 'Start'}
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Locked
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
