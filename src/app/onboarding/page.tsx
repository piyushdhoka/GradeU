'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, User, Phone, Mail, GraduationCap, Building2, Loader2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
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

const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Academic Details', icon: GraduationCap },
  { id: 3, title: 'Contact', icon: Mail },
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

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

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.name.trim()) return 'Name is required';
      if (!formData.phone_number.trim()) return 'Phone number is required';
    }
    if (step === 2) {
      if (!formData.faculty.trim()) return 'Faculty is required';
      if (!formData.department.trim()) return 'Department is required';
    }
    if (step === 3) {
      if (formData.email_type === 'vu') {
        if (!formData.contact_email.endsWith('vupune.ac.in')) {
          return 'VU Mail must end with @vupune.ac.in';
        }
      }
    }
    return null;
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

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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

      <div className="relative z-10 w-full max-w-lg space-y-8">
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

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div key={step.id} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) {
                      setCurrentStep(step.id);
                      setError(null);
                    }
                  }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    isCurrent
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : isCompleted
                        ? 'border border-emerald-500/20 bg-emerald-500/5 text-emerald-500/70 cursor-pointer hover:bg-emerald-500/10'
                        : 'border border-zinc-800 bg-zinc-900/50 text-zinc-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{step.id}</span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`h-px w-6 ${isCompleted ? 'bg-emerald-500/30' : 'bg-zinc-800'}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl duration-700 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-center text-xs font-medium text-red-400/90">
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-white/80">Personal Information</h2>
                  <p className="text-xs text-zinc-500">Tell us a bit about yourself</p>
                </div>
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
              </div>
            )}

            {/* Step 2: Academic Details */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-white/80">Academic Details</h2>
                  <p className="text-xs text-zinc-500">Your university information</p>
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
            )}

            {/* Step 3: Contact */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-white/80">Contact Information</h2>
                  <p className="text-xs text-zinc-500">How should we reach you?</p>
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
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-emerald-600 px-6 font-medium text-white shadow-lg shadow-emerald-500/10 transition-all hover:bg-emerald-500"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 rounded-xl bg-emerald-600 px-8 font-medium text-white shadow-lg shadow-emerald-500/10 transition-all hover:bg-emerald-500 active:scale-[0.98]"
                  isLoading={loading}
                >
                  {loading ? 'Initializing...' : 'Get Started'}
                </Button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-[10px] font-medium tracking-widest text-zinc-700 uppercase">
          &copy; {new Date().getFullYear()} GRADEU
        </p>
      </div>
    </div>
  );
}
