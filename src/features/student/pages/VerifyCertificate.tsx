'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@lib/supabase';
import { Award, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';

export const VerifyCertificate = () => {
  const params = useParams();
  const userId = params.userId as string;
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!userId) {
        setError('Invalid Verification Link');
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile and certificates
        const { data: resultData, error } = await supabase
          .from('users')
          .select('name, certificates, xp, level')
          .eq('id', userId)
          .limit(1);

        const data = resultData?.[0];

        if (error) throw error;
        if (!data) throw new Error('Student not found');

        setStudent(data);
      } catch (err: any) {
        console.error('Verification failed:', err);
        setError('Certificate holder not found or invalid ID.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f0a] p-4 text-white">
        <AlertTriangle className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">Verification Failed</h1>
        <p className="text-gray-400">{error || 'Unable to verify student records.'}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f0a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 p-6">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="text-brand-400 h-8 w-8" />
          <span className="font-sans text-xl font-black tracking-tighter uppercase">
            Grade<span className="text-brand-400">U</span>
          </span>
        </div>
        <div className="text-sm font-medium text-zinc-400">Official Credential Validation</div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-4xl grow flex-col items-center p-8">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-800 bg-[#111827] p-8 text-center shadow-2xl">
          <div className="bg-brand-400 absolute top-0 left-0 h-2 w-full"></div>

          <div className="mb-6 flex justify-center">
            <div className="bg-brand-400/10 border-brand-400/50 flex h-24 w-24 items-center justify-center rounded-full border">
              <CheckCircle className="text-brand-400 h-12 w-12" />
            </div>
          </div>

          <h1 className="mb-2 text-3xl font-bold">Verified Student</h1>
          <p className="mb-8 text-gray-400">
            The identity of this student has been confirmed by GradeU.
          </p>

          <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg bg-black/30 p-6 text-left">
            <div>
              <p className="text-sm tracking-wider text-gray-500 uppercase">Student Name</p>
              <p className="text-xl font-bold text-white">{student.name}</p>
            </div>
            <div>
              <p className="text-sm tracking-wider text-gray-500 uppercase">Current Level</p>
              <p className="text-brand-400 text-xl font-bold">Level {student.level} Student</p>
            </div>
          </div>

          <h2 className="mb-4 flex items-center text-left text-lg font-bold">
            <Award className="mr-2 h-5 w-5 text-yellow-500" />
            Issued Certificates
          </h2>

          <div className="space-y-3">
            {student.certificates && student.certificates.length > 0 ? (
              student.certificates.map((cert: string, index: number) => {
                // Extract course name from filename roughly if possible, or just show generic
                // URL: .../certificates/USER_Coursename_Time.png
                // Let's try to parse the file name from URL
                const filename = cert.split('/').pop() || '';
                const parts = filename.split('_');
                // parts[0] is user, parts[1] is course... roughly
                let courseNameDisplay = 'Academic Excellence Course';
                if (parts.length > 2) {
                  courseNameDisplay = parts[1].replace(/%20/g, ' '); // simple cleanup
                }

                return (
                  <a
                    key={index}
                    href={cert}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4 transition hover:bg-gray-700"
                  >
                    <span className="font-medium text-gray-200 group-hover:text-white">
                      {courseNameDisplay}
                    </span>
                    <span className="text-brand-400 border-brand-400/30 bg-brand-400/10 rounded border px-2 py-1 text-xs">
                      Active
                    </span>
                  </a>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 italic">No certificates issued yet.</p>
            )}
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-gray-600">
        &copy; {new Date().getFullYear()} GradeU Academic Platform. All verification data is
        secured.
      </footer>
    </div>
  );
};
