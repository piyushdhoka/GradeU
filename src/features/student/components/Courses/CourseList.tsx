'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Award,
  Lock,
  CheckCircle,
  BookOpen,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { courseService } from '@services/courseService';
import type { Course } from '@types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';
import { Loader } from '@components/ui/loader';

export interface CourseData {
  id: string;
  slug: string;
  title: string;
  category: 'vishwakarma-university';
  url: string;
  description: string;
  disclaimer: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  skills: string[];
}

export interface CourseCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const courseCategories: CourseCategory[] = [];

const DYNAMIC_CATEGORY: CourseCategory = {
  id: 'cyber-ops',
  title: 'Courses',
  description: 'AI-generated specialized training missions',
  icon: '⚡',
  color: 'from-emerald-500/20 to-teal-500/20',
};

interface CourseListProps {
  onCourseSelect: (courseId: string) => void;
}

export const CourseList: React.FC<CourseListProps> = ({ onCourseSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [dynamicCourses, setDynamicCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const courses = await courseService.getAllCourses();
      setDynamicCourses(courses);
    } catch (e) {
      console.error('Failed to fetch dynamic courses:', e);
      setError(e instanceof Error ? e.message : 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const canAccessCourses = true;

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Advanced':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Course Detail View
  if (selectedCourse) {
    if (!canAccessCourses) {
      setSelectedCourse(null);
      return null;
    }

    return (
      <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
        <Button
          variant="ghost"
          onClick={() => setSelectedCourse(null)}
          className="text-muted-foreground hover:text-foreground -ml-2 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">{selectedCourse.title}</CardTitle>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold uppercase',
                      getDifficultyVariant(selectedCourse.difficulty)
                    )}
                  >
                    {selectedCourse.difficulty}
                  </span>
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{selectedCourse.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <CardDescription className="text-base">{selectedCourse.description}</CardDescription>

            <div>
              <h3 className="text-primary mb-3 text-sm font-semibold tracking-wide uppercase">
                What You&apos;ll Learn
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCourse.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-primary/10 text-primary border-primary/20 rounded-full border px-3 py-1 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                    <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-amber-500">Important Notice</h4>
                    <p className="text-sm text-amber-500/80">{selectedCourse.disclaimer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                if (selectedCourse.url && selectedCourse.url !== '#') {
                  window.open(selectedCourse.url, '_blank');
                } else {
                  onCourseSelect(selectedCourse.slug);
                }
              }}
            >
              {selectedCourse.id === 'vu-web-security' ? 'Enter Course' : 'Start Course'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Courses List for Selected Category
  if (selectedCategory) {
    const category =
      courseCategories.find((c) => c.id === selectedCategory) ||
      (selectedCategory === 'cyber-ops' ? DYNAMIC_CATEGORY : null);

    let courses: CourseData[] = [];

    if (selectedCategory === 'cyber-ops') {
      courses = dynamicCourses.map((c) => ({
        id: c.id,
        slug: c.slug || c.id, // Use slug for navigation, fallback to id
        title: c.title,
        category: 'vishwakarma-university' as const,
        url: '#',
        description: c.description || 'No description available.',
        disclaimer:
          'This mission is dynamically generated. Exercise caution during practical sessions.',
        difficulty: (c.difficulty
          ? c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)
          : 'Beginner') as CourseData['difficulty'],
        duration: c.estimated_hours ? `${c.estimated_hours} hours` : 'Self-paced',
        skills: c.category ? [c.category] : ['Cybersecurity'],
      }));
    }

    return (
      <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
        <Button
          variant="ghost"
          onClick={() => setSelectedCategory(null)}
          className="text-muted-foreground hover:text-foreground -ml-2 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>

        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
            <span>{category?.icon}</span>
            {category?.title}
          </h1>
          <p className="text-muted-foreground">{category?.description}</p>
        </div>

        {courses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Card
                key={course.id}
                onClick={() => canAccessCourses && setSelectedCourse(course)}
                className={cn(
                  'group transition-all duration-200',
                  canAccessCourses
                    ? 'border-border/50 hover:border-primary/30 hover:shadow-primary/5 cursor-pointer hover:shadow-lg'
                    : 'cursor-not-allowed opacity-50'
                )}
              >
                {!canAccessCourses && (
                  <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-sm">
                    <div className="text-center">
                      <Lock className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
                      <p className="text-muted-foreground text-sm font-medium">
                        Assessment Required
                      </p>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="group-hover:text-primary text-lg transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                          getDifficultyVariant(course.difficulty)
                        )}
                      >
                        {course.difficulty}
                      </span>
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    {canAccessCourses && (
                      <ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-all group-hover:translate-x-1" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {course.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {course.skills.length > 3 && (
                      <span className="text-muted-foreground px-2 py-0.5 text-[10px]">
                        +{course.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="text-muted-foreground/50 mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">No Courses Available</h2>
              <p className="text-muted-foreground">
                Courses in this category are being prepared. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Category Selection View
  const allCategories = [
    ...courseCategories,
    ...(dynamicCourses.length > 0 ? [DYNAMIC_CATEGORY] : []),
  ];

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Training Courses</h1>
          <p className="text-muted-foreground">Choose your specialization and start learning</p>
        </div>
        <div className="bg-card border-border/50 flex items-center gap-2 rounded-lg border px-4 py-2">
          {loading ? <Loader size="sm" /> : <GraduationCap className="text-primary h-5 w-5" />}
          <span className="text-sm font-medium">{allCategories.length} Categories</span>
        </div>
      </div>

      {!canAccessCourses && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full border border-amber-500/20 bg-amber-500/10 p-3">
                <Lock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-500">Access Restricted</h3>
                <p className="text-sm text-amber-500/80">
                  Complete the initial assessment to unlock training modules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-destructive/10 border-destructive/20 rounded-full border p-3">
                  <svg
                    className="text-destructive h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-destructive font-semibold">Failed to Load Courses</h3>
                  <p className="text-destructive/80 text-sm">{error}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchCourses} disabled={loading}>
                {loading ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {allCategories.map((category) => {
          const coursesCount = category.id === 'cyber-ops' ? dynamicCourses.length : 0;

          return (
            <Card
              key={category.id}
              onClick={() => canAccessCourses && setSelectedCategory(category.id)}
              className={cn(
                'group overflow-hidden transition-all duration-200',
                canAccessCourses
                  ? 'border-border/50 hover:border-primary/30 hover:shadow-primary/5 cursor-pointer hover:shadow-lg'
                  : 'cursor-not-allowed opacity-50'
              )}
            >
              {!canAccessCourses && (
                <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <Lock className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                    <p className="text-muted-foreground text-sm font-medium">Locked</p>
                  </div>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{category.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="group-hover:text-primary text-xl transition-colors">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-muted-foreground mb-4 flex flex-col gap-2 text-sm">
                  {coursesCount > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-primary h-4 w-4" />
                      <span>
                        {coursesCount} Comprehensive Course{coursesCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="text-primary h-4 w-4" />
                    <span>Self-paced Learning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="text-primary h-4 w-4" />
                    <span>Industry Recognition</span>
                  </div>
                </div>

                {canAccessCourses && coursesCount > 0 && (
                  <div className="border-border/50 flex items-center justify-between border-t pt-4">
                    <span className="text-primary text-sm font-medium">
                      Explore {coursesCount} Course{coursesCount !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight className="text-primary h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
