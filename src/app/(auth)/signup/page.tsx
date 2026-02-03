'use client';
import { RegisterForm } from '@student/components/Auth/RegisterForm';
import { useAuth } from '@context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@components/ui/loader';

export default function SignupPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <RegisterForm />
    </div>
  );
}
