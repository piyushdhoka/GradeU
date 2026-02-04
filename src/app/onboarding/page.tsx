'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, User, Phone, Mail, GraduationCap, Building2, Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';

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
    // If no user and not loading, redirect to login
    if (!user) {
      // Give auth a moment to initialize
      const timeout = setTimeout(() => {
        if (!user) router.replace('/login');
      }, 2000);
      return () => clearTimeout(timeout);
    }

    // Pre-fill form with user data
    setFormData((prev) => ({
      ...prev,
      name: user.name || '',
      contact_email: user.email || '',
      phone_number: user.phone_number || '',
      faculty: user.faculty || '',
      department: user.department || '',
      email_type: user.email_type || 'personal',
    }));

    // If already onboarded, redirect to dashboard immediately
    if (user.onboarding_completed) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, email_type: value as 'vu' | 'personal' }));
    setError(null);
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.phone_number.trim()) return 'Phone number is required';
    if (!formData.faculty.trim()) return 'Faculty is required';
    if (!formData.department.trim()) return 'Department is required';

    if (formData.email_type === 'vu') {
      if (!formData.contact_email.endsWith('vupune.ac.in')) {
        return 'VU Mail must end with @vupune.ac.in';
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
      if (!user) throw new Error('No user found');

      // Ensure we have an active session for RLS
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.');
      }

      const updates = {
        full_name: formData.name,
        phone_number: formData.phone_number,
        faculty: formData.faculty,
        department: formData.department,
        contact_email: formData.contact_email,
        email_type: formData.email_type,
        onboarding_completed: true,
      };

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      if (!data) {
        throw new Error('Profile not found. Please ensure your account setup is complete.');
      }

      updateUser({
        name: formData.name,
        phone_number: formData.phone_number,
        faculty: formData.faculty,
        department: formData.department,
        contact_email: formData.contact_email,
        email_type: formData.email_type,
        onboarding_completed: true,
      });

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="animate-pulse font-mono text-zinc-400">AUTHENTICATING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0b] p-6">
      {/* Subtle mesh background */}
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden opacity-20">
        <div className="absolute -top-[30%] -left-[10%] h-[70%] w-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -right-[10%] -bottom-[20%] h-[60%] w-[40%] rounded-full bg-zinc-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-10">
        {/* Minimal Header */}
        <div className="animate-in fade-in slide-in-from-top-4 space-y-1 text-center duration-700">
          <h1 className="text-3xl font-semibold tracking-tight text-white/90">
            Complete your profile
          </h1>
          <p className="text-sm text-zinc-500">
            Just a few details to get you started with{' '}
            <span className="font-medium text-emerald-500/80">GradeU</span>
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl duration-700 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-center text-xs font-medium text-red-400/90">
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
                  className="border-white/5 bg-zinc-950/50 transition-colors focus:border-emerald-500/30"
                />
                <Input
                  label="Phone Number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="border-white/5 bg-zinc-950/50 transition-colors focus:border-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="ml-1 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
                    Email Type
                  </label>
                  <Select value={formData.email_type} onValueChange={handleSelectChange}>
                    <SelectTrigger className="h-10 rounded-xl border-white/5 bg-zinc-950/50 text-white transition-colors focus:ring-emerald-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900 text-zinc-300">
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
                    placeholder={
                      formData.email_type === 'vu' ? 'user@vupune.ac.in' : 'user@example.com'
                    }
                    className="border-white/5 bg-zinc-950/50 transition-colors focus:border-emerald-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleInputChange}
                  placeholder="Your faculty"
                  className="border-white/5 bg-zinc-950/50 transition-colors focus:border-emerald-500/30"
                />
                <Input
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Your department"
                  className="border-white/5 bg-zinc-950/50 transition-colors focus:border-emerald-500/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-emerald-600 font-medium text-white shadow-lg shadow-emerald-500/10 transition-all hover:bg-emerald-500 active:scale-[0.98]"
              isLoading={loading}
            >
              {loading ? 'Initializing...' : 'Get Started'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] font-medium tracking-widest text-zinc-700 uppercase">
          &copy; {new Date().getFullYear()} GRADEU
        </p>
      </div>
    </div>
  );
}
