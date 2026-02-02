import React, { useEffect, useState } from 'react';
import { User, Award, BookOpen, Target, Clock, Star, Shield, Activity, Terminal, Download, Share2 } from 'lucide-react';
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
import { SEO } from '@components/SEO/SEO';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalModules: 0,
    completedModules: 0,
    coursesEnrolled: 0,
    certificatesEarned: 0,
    hoursActive: 0
  });
  const [courseProgress, setCourseProgress] = useState<{ title: string, progress: number }[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [vuDetails, setVuDetails] = useState<any>(null);

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
        const vuEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('vu_student_email') : null;
        if (vuEmail) {
          const vuStudent = await courseService.getVUStudent(vuEmail);
          if (vuStudent) {
            setVuDetails(vuStudent);
            const vuTotal = 11;
            const vuCompleted = (vuStudent.progress || []).filter((p: any) => p.course_id === 'vu-web-security' && p.completed).length;
            const percent = Math.round((vuCompleted / vuTotal) * 100);
            setCourseProgress([{ title: 'Web Application Security', progress: percent }]);
            setStats({
              totalModules: 11,
              completedModules: vuCompleted,
              coursesEnrolled: 1,
              certificatesEarned: certs.length,
              hoursActive: Math.round((vuCompleted * 2) + 12)
            });
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [user?.id]);

  if (!user) return null;

  // Mission readiness based on the loaded VU stats
  const missionReadiness = stats.totalModules > 0
    ? Math.round((stats.completedModules / stats.totalModules) * 100)
    : 0;

  const achievements = [
    { id: 1, title: 'Getting Started', description: 'Enrolled in your first course', icon: Target, earned: stats.coursesEnrolled > 0 },
    { id: 2, title: 'Active Learner', description: 'Completed 3 course modules', icon: BookOpen, earned: stats.completedModules >= 3 },
    { id: 3, title: 'Lab Master', description: 'Completed 5 hands-on labs', icon: Star, earned: false },
    { id: 4, title: 'Certified', description: 'Earned your first certificate', icon: Award, earned: stats.certificatesEarned > 0 },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      <SEO title="Profile" description="Your profile and achievements." />

      {/* Hero Section */}
      <Card className="shadow-sm border-border/50 overflow-hidden relative">
        <div className="absolute top-0 w-full h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/50"></div>
        <CardContent className="pt-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-primary/50" />
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground p-2 rounded-xl border-4 border-background shadow-sm">
                <Shield className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{vuDetails?.name || user.name}</h1>
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-[10px]">
                  ACTIVE STUDENT
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span className="font-mono">{vuDetails?.email || user.email}</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border"></div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-mono">ID: {user.id ? user.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}</span>
                </div>
              </div>

              {/* Extended Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/5 text-sm text-muted-foreground">
                {user.faculty && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary/70" />
                    <span>{user.faculty} &bull; {user.department}</span>
                  </div>
                )}
                {user.phone_number && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary/70" />
                    <span className="font-mono">{user.phone_number}</span>
                  </div>
                )}
                {user.contact_email && user.contact_email !== user.email && (
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary/70" />
                    <span>{user.contact_email} <span className="text-xs opacity-50">({user.email_type === 'vu' ? 'VU Mail' : 'Alt Email'})</span></span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none text-right px-4">
                <div className="text-3xl font-bold text-primary">{missionReadiness}%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Course Progress</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <BookOpen className="w-8 h-8 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.completedModules}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Modules Completed</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <Target className="w-8 h-8 text-primary mb-2" />
            <div className="text-2xl font-bold">{Math.floor(stats.completedModules / 3)}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Labs</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <Clock className="w-8 h-8 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.hoursActive}h</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Learn Time</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <Award className="w-8 h-8 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.certificatesEarned}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Certificates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Left Column: Combat Capabilities (Progress) */}
        <Card className="col-span-full lg:col-span-4 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
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
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mb-3 opacity-20" />
                <p>No labs completed yet.</p>
                <p className="text-xs mt-1">Ensure your VU account is connected.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Achievements & Ribbons */}
        <div className="col-span-full lg:col-span-3 space-y-6">
          {/* Service Ribbons */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Service Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      achievement.earned
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/50 border-transparent opacity-60"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-md",
                      achievement.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <achievement.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-none mb-1">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground leading-snug">{achievement.description}</p>
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
                <Award className="w-5 h-5 text-primary" />
                Certificates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {certificates && certificates.length > 0 ? (
                certificates.map((cert: any, idx: number) => {
                  const certUrl = cert.certificate_url;
                  const filename = certUrl.split('/').pop() || "";
                  const parts = filename.split('_');
                  let displayTitle = "Classified Operation";
                  if (parts.length >= 2) {
                    displayTitle = parts[1].replace(/%20/g, ' ');
                  }
                  const completionDate = cert.issued_at ? new Date(cert.issued_at) : new Date();

                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{displayTitle}</div>
                          <div className="text-xs text-muted-foreground">{completionDate.toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(certUrl, '_blank')}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewCertificate({
                          isOpen: true,
                          courseName: displayTitle,
                          date: completionDate
                        })}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  {courseProgress.some(p => p.progress === 100) ? (
                    <div className="animate-pulse flex flex-col items-center">
                      <Award className="w-8 h-8 text-primary mb-2" />
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
          studentName={vuDetails?.name || user?.name || 'Student'}
          completionDate={viewCertificate.date}
          isVU={true}
          facultyName="Kiran Deshpande"
        />
      )}
    </div>
  );
};