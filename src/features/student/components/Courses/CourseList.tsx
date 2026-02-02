'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Award, Lock, CheckCircle, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import { courseService } from '@services/courseService';
import type { Course } from '@types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';

export interface CourseData {
  id: string;
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

const courseCategories: CourseCategory[] = [
  {
    id: 'vishwakarma-university',
    title: 'Vishwakarma University',
    description: 'Exclusive curriculum and specialized tracks from VU',
    icon: '🎓',
    color: 'from-purple-500/20 to-pink-500/20'
  }
];

const DYNAMIC_CATEGORY: CourseCategory = {
  id: 'cyber-ops',
  title: 'Courses',
  description: 'AI-generated specialized training missions',
  icon: '⚡',
  color: 'from-emerald-500/20 to-teal-500/20'
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
      case 'Beginner': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Intermediate': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Advanced': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Course Detail View
  if (selectedCourse) {
    if (!canAccessCourses) {
      setSelectedCourse(null);
      return null;
    }

    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          onClick={() => setSelectedCourse(null)}
          className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">{selectedCourse.title}</CardTitle>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs font-semibold uppercase px-2.5 py-1 rounded-full border",
                    getDifficultyVariant(selectedCourse.difficulty)
                  )}>
                    {selectedCourse.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{selectedCourse.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <CardDescription className="text-base">
              {selectedCourse.description}
            </CardDescription>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">What You'll Learn</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCourse.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary border border-primary/20 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-500 mb-1">Important Notice</h4>
                    <p className="text-sm text-amber-500/80">
                      {selectedCourse.disclaimer}
                    </p>
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
                  onCourseSelect(selectedCourse.id);
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
    const category = courseCategories.find(c => c.id === selectedCategory) || (selectedCategory === 'cyber-ops' ? DYNAMIC_CATEGORY : null);

    let courses: CourseData[] = [];

    if (selectedCategory === 'vishwakarma-university') {
      courses = [
        {
          id: 'vu-web-security',
          title: 'Web Application Security',
          category: 'vishwakarma-university',
          url: '#',
          description: 'Learn to identify and exploit vulnerabilities in web applications, understanding the OWASP Top 10 and secure coding practices, tailored for VU curriculum.',
          disclaimer: 'Exclusive for VU students. This course contains practical exercises involving security testing.',
          difficulty: 'Intermediate',
          duration: '8 weeks',
          skills: ['OWASP Top 10', 'SQL Injection', 'XSS', 'VU-Certified']
        }
      ];
    } else if (selectedCategory === 'cyber-ops') {
      courses = dynamicCourses.map(c => ({
        id: c.id,
        title: c.title,
        category: 'vishwakarma-university' as const,
        url: '#',
        description: c.description || 'No description available.',
        disclaimer: 'This mission is dynamically generated. Exercise caution during practical sessions.',
        difficulty: (c.difficulty ? (c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)) : 'Beginner') as CourseData['difficulty'],
        duration: c.estimated_hours ? `${c.estimated_hours} hours` : 'Self-paced',
        skills: c.category ? [c.category] : ['Cybersecurity']
      }));
    }

    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          onClick={() => setSelectedCategory(null)}
          className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
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
                  "group transition-all duration-200",
                  canAccessCourses
                    ? "cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                {!canAccessCourses && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Assessment Required</p>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border",
                        getDifficultyVariant(course.difficulty)
                      )}>
                        {course.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    {canAccessCourses && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {course.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-md">
                        {skill}
                      </span>
                    ))}
                    {course.skills.length > 3 && (
                      <span className="px-2 py-0.5 text-[10px] text-muted-foreground">
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
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Courses Available</h2>
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
  const allCategories = [...courseCategories, ...(dynamicCourses.length > 0 ? [DYNAMIC_CATEGORY] : [])];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Training Courses</h1>
          <p className="text-muted-foreground">Choose your specialization and start learning</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <GraduationCap className="h-5 w-5 text-primary" />
          )}
          <span className="text-sm font-medium">{allCategories.length} Categories</span>
        </div>
      </div>

      {!canAccessCourses && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
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
                <div className="p-3 rounded-full bg-destructive/10 border border-destructive/20">
                  <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Failed to Load Courses</h3>
                  <p className="text-sm text-destructive/80">{error}</p>
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
          const coursesCount = category.id === 'cyber-ops'
            ? dynamicCourses.length
            : (category.id === 'vishwakarma-university' ? 1 : 0);

          return (
            <Card
              key={category.id}
              onClick={() => canAccessCourses && setSelectedCategory(category.id)}
              className={cn(
                "group transition-all duration-200 overflow-hidden",
                canAccessCourses
                  ? "cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              {!canAccessCourses && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Locked</p>
                  </div>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{category.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                  {coursesCount > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>{coursesCount} Comprehensive Course{coursesCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Self-paced Learning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Industry Recognition</span>
                  </div>
                </div>

                {canAccessCourses && coursesCount > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="text-sm font-medium text-primary">
                      Explore {coursesCount} Course{coursesCount !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
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
