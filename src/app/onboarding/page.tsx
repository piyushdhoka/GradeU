"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, User, Phone, Mail, GraduationCap, Building2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";

export default function OnboardingPage() {
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        email_type: 'personal' as 'vu' | 'personal',
        contact_email: '',
        faculty: '',
        department: '',
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                contact_email: user.email || '',
                phone_number: user.phone_number || '',
                faculty: user.faculty || '',
                department: user.department || '',
                email_type: user.email_type || 'personal',
            }));

            if (user.onboarding_completed) {
                router.replace('/dashboard');
            }
        }
    }, [user, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, email_type: value as 'vu' | 'personal' }));
        setError(null);
    };

    const validate = () => {
        if (!formData.name.trim()) return "Name is required";
        if (!formData.phone_number.trim()) return "Phone number is required";
        if (!formData.faculty.trim()) return "Faculty is required";
        if (!formData.department.trim()) return "Department is required";

        if (formData.email_type === 'vu') {
            if (!formData.contact_email.endsWith('vupune.ac.in')) {
                return "VU Mail must end with @vupune.ac.in";
            }
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        try {
            if (!user) throw new Error("No user found");

            const updates = {
                full_name: formData.name,
                phone_number: formData.phone_number,
                faculty: formData.faculty,
                department: formData.department,
                contact_email: formData.contact_email,
                email_type: formData.email_type,
                onboarding_completed: true,
            };

            const { data: results, error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .limit(1);

            const data = results?.[0];

            if (updateError) throw updateError;

            if (!data || !data.onboarding_completed) {
                throw new Error("Database refused update. Please check RLS policies or internet connection.");
            }

            updateUser({
                name: formData.name,
                phone_number: formData.phone_number,
                faculty: formData.faculty,
                department: formData.department,
                contact_email: formData.contact_email,
                email_type: formData.email_type,
                onboarding_completed: true
            });

            router.push('/dashboard');

        } catch (err: any) {
            console.error("Onboarding error:", err);
            setError(err.message || "Failed to save details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-zinc-400 font-mono animate-pulse">AUTHENTICATING...</p>
            </div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle mesh background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[70%] bg-emerald-500/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[40%] h-[60%] bg-zinc-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-lg relative z-10 space-y-10">
                {/* Minimal Header */}
                <div className="text-center space-y-1 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-3xl font-semibold tracking-tight text-white/90">
                        Complete your profile
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Just a few details to get you started with <span className="text-emerald-500/80 font-medium">CyberCoach</span>
                    </p>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="bg-red-500/5 border border-red-500/10 text-red-400/90 px-4 py-3 rounded-xl text-xs font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <Input
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. John Doe"
                                    autoComplete="name"
                                    className="bg-zinc-950/50 border-white/5 focus:border-emerald-500/30 transition-colors"
                                />
                                <Input
                                    label="Phone Number"
                                    name="phone_number"
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="bg-zinc-950/50 border-white/5 focus:border-emerald-500/30 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5 sm:col-span-1">
                                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider ml-1">
                                        Email Type
                                    </label>
                                    <Select
                                        value={formData.email_type}
                                        onValueChange={handleSelectChange}
                                    >
                                        <SelectTrigger className="bg-zinc-950/50 border-white/5 focus:ring-emerald-500/20 text-white rounded-xl h-10 transition-colors">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                                            <SelectItem value="personal">Personal</SelectItem>
                                            <SelectItem value="vu">University</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Email Address"
                                        name="contact_email"
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={handleInputChange}
                                        placeholder={formData.email_type === 'vu' ? "user@vupune.ac.in" : "user@example.com"}
                                        className="bg-zinc-950/50 border-white/5 focus:border-emerald-500/30 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Input
                                    label="Faculty"
                                    name="faculty"
                                    value={formData.faculty}
                                    onChange={handleInputChange}
                                    placeholder="Your faculty"
                                    className="bg-zinc-950/50 border-white/5 focus:border-emerald-500/30 transition-colors"
                                />
                                <Input
                                    label="Department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    placeholder="Your department"
                                    className="bg-zinc-950/50 border-white/5 focus:border-emerald-500/30 transition-colors"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98]"
                            isLoading={loading}
                        >
                            {loading ? "Initializing..." : "Get Started"}
                        </Button>
                    </form>
                </div>

                <p className="text-zinc-700 text-[10px] text-center tracking-widest uppercase font-medium">
                    &copy; {new Date().getFullYear()} CYBERCOACH
                </p>
            </div>
        </div>
    );
}
