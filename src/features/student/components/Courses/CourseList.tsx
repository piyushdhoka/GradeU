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

  // Render Course Grid directly
  const courses = dynamicCourses.map((c) => ({
    id: c.id,
    slug: c.slug || c.id,
    title: c.title,
    category: 'vishwakarma-university' as const,
    url: '#',
    description: c.description || 'No description available.',
    disclaimer: 'This mission is dynamically generated.',
    difficulty: (c.difficulty
      ? c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)
      : 'Beginner') as CourseData['difficulty'],
    duration: c.estimated_hours ? `${c.estimated_hours} hours` : 'Self-paced',
    skills: c.category ? [c.category] : ['Cybersecurity'],
  }));

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Training Courses</h1>
          <p className="text-muted-foreground">
            AI-generated specialized training missions. Choose a course to begin.
          </p>
        </div>
        <div className="bg-card border-border/50 flex items-center gap-2 rounded-lg border px-4 py-2">
          {loading ? <Loader size="sm" /> : <GraduationCap className="text-primary h-5 w-5" />}
          <span className="text-sm font-medium">{courses.length} Available Missions</span>
        </div>
      </div>

      {/* Course Grid */}
      {courses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              onClick={() => onCourseSelect(course.slug)}
              className="group border-border/50 hover:border-primary/30 hover:shadow-primary/5 relative cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl"
            >
              <CardHeader className="pb-3">
                <CardTitle className="group-hover:text-primary text-xl transition-colors">
                  {course.title}
                </CardTitle>
                <CardDescription className="mt-2 line-clamp-2 leading-relaxed">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-wrap gap-3">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                      getDifficultyVariant(course.difficulty)
                    )}
                  >
                    {course.difficulty}
                  </span>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {course.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-primary/10 text-primary border-primary/20 rounded-lg border px-2.5 py-1 text-[10px] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="border-border/50 mt-6 flex items-center justify-between border-t pt-4">
                  <span className="text-primary text-sm font-black tracking-widest uppercase group-hover:underline">
                    Launch Mission
                  </span>
                  <ChevronRight className="text-primary h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      )}
    </div>
  );
};
