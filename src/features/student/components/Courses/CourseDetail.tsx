import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, CheckCircle, Clock, FileText, FlaskRound as Flask, Award, Terminal, Lock, BookOpen, Shield } from 'lucide-react';
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
  const {
    course,
    loading,
    fetchCourseProgress,
    reset
  } = useCourseStore();
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
      <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
        <Skeleton className="h-8 w-40" />
        <Card className="border-border/50">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
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
            {[1, 2, 3].map(i => (
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
      <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={onBack} className="w-fit -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Terminal className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
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
  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Courses
      </Button>

      {/* Course Header Card */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{course.title}</h1>
              </div>

              <CardDescription className="text-base">
                {course.description}
              </CardDescription>

              <div className="flex items-center flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>{totalModules} Modules</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>~{totalModules * 2} Hours</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Flask className="h-4 w-4 text-primary" />
                  <span>Hands-on Labs</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4 text-primary" />
                  <span>Certificate</span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                  Course Progress
                </h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary">{progressPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
                <Progress value={progressPercentage} className="h-2 mb-4" />
                <div className="text-sm text-muted-foreground text-center">
                  {completedModules} / {totalModules} modules completed
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Training Modules
          </CardTitle>
        </CardHeader>
        <div className="divide-y divide-border/50">
          {(course.modules || []).map((module: Module, index: number, array: Module[]) => {
            const previousModule = index > 0 ? array[index - 1] : null;
            const isModuleUnlocked = user?.role === 'admin' ||
              index === 0 ||
              (previousModule?.completed && (
                previousModule.testScore === undefined ||
                previousModule.testScore >= 70 ||
                previousModule.type === 'initial_assessment'
              ));

            return (
              <div
                key={module.id || index}
                className={cn(
                  "p-6 transition-colors",
                  isModuleUnlocked && "hover:bg-muted/50 cursor-pointer group"
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
                  <div className="flex items-start gap-4 flex-1">
                    {/* Module Number/Status */}
                    <div className="shrink-0 mt-1">
                      {module.completed ? (
                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                      ) : (module.type === 'initial_assessment' || module.type === 'final_assessment') ? (
                        <div className="h-8 w-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-yellow-500" />
                        </div>
                      ) : isModuleUnlocked ? (
                        <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                          <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Module Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "text-lg font-medium mb-1 transition-colors",
                        isModuleUnlocked ? "group-hover:text-primary" : "text-muted-foreground"
                      )}>
                        {module.title}
                      </h3>
                      <p className={cn(
                        "text-sm mb-3",
                        isModuleUnlocked ? "text-muted-foreground" : "text-muted-foreground/50"
                      )}>
                        {module.description}
                      </p>

                      <div className={cn(
                        "flex items-center gap-4 text-xs",
                        isModuleUnlocked ? "text-muted-foreground" : "text-muted-foreground/50"
                      )}>
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            Test Score: {module.testScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={module.completed ? "outline" : "default"}
                    disabled={!isModuleUnlocked}
                    className={cn(!isModuleUnlocked && "opacity-50")}
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