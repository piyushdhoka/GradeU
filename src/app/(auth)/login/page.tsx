'use client';
import { LoginForm } from '@student/components/Auth/LoginForm';
import { useAuth } from '@context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@components/ui/loader';

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
    return <PageLoader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <LoginForm />
    </div>
  );
}
