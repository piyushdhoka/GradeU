import React, { useEffect, useState } from 'react';
import {
  User,
  Award,
  BookOpen,
  Target,
  Clock,
  Star,
  Shield,
  Activity,
  Terminal,
  Download,
  Share2,
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { courseService } from '@services/courseService';
import { studentService } from '@services/studentService';
import { CertificateModal } from '../Certificates/CertificateModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Progress } from '@shared/components/ui/progress';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalModules: 0,
    completedModules: 0,
    coursesEnrolled: 0,
    certificatesEarned: 0,
    hoursActive: 0,
  });
  const [courseProgress, setCourseProgress] = useState<{ title: string; progress: number }[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  const [viewCertificate, setViewCertificate] = useState<{
    isOpen: boolean;
    courseName: string;
    date: Date;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const loadAllData = async () => {
      setLoading(true);
      try {
        const certs = await studentService.getCertificates(user.id);
        setCertificates(certs);
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [user?.id]);

  if (!user) return null;

  // Mission readiness based on the loaded VU stats
  const missionReadiness =
    stats.totalModules > 0 ? Math.round((stats.completedModules / stats.totalModules) * 100) : 0;

  const achievements = [
    {
      id: 1,
      title: 'Getting Started',
      description: 'Enrolled in your first course',
      icon: Target,
      earned: stats.coursesEnrolled > 0,
    },
    {
      id: 2,
      title: 'Active Learner',
      description: 'Completed 3 course modules',
      icon: BookOpen,
      earned: stats.completedModules >= 3,
    },
    {
      id: 3,
      title: 'Lab Master',
      description: 'Completed 5 hands-on labs',
      icon: Star,
      earned: false,
    },
    {
      id: 4,
      title: 'Certified',
      description: 'Earned your first certificate',
      icon: Award,
      earned: stats.certificatesEarned > 0,
    },
  ];

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Hero Section */}
      <Card className="border-border/50 relative overflow-hidden shadow-sm">
        <div className="from-primary/10 via-primary/5 to-background border-border/50 absolute top-0 h-32 w-full border-b bg-linear-to-r"></div>
        <CardContent className="relative z-10 pt-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end">
            <div className="relative">
              <div className="bg-card border-background flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-4 shadow-xl">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="text-primary/50 h-16 w-16" />
                )}
              </div>
              <div className="bg-primary text-primary-foreground border-background absolute -right-3 -bottom-3 rounded-xl border-4 p-2 shadow-sm">
                <Shield className="h-5 w-5 fill-current" />
              </div>
            </div>

            <div className="mb-2 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                <Badge
                  variant="outline"
                  className="text-primary border-primary/20 bg-primary/5 text-[10px] tracking-wider uppercase"
                >
                  ACTIVE STUDENT
                </Badge>
              </div>

              <div className="text-muted-foreground flex flex-col gap-4 text-sm sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span className="font-mono">{user.email}</span>
                </div>
                <div className="bg-border hidden h-4 w-px sm:block"></div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-mono">
                    ID: {user.id ? user.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}
                  </span>
                </div>
              </div>

              {/* Extended Details */}
              <div className="text-muted-foreground mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-white/5 pt-4 text-sm sm:grid-cols-2">
                {user.faculty && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-primary/70 h-4 w-4" />
                    <span>
                      {user.faculty} &bull; {user.department}
                    </span>
                  </div>
                )}
                {user.phone_number && (
                  <div className="flex items-center gap-2">
                    <User className="text-primary/70 h-4 w-4" />
                    <span className="font-mono">{user.phone_number}</span>
                  </div>
                )}
                {user.contact_email && user.contact_email !== user.email && (
                  <div className="flex items-center gap-2">
                    <Terminal className="text-primary/70 h-4 w-4" />
                    <span>
                      {user.contact_email}{' '}
                      <span className="text-xs opacity-50">
                        ({user.email_type === 'vu' ? 'VU Mail' : 'Alt Email'})
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full gap-3 md:w-auto">
              <div className="flex-1 px-4 text-right md:flex-none">
                <div className="text-primary text-3xl font-bold">{missionReadiness}%</div>
                <div className="text-muted-foreground text-xs tracking-wider uppercase">
                  Course Progress
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="hover:border-primary/50 shadow-sm transition-colors">
          <CardContent className="flex flex-col items-center space-y-2 p-6 text-center">
            <BookOpen className="text-primary mb-2 h-8 w-8" />
            <div className="text-2xl font-bold">{stats.completedModules}</div>
            <p className="text-muted-foreground text-xs tracking-wider uppercase">
              Modules Completed
            </p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 shadow-sm transition-colors">
          <CardContent className="flex flex-col items-center space-y-2 p-6 text-center">
            <Target className="text-primary mb-2 h-8 w-8" />
            <div className="text-2xl font-bold">{Math.floor(stats.completedModules / 3)}</div>
            <p className="text-muted-foreground text-xs tracking-wider uppercase">Labs</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 shadow-sm transition-colors">
          <CardContent className="flex flex-col items-center space-y-2 p-6 text-center">
            <Clock className="text-primary mb-2 h-8 w-8" />
            <div className="text-2xl font-bold">{stats.hoursActive}h</div>
            <p className="text-muted-foreground text-xs tracking-wider uppercase">Learn Time</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 shadow-sm transition-colors">
          <CardContent className="flex flex-col items-center space-y-2 p-6 text-center">
            <Award className="text-primary mb-2 h-8 w-8" />
            <div className="text-2xl font-bold">{stats.certificatesEarned}</div>
            <p className="text-muted-foreground text-xs tracking-wider uppercase">Certificates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Left Column: Combat Capabilities (Progress) */}
        <Card className="col-span-full h-full shadow-sm lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="text-primary h-5 w-5" />
              Skills Overview
            </CardTitle>
            <CardDescription>Track your learning progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : courseProgress.length > 0 ? (
              courseProgress.map((cp, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{cp.title}</span>
                    <span className="text-primary">{cp.progress}%</span>
                  </div>
                  <Progress value={cp.progress} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-10 text-center">
                <Shield className="mb-3 h-12 w-12 opacity-20" />
                <p>No labs completed yet.</p>
                <p className="mt-1 text-xs">Ensure your VU account is connected.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Achievements & Ribbons */}
        <div className="col-span-full space-y-6 lg:col-span-3">
          {/* Service Ribbons */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="text-primary h-5 w-5" />
                Service Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                      achievement.earned
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/50 border-transparent opacity-60'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-md p-2',
                        achievement.earned
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <achievement.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="mb-1 text-sm leading-none font-bold">{achievement.title}</h4>
                      <p className="text-muted-foreground text-xs leading-snug">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certificates List */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="text-primary h-5 w-5" />
                Certificates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {certificates && certificates.length > 0 ? (
                certificates.map((cert: any, idx: number) => {
                  const certUrl = cert.certificate_url;
                  const filename = certUrl.split('/').pop() || '';
                  const parts = filename.split('_');
                  let displayTitle = 'Classified Operation';
                  if (parts.length >= 2) {
                    displayTitle = parts[1].replace(/%20/g, ' ');
                  }
                  const completionDate = cert.issued_at ? new Date(cert.issued_at) : new Date();

                  return (
                    <div
                      key={idx}
                      className="border-border/50 hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-primary/10 text-primary shrink-0 rounded-md p-2">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{displayTitle}</div>
                          <div className="text-muted-foreground text-xs">
                            {completionDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => window.open(certUrl, '_blank')}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() =>
                            setViewCertificate({
                              isOpen: true,
                              courseName: displayTitle,
                              date: completionDate,
                            })
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  {courseProgress.some((p) => p.progress === 100) ? (
                    <div className="flex animate-pulse flex-col items-center">
                      <Award className="text-primary mb-2 h-8 w-8" />
                      <p>Generating Certificate...</p>
                    </div>
                  ) : (
                    <p>No certificates earned yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {viewCertificate && (
        <CertificateModal
          isOpen={viewCertificate.isOpen}
          onClose={() => setViewCertificate(null)}
          courseName={viewCertificate.courseName}
          studentName={user?.name || 'Student'}
          completionDate={viewCertificate.date}
          facultyName="Kiran Deshpande"
        />
      )}
    </div>
  );
};
