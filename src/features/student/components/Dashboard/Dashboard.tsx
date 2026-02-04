import React, { useEffect, useState } from 'react';

import {
  Shield,
  Award,
  Play,
  ChevronRight,
  Terminal,
  BookOpen,
  GraduationCap,
  Zap,
  Clock,
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabase';
import {
  studentService,
  StudentStats,
  RecentActivity,
  ActiveOperation,
} from '@services/studentService';
import { labApiService, LabStats } from '@services/labApiService';
import { labs } from '@data/labs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@shared/components/ui/progress';
import { cn } from '@lib/utils';
import { Skeleton } from '@components/ui/skeleton';
import { CertificateModal } from '../Certificates/CertificateModal';

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StudentStats>({
    coursesCompleted: 0,
    certificatesEarned: 0,
    liveLabsCompleted: 0,
    studyTime: '0 hours',
  });
  const [labStats, setLabStats] = useState<LabStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [activeOperation, setActiveOperation] = useState<ActiveOperation | null>(null);

  const [viewCertificate, setViewCertificate] = useState<{
    isOpen: boolean;
    courseName: string;
    date: Date;
  } | null>(null);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      // Fetch all data in a single optimized API call
      const overviewData = await studentService.getFullDashboardData(user.id);

      setStatsData(overviewData.stats);
      setActivities(overviewData.activities);
      setActiveOperation(overviewData.activeOperation);

      if (overviewData.labStats) {
        setLabStats(overviewData.labStats);
      } else {
        // Fallback for lab stats if for some reason missing
        const labStatsData = await labApiService.getLabStats().catch(() => ({
          totalLabs: labs.length,
          completedLabs: 0,
          completionPercentage: 0,
          completedLabIds: [],
        }));
        setLabStats(labStatsData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStatsData({
        coursesCompleted: 0,
        certificatesEarned: 0,
        liveLabsCompleted: 0,
        studyTime: '0 hours',
      });
      setLabStats({
        totalLabs: labs.length,
        completedLabs: 0,
        completionPercentage: 0,
        completedLabIds: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!user?.id) return;

    const channel = supabase
      .channel('student-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'module_progress',
          filter: `student_id=eq.${user.id}`,
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'certificates', filter: `student_id=eq.${user.id}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-border shadow-sm transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{statsData.coursesCompleted}</div>
            )}
            <p className="text-muted-foreground text-xs">Across all security tracks</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-border shadow-sm transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labs Finished</CardTitle>
            <Terminal className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {labStats
                  ? `${labStats.completedLabs}/${labStats.totalLabs}`
                  : `${statsData.liveLabsCompleted}/6`}
              </div>
            )}
            <p className="text-muted-foreground text-xs">Hands-on hacking sessions</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-border shadow-sm transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{statsData.certificatesEarned}</div>
            )}
            <p className="text-muted-foreground text-xs">Professional level validations</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-border shadow-sm transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{statsData.studyTime}</div>
            )}
            <p className="text-muted-foreground text-xs">Spent in training environment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="border-primary/20 bg-primary/5 hover:border-primary/40 col-span-full shadow-sm transition-colors duration-200 lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                    <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
                  </span>
                  Current Goal
                </CardTitle>
                <CardDescription>Your current learning objective</CardDescription>
              </div>
              <Zap className="text-primary h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : activeOperation ? (
              <>
                <div>
                  <h3 className="mb-1 text-xl font-bold">{activeOperation.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    Currently on:{' '}
                    <span className="text-foreground font-semibold">
                      {activeOperation.currentModuleTitle}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Course Completion</span>
                    <span className="text-primary font-bold">{activeOperation.progress}%</span>
                  </div>
                  <Progress value={activeOperation.progress} className="h-2" />
                </div>
                <div className="flex gap-4">
                  {activeOperation.progress >= 100 ? (
                    <Button
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                      onClick={() =>
                        setViewCertificate({
                          isOpen: true,
                          courseName: activeOperation.title,
                          date: new Date(),
                        })
                      }
                    >
                      <Award className="mr-2 h-4 w-4" /> Download Certificate
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      onClick={() => onTabChange?.(`courses/${activeOperation.courseId}`)}
                    >
                      <Play className="mr-2 h-4 w-4" /> Resume {activeOperation.title}
                    </Button>
                  )}
                  <Button variant="outline" size="icon" onClick={() => onTabChange?.('labs')}>
                    <Terminal className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-muted-foreground mb-4">No active courses detected.</p>
                <Button onClick={() => onTabChange?.('courses')}>Browse Courses</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border col-span-full shadow-sm transition-all duration-200 hover:shadow-md lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest training activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="mt-2 h-2 w-2 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <div
                    key={index}
                    className="group hover:bg-muted/30 -m-2 flex cursor-pointer items-start gap-4 rounded-lg p-2 transition-colors"
                    onClick={() =>
                      activity.courseId && onTabChange?.(`courses/${activity.courseId}`)
                    }
                  >
                    <div
                      className={cn(
                        'mt-1 h-2 w-2 rounded-full transition-transform group-hover:scale-125',
                        activity.type === 'completion' ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="group-hover:text-primary text-sm leading-none font-medium transition-colors">
                        {activity.action}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {activity.created_at
                          ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
                          : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No recent activity.
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary mt-6 w-full text-xs"
              onClick={() => onTabChange?.('profile')}
            >
              View All History <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="border-border/50 hover:border-border shadow-sm transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="hover:bg-primary/5 hover:text-primary hover:border-primary/30 justify-between transition-all"
              onClick={() => onTabChange?.('courses')}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Explore Courses</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>

            <Button
              variant="outline"
              className="hover:bg-primary/5 hover:text-primary hover:border-primary/30 justify-between transition-all"
              onClick={() => onTabChange?.('certificates')}
            >
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Download Certificates</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>

            <Button
              variant="outline"
              className="hover:bg-primary/5 hover:text-primary hover:border-primary/30 justify-between transition-all"
              onClick={() => onTabChange?.('labs')}
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                <span>Academic Labs</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {viewCertificate && (
        <CertificateModal
          isOpen={viewCertificate.isOpen}
          onClose={() => setViewCertificate(null)}
          courseName={viewCertificate.courseName}
          studentName={user?.name || 'Student'}
          completionDate={viewCertificate.date}
          isVU={user?.email?.endsWith('vupune.ac.in')}
          facultyName={user?.faculty}
        />
      )}
    </div>
  );
};
