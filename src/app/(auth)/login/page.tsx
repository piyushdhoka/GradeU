'use client';
import { LoginForm } from '@student/components/Auth/LoginForm';
import { useAuth } from '@context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading while checking auth or redirecting
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="text-center">
          <div className="border-brand-400 mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="mt-4 text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <LoginForm />
    </div>
  );
}
