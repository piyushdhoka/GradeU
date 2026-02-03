import React, { useState } from 'react';
import { Award, Download, Calendar, Shield, ExternalLink, GraduationCap } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { CertificateModal } from './CertificateModal';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@shared/components/ui/card';
import { Button, buttonVariants } from '@shared/components/ui/button';
import { cn } from '@lib/utils';

import { studentService } from '@services/studentService';

export const Certificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchCertificates = async () => {
      if (!user?.id) return;
      try {
        const data = await studentService.getCertificates(user.id);
        setCertificates(data);
      } catch (error) {
        console.error('Failed to load certificates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [user?.id]);

  const [viewCertificate, setViewCertificate] = useState<{
    isOpen: boolean;
    courseName: string;
    date: Date;
  } | null>(null);

  return (
    <div className="animate-in fade-in flex min-h-screen flex-col gap-8 p-4 duration-500 md:p-8">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <Award className="text-primary h-8 w-8" />
          Your <span className="text-primary">Certificates</span>
        </h1>
        <p className="text-muted-foreground">
          Verifiable certifications earned through your training courses.
        </p>
      </div>

      {/* Certificates Grid */}
      <div className="grid gap-6">
        <div className="flex items-center gap-4">
          <h2 className="text-muted-foreground/70 text-sm font-semibold tracking-wider uppercase">
            My Certificates
          </h2>
          <div className="bg-border/50 h-px flex-1" />
        </div>

        {certificates.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {certificates.map((cert: any, idx: number) => {
              const certificateUrl = cert.certificate_url;
              // If no URL (legacy or error), skip? Or show placeholder?
              if (!certificateUrl) return null;

              const filename = certificateUrl.split('/').pop() || '';
              const parts = filename.split('_');
              let displayTitle = 'Course';

              // Try to get title from DB record if possible, otherwise parse filename
              // For new certs, we might want to store course_title in certificates table for easier display
              // But for now, parsing filename is consistent with Profile.tsx
              if (parts.length >= 2) {
                displayTitle = parts[1].replace(/%20/g, ' ');
              }

              const completionDate = cert.issued_at ? new Date(cert.issued_at) : new Date();

              return (
                <Card
                  key={cert.id || idx}
                  className="group border-border/50 hover:border-primary/40 bg-secondary/30 overflow-hidden backdrop-blur-sm transition-all duration-300"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="group-hover:text-primary text-xl font-bold transition-colors">
                          {displayTitle}
                        </CardTitle>
                        <CardDescription className="text-primary/70 flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase">
                          <Shield className="h-3 w-3" />
                          Certificate ID:{' '}
                          {cert.id
                            ? cert.id.slice(0, 8).toUpperCase()
                            : Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </CardDescription>
                      </div>
                      <div className="bg-primary/10 border-primary/20 group-hover:bg-primary rounded-xl border p-2.5 transition-all duration-300 group-hover:text-black">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        Issued on{' '}
                        {completionDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={certificateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'sm' }),
                            'h-9 px-4 text-xs font-semibold'
                          )}
                        >
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Preview
                        </a>
                        <Button
                          size="sm"
                          className="h-9 px-4 text-xs font-bold"
                          onClick={() =>
                            setViewCertificate({
                              isOpen: true,
                              courseName: displayTitle,
                              date: completionDate,
                            })
                          }
                        >
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-2 border-dashed bg-transparent py-20">
            <CardContent className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="bg-muted/50 border-border/50 rounded-full border p-6">
                <Award className="text-muted-foreground/30 h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">No Certificates Found</h3>
                <p className="text-muted-foreground mx-auto max-w-xs text-sm">
                  You haven't earned any certifications yet. Complete your first course to unlock
                  your official credentials.
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                Browse Courses
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {viewCertificate && (
        <CertificateModal
          isOpen={viewCertificate.isOpen}
          onClose={() => setViewCertificate(null)}
          courseName={viewCertificate.courseName}
          studentName={user?.name || 'Student'}
          completionDate={viewCertificate.date}
          isVU={true}
          facultyName="Kiran Deshpande"
        />
      )}
    </div>
  );
};
