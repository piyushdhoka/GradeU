'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Clock,
  Award,
  Lock,
  CheckCircle,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Sparkles,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Advanced':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDifficultyAccent = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'group-hover:border-emerald-500/30';
      case 'Intermediate':
        return 'group-hover:border-amber-500/30';
      case 'Advanced':
        return 'group-hover:border-rose-500/30';
      default:
        return 'group-hover:border-primary/30';
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

  // Filter courses by search and difficulty
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        !searchQuery ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty =
        difficultyFilter === 'all' || course.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [courses, searchQuery, difficultyFilter]);

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Training Courses</h1>
            <p className="text-muted-foreground">
              Choose a course to begin your learning journey.
            </p>
          </div>
          <div className="bg-primary/5 border-primary/20 flex items-center gap-2 rounded-xl border px-4 py-2">
            {loading ? <Loader size="sm" /> : <GraduationCap className="text-primary h-5 w-5" />}
            <span className="text-sm font-medium">{courses.length} Available</span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses by name, description, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card border-border/50 focus:border-primary/30 focus:ring-primary/20 h-10 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition-colors focus:ring-1"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficultyFilter(level)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  difficultyFilter === level
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                {level === 'all' ? 'All Levels' : level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchCourses}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border/50 overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-2 h-10 w-full" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="mt-6 h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Grid */}
      {!loading && filteredCourses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              onClick={() => onCourseSelect(course.slug)}
              className={cn(
                'group border-border/50 relative cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl',
                getDifficultyAccent(course.difficulty)
              )}
            >
              {/* Subtle top accent line */}
              <div
                className={cn(
                  'absolute top-0 left-0 h-0.5 w-full opacity-0 transition-opacity group-hover:opacity-100',
                  course.difficulty === 'Beginner' && 'bg-gradient-to-r from-emerald-500 to-emerald-400',
                  course.difficulty === 'Intermediate' && 'bg-gradient-to-r from-amber-500 to-amber-400',
                  course.difficulty === 'Advanced' && 'bg-gradient-to-r from-rose-500 to-rose-400'
                )}
              />
              <CardHeader className="pb-3">
                <div className="mb-2 flex items-start justify-between">
                  <span
                    className={cn(
                      'rounded-lg border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
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
                <CardTitle className="group-hover:text-primary text-lg leading-tight transition-colors">
                  {course.title}
                </CardTitle>
                <CardDescription className="mt-1.5 line-clamp-2 text-sm leading-relaxed">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {course.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="border-border/50 mt-5 flex items-center justify-between border-t pt-4">
                  <span className="text-primary flex items-center gap-1.5 text-sm font-semibold group-hover:underline">
                    <Sparkles className="h-3.5 w-3.5" />
                    Start Course
                  </span>
                  <ChevronRight className="text-muted-foreground h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state after search */}
      {!loading && !error && filteredCourses.length === 0 && courses.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="text-muted-foreground mb-4 h-10 w-10" />
            <h3 className="mb-1 text-lg font-semibold">No courses found</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state - no courses at all */}
      {!loading && !error && courses.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="text-muted-foreground mb-4 h-10 w-10" />
            <h3 className="mb-1 text-lg font-semibold">No courses available yet</h3>
            <p className="text-muted-foreground text-sm">
              Check back soon for new training courses.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
