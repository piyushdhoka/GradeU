"use client";
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
                setError("Invalid Verification Link");
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
                if (!data) throw new Error("Student not found");

                setStudent(data);
            } catch (err: any) {
                console.error("Verification failed:", err);
                setError("Certificate holder not found or invalid ID.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col items-center justify-center p-4">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                <p className="text-gray-400">{error || "Unable to verify student records."}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-gray-800 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="text-brand-400 h-8 w-8" />
                    <span className="font-sans font-black text-xl tracking-tighter uppercase">Grade<span className="text-brand-400">U</span></span>
                </div>
                <div className="text-sm text-zinc-400 font-medium">Official Credential Validation</div>
            </header>

            {/* Content */}
            <main className="grow flex flex-col items-center p-8 max-w-4xl mx-auto w-full">

                <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 w-full max-w-2xl text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-400"></div>

                    <div className="flex justify-center mb-6">
                        <div className="h-24 w-24 bg-brand-400/10 rounded-full flex items-center justify-center border border-brand-400/50">
                            <CheckCircle className="h-12 w-12 text-brand-400" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-2">Verified Student</h1>
                    <p className="text-gray-400 mb-8">The identity of this student has been confirmed by GradeU.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8 text-left bg-black/30 p-6 rounded-lg">
                        <div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider">Student Name</p>
                            <p className="text-xl font-bold text-white">{student.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider">Current Level</p>
                            <p className="text-xl font-bold text-brand-400">Level {student.level} Student</p>
                        </div>
                    </div>

                    <h2 className="text-left text-lg font-bold mb-4 flex items-center">
                        <Award className="mr-2 text-yellow-500 h-5 w-5" />
                        Issued Certificates
                    </h2>

                    <div className="space-y-3">
                        {student.certificates && student.certificates.length > 0 ? (
                            student.certificates.map((cert: string, index: number) => {
                                // Extract course name from filename roughly if possible, or just show generic
                                // URL: .../certificates/USER_Coursename_Time.png
                                // Let's try to parse the file name from URL
                                const filename = cert.split('/').pop() || "";
                                const parts = filename.split('_');
                                // parts[0] is user, parts[1] is course... roughly
                                let courseNameDisplay = "Academic Excellence Course";
                                if (parts.length > 2) {
                                    courseNameDisplay = parts[1].replace(/%20/g, ' '); // simple cleanup
                                }

                                return (
                                    <a
                                        key={index}
                                        href={cert}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition flex justify-between items-center group"
                                    >
                                        <span className="font-medium text-gray-200 group-hover:text-white">{courseNameDisplay}</span>
                                        <span className="text-xs text-brand-400 border border-brand-400/30 px-2 py-1 rounded bg-brand-400/10">Active</span>
                                    </a>
                                )
                            })
                        ) : (
                            <p className="text-gray-500 text-sm italic">No certificates issued yet.</p>
                        )}
                    </div>
                </div>

            </main>

            <footer className="p-6 text-center text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} GradeU Academic Platform. All verification data is secured.
            </footer>
        </div>
    );
};
