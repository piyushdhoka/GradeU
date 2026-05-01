# GradeU — Frontend Code Reference

---

## 1. `src/app/layout.tsx` — Root Layout

```tsx
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@context/AuthContext';
import { OnboardingGuard } from '@components/auth/OnboardingGuard';
import { Toaster } from '@shared/components/ui/sonner';
import './globals.css';
import Script from 'next/script';
import { siteConfig } from '@lib/metaConfig';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space' });

export const viewport = { themeColor: '#6EDB80' };

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    creator: '@GradeU_Edu',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={`${inter.className} bg-[#0F1115] text-white antialiased`}>
        <AuthProvider>
          <OnboardingGuard />
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
```

---

## 2. `src/app/page.tsx` — Home Page

```tsx
import { LandingPage } from '@student/components/Landing/LandingPage';
import { Metadata } from 'next';
import { siteConfig } from '@lib/metaConfig';

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [siteConfig.links.twitter, siteConfig.links.github],
    description: siteConfig.description,
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/courses?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <LandingPage />
    </>
  );
}
```

---

## 3. `src/app/(auth)/login/page.tsx` — Login Page

```tsx
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
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || user) return <PageLoader />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <LoginForm />
    </div>
  );
}
```

---

## 4. `src/app/(auth)/signup/page.tsx` — Signup Page

```tsx
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
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || user) return <PageLoader />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <RegisterForm />
    </div>
  );
}
```

---

## 5. `src/app/(student)/layout.tsx` — Student Layout

```tsx
'use client';
import { useAuth } from '@context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarInset, SidebarProvider } from '@shared/components/ui/sidebar';
import { AppSidebar } from '@shared/components/layout/AppSidebar';
import { DashboardHeader } from '@shared/components/layout/DashboardHeader';
import { StickyBanner } from '@shared/components/ui/sticky-banner';
import { Loader } from '@components/ui/loader';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const hasCode = window.location.search.includes('code=');
        const hasToken = window.location.hash.includes('access_token');
        if (!hasCode && !hasToken) router.replace('/login');
      } else if (!user.onboarding_completed) {
        router.replace('/onboarding');
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader size="lg" />
      </div>
    );
  }

  const getActiveTab = () => {
    if (pathname?.startsWith('/courses')) return 'courses';
    if (pathname?.startsWith('/labs')) return 'labs';
    if (pathname?.startsWith('/videos')) return 'videos';
    if (pathname?.startsWith('/certificates')) return 'certificates';
    if (pathname?.startsWith('/profile')) return 'profile';
    if (pathname?.startsWith('/community')) return 'community';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = {
      dashboard: '/dashboard',
      courses: '/courses',
      labs: '/labs',
      videos: '/videos',
      certificates: '/certificates',
      profile: '/profile',
      community: '/community',
    };
    router.push(routes[tab] || '/dashboard');
  };

  if (pathname === '/community') return <main className="min-h-screen">{children}</main>;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <div className="fixed top-0 right-0 left-0 z-100 h-11 overflow-hidden border-b border-white/10 bg-blue-600">
        <StickyBanner className="flex h-full items-center justify-center border-none p-0">
          <p className="font-display px-4 text-[11px] font-bold tracking-widest text-white uppercase">
            Announcing the GradeU Community. Connect with fellow students and share knowledge.{' '}
            <button
              onClick={() => router.push('/community')}
              className="ml-2 rounded bg-white/10 px-2 py-0.5 font-black transition-colors hover:bg-white/20"
            >
              JOIN COMMUNITY &rarr;
            </button>
          </p>
        </StickyBanner>
      </div>

      <div className="flex flex-1 pt-11">
        <SidebarProvider className="dark bg-background text-foreground w-full">
          <AppSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="top-11! z-50! h-[calc(100vh-2.75rem)]!"
          />
          <SidebarInset className="relative flex min-h-0 flex-1 flex-col">
            <div className="bg-background/95 sticky top-11 z-40 backdrop-blur-sm">
              <DashboardHeader activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
```

---

## 6. `src/app/(student)/dashboard/page.tsx` — Dashboard Page

```tsx
'use client';
import { Dashboard } from '@student/components/Dashboard/Dashboard';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const handleTabChange = (tab: string) => {
    if (tab.startsWith('courses/')) {
      router.push(`/${tab}`);
      return;
    }
    const routes: Record<string, string> = {
      courses: '/courses',
      labs: '/labs',
      videos: '/videos',
      certificates: '/certificates',
      profile: '/profile',
      community: '/community',
    };
    router.push(routes[tab] || '/dashboard');
  };

  return <Dashboard onTabChange={handleTabChange} />;
}
```

---

## 7. `src/shared/context/AuthContext.tsx` — Auth Context

```tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@services/authService';
import type { User } from '@types';
import { supabase } from '@lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (role?: 'student') => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Watchdog: ensure we never stay stuck in loading state
    const watchdog = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 8000);

    async function initializeAuth() {
      try {
        const hasAuthHash = window.location.hash?.includes('access_token');
        if (hasAuthHash) await new Promise((resolve) => setTimeout(resolve, 100));

        const { data: { session }, error } = await supabase.auth.getSession();

        if (hasAuthHash || window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState({}, '', window.location.pathname);
        }

        if (error) localStorage.removeItem('gradeUUser');

        if (session) {
          const syncedUser = await authService.handleAuthStateChange(session) as AuthContextValue['user'];
          if (mounted && syncedUser && syncedUser.role !== ('admin' as any)) {
            setUser(syncedUser);
          } else if (mounted && !syncedUser) {
            await authService.logout();
            setUser(null);
          }
        } else {
          localStorage.removeItem('gradeUUser');
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(watchdog);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        if (session) {
          try {
            const syncedUser = await authService.handleAuthStateChange(session) as AuthContextValue['user'];
            if (syncedUser && syncedUser.role !== ('admin' as any)) {
              setUser((prevUser) => {
                const isSameUser = prevUser?.id === syncedUser.id;
                if (isSameUser && prevUser?.onboarding_completed && !syncedUser.onboarding_completed) {
                  return prevUser;
                }
                return syncedUser;
              });
            }
            setLoading(false);
          } catch (error: any) {
            if (event !== 'TOKEN_REFRESHED' && event !== 'USER_UPDATED') {
              await authService.logout();
              setUser(null);
            }
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (role: 'student' = 'student') => {
    await authService.loginWithGoogle(role);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('gradeUUser');
    await authService.logout();
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('gradeUUser', JSON.stringify(updatedUser));
    }
  };

  const isStudent = () => user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateUser, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (undefined === context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
```

---

## 8. `src/features/student/components/Auth/LoginForm.tsx` — Login Form

```tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Field, FieldGroup } from '@components/ui/field';
import { ButtonLoader } from '@components/ui/loader';

export const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('error_description') || params.get('error') || '';
  });
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    if (error) window.history.replaceState({}, document.title, window.location.pathname);
  }, [error]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await loginWithGoogle('student');
    } catch {
      setError('Google login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="dark flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="group mb-4 flex flex-col items-center gap-4 self-center font-medium">
          <div className="flex size-20 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-105">
            <img src="/logo.svg" alt="GradeU" className="size-20" />
          </div>
          <div className="font-sans text-4xl font-black tracking-tighter text-white uppercase">
            Grade<span className="text-brand-400">U</span>
          </div>
        </Link>

        <Card className="border-zinc-800/50 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
            <CardDescription className="text-zinc-400">Login with your Google account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-center font-mono text-xs tracking-widest text-red-500 uppercase">{error}</p>
              </div>
            )}
            <FieldGroup className="gap-6">
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  className="hover:bg-brand-400 hover:border-brand-400 text-md h-12 w-full border-zinc-800 bg-zinc-950 font-bold text-white transition-all duration-300 hover:text-black"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <ButtonLoader />
                      <span>Initializing...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="mr-2 size-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <p className="px-6 text-center text-xs text-zinc-500">
          By clicking continue, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link> and{' '}
          <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
};
```

---

## 9. `src/features/student/components/Landing/LandingPage.tsx` — Landing Page

```tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Navbar, NavBody, NavItems, MobileNav, NavbarLogo,
  NavbarButton, MobileNavHeader, MobileNavToggle, MobileNavMenu,
} from '@components/ui/resizable-navbar';
import { StickyBanner } from '@components/ui/sticky-banner';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingFooter } from './LandingFooter';
import LandingTestimonials from './LandingTestimonials';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleGetStarted = () => {
    router.push(user ? '/dashboard' : '/login');
  };

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 640) setMobileOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="selection:bg-brand-400/30 min-h-screen bg-black font-sans text-zinc-100">
      <StickyBanner className="border-b border-zinc-800 bg-zinc-900">
        <p className="px-4 text-center text-sm font-medium tracking-wide text-zinc-300">
          Join the GradeU Community.{' '}
          <button onClick={() => router.push('/community')} className="text-brand-400 ml-2 font-bold hover:underline">
            Join Community &rarr;
          </button>
        </p>
      </StickyBanner>

      <Navbar>
        <NavBody>
          <NavbarLogo onClickAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <NavItems
            items={[
              { name: 'Features', link: '#features', onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) },
              { name: 'Reviews', link: '#testimonials', onClick: () => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) },
            ]}
          />
          <NavbarButton variant="primary" onClickAction={handleGetStarted}>
            {user ? 'Go to Dashboard' : 'Get Started'}
          </NavbarButton>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo onClickAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <MobileNavToggle isOpen={mobileOpen} onClickAction={() => setMobileOpen(!mobileOpen)} />
          </MobileNavHeader>
          <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
            <button onClick={() => { setMobileOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Features
            </button>
            <button onClick={() => { setMobileOpen(false); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Reviews
            </button>
            <NavbarButton onClickAction={() => { setMobileOpen(false); handleGetStarted(); }} variant="primary" className="w-full">
              {user ? 'Dashboard' : 'Get Started'}
            </NavbarButton>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <LandingHero />
      <LandingFeatures />
      <div id="testimonials"><LandingTestimonials /></div>
      <footer className="border-t border-zinc-900 bg-black"><LandingFooter /></footer>
    </div>
  );
};
```

---

## 10. `src/features/student/components/Dashboard/Dashboard.tsx` — Dashboard Component

```tsx
import React, { useEffect, useState } from 'react';
import { Shield, Award, Play, ChevronRight, Terminal, BookOpen, GraduationCap, Zap, Clock } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabase';
import { studentService, StudentStats, RecentActivity, ActiveOperation } from '@services/studentService';
import { labApiService, LabStats } from '@services/labApiService';
import { labs } from '@data/labs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@shared/components/ui/progress';
import { cn } from '@lib/utils';
import { Skeleton } from '@components/ui/skeleton';
import { CertificateModal } from '../Certificates/CertificateModal';

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StudentStats>({ coursesCompleted: 0, certificatesEarned: 0, liveLabsCompleted: 0, studyTime: '0 hours' });
  const [labStats, setLabStats] = useState<LabStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [activeOperation, setActiveOperation] = useState<ActiveOperation | null>(null);
  const [viewCertificate, setViewCertificate] = useState<{ isOpen: boolean; courseName: string; date: Date } | null>(null);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const overviewData = await studentService.getFullDashboardData(user.id);
      setStatsData(overviewData.stats);
      setActivities(overviewData.activities);
      setActiveOperation(overviewData.activeOperation);
      setLabStats(overviewData.labStats || await labApiService.getLabStats().catch(() => ({ totalLabs: labs.length, completedLabs: 0, completionPercentage: 0, completedLabIds: [] })));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (!user?.id) return;

    const channel = supabase
      .channel('student-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'module_progress', filter: `student_id=eq.${user.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates', filter: `student_id=eq.${user.id}` }, loadData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Courses Completed', icon: BookOpen, value: statsData.coursesCompleted, sub: 'Across all security tracks' },
          { title: 'Labs Finished', icon: Terminal, value: labStats ? `${labStats.completedLabs}/${labStats.totalLabs}` : `${statsData.liveLabsCompleted}/6`, sub: 'Hands-on hacking sessions' },
          { title: 'Certificates', icon: GraduationCap, value: statsData.certificatesEarned, sub: 'Professional level validations' },
          { title: 'Total Study Time', icon: Clock, value: statsData.studyTime, sub: 'Spent in training environment' },
        ].map(({ title, icon: Icon, value, sub }) => (
          <Card key={title} className="border-border/50 hover:border-border shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
              <p className="text-muted-foreground text-xs">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Course + Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="border-primary/20 bg-primary/5 hover:border-primary/40 col-span-full shadow-sm lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
              </span>
              Current Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : activeOperation ? (
              <>
                <div>
                  <h3 className="mb-1 text-xl font-bold">{activeOperation.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    Currently on: <span className="text-foreground font-semibold">{activeOperation.currentModuleTitle}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Course Completion</span>
                    <span className="text-primary font-bold">{activeOperation.progress}%</span>
                  </div>
                  <Progress value={activeOperation.progress} className="h-2" />
                </div>
                <div className="flex gap-4">
                  {activeOperation.progress >= 100 ? (
                    <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                      onClick={() => setViewCertificate({ isOpen: true, courseName: activeOperation.title, date: new Date() })}>
                      <Award className="mr-2 h-4 w-4" /> Download Certificate
                    </Button>
                  ) : (
                    <Button className="flex-1" onClick={() => onTabChange?.(`courses/${activeOperation.courseId}`)}>
                      <Play className="mr-2 h-4 w-4" /> Resume {activeOperation.title}
                    </Button>
                  )}
                  <Button variant="outline" size="icon" onClick={() => onTabChange?.('labs')}>
                    <Terminal className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-muted-foreground mb-4">No active courses detected.</p>
                <Button onClick={() => onTabChange?.('courses')}>Browse Courses</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 col-span-full shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest training activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="mt-2 h-2 w-2 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <div key={index}
                    className="group hover:bg-muted/30 -m-2 flex cursor-pointer items-start gap-4 rounded-lg p-2 transition-colors"
                    onClick={() => activity.courseId && onTabChange?.(`courses/${activity.courseId}`)}>
                    <div className={cn('mt-1 h-2 w-2 rounded-full', activity.type === 'completion' ? 'bg-primary' : 'bg-muted-foreground/30')} />
                    <div className="flex-1 space-y-1">
                      <p className="group-hover:text-primary text-sm leading-none font-medium">{activity.action}</p>
                      <p className="text-muted-foreground text-xs">
                        {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }) : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground py-4 text-center text-sm">No recent activity.</p>
              )}
            </div>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary mt-6 w-full text-xs"
              onClick={() => onTabChange?.('profile')}>
              View All History <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Explore Courses', icon: BookOpen, tab: 'courses' },
            { label: 'Download Certificates', icon: Award, tab: 'certificates' },
            { label: 'Academic Labs', icon: Terminal, tab: 'labs' },
          ].map(({ label, icon: Icon, tab }) => (
            <Button key={tab} variant="outline"
              className="hover:bg-primary/5 hover:text-primary hover:border-primary/30 justify-between transition-all"
              onClick={() => onTabChange?.(tab)}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>
          ))}
        </CardContent>
      </Card>

      {viewCertificate && (
        <CertificateModal
          isOpen={viewCertificate.isOpen}
          onClose={() => setViewCertificate(null)}
          courseName={viewCertificate.courseName}
          studentName={user?.name || 'Student'}
          completionDate={viewCertificate.date}
          isVU={user?.email?.endsWith('vupune.ac.in')}
          facultyName={user?.faculty}
        />
      )}
    </div>
  );
};
```

---

## 11. `src/features/student/components/Courses/CourseList.tsx` — Course List

```tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Clock, GraduationCap, ChevronRight } from 'lucide-react';
import { courseService } from '@services/courseService';
import type { Course } from '@types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';
import { Loader } from '@components/ui/loader';

interface CourseListProps {
  onCourseSelect: (courseId: string) => void;
}

export const CourseList: React.FC<CourseListProps> = ({ onCourseSelect }) => {
  const [dynamicCourses, setDynamicCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const courses = await courseService.getAllCourses();
      setDynamicCourses(courses);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Intermediate': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Advanced': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const courses = dynamicCourses.map((c) => ({
    id: c.id,
    slug: c.slug || c.id,
    title: c.title,
    description: c.description || 'No description available.',
    difficulty: (c.difficulty ? c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1) : 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced',
    duration: c.estimated_hours ? `${c.estimated_hours} hours` : 'Self-paced',
    skills: c.category ? [c.category] : ['Cybersecurity'],
  }));

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Training Courses</h1>
          <p className="text-muted-foreground">AI-generated specialized training missions. Choose a course to begin.</p>
        </div>
        <div className="bg-card border-border/50 flex items-center gap-2 rounded-lg border px-4 py-2">
          {loading ? <Loader size="sm" /> : <GraduationCap className="text-primary h-5 w-5" />}
          <span className="text-sm font-medium">{courses.length} Available Missions</span>
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} onClick={() => onCourseSelect(course.slug)}
              className="group border-border/50 hover:border-primary/30 hover:shadow-primary/5 relative cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="group-hover:text-primary text-xl transition-colors">{course.title}</CardTitle>
                <CardDescription className="mt-2 line-clamp-2 leading-relaxed">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-wrap gap-3">
                  <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase', getDifficultyVariant(course.difficulty))}>
                    {course.difficulty}
                  </span>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{course.duration}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {course.skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="bg-primary/10 text-primary border-primary/20 rounded-lg border px-2.5 py-1 text-[10px] font-bold">{skill}</span>
                  ))}
                </div>
                <div className="border-border/50 mt-6 flex items-center justify-between border-t pt-4">
                  <span className="text-primary text-sm font-black tracking-widest uppercase group-hover:underline">Launch Mission</span>
                  <ChevronRight className="text-primary h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
      )}
    </div>
  );
};
```

---

## 12. `src/features/student/components/Courses/CourseDetail.tsx` — Course Detail

```tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, CheckCircle, Clock, FileText, Award, Terminal, Lock, BookOpen, Shield } from 'lucide-react';
import { ModuleViewer } from './ModuleViewer';
import type { Module } from '@types';
import { useAuth } from '@context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Progress } from '@shared/components/ui/progress';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';
import { useCourseStore } from '@shared/stores/useCourseStore';

interface CourseDetailProps {
  courseId: string;
  onBack: () => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onBack }) => {
  const { course, loading, fetchCourseProgress, reset } = useCourseStore();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchCourseProgress(courseId, user?.id, true);
    return () => reset();
  }, [courseId, user?.id]);

  if (selectedModuleId && course) {
    return (
      <ModuleViewer
        courseId={courseId}
        moduleId={selectedModuleId}
        course={course}
        onBack={() => setSelectedModuleId(null)}
        onNavigateToModule={(id: string) => setSelectedModuleId(id)}
        onModuleStatusChange={() => fetchCourseProgress(courseId, user?.id, false)}
      />
    );
  }

  if (loading && !course) {
    return (
      <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
        <Skeleton className="h-8 w-40" />
        <Card className="border-border/50"><CardContent className="p-8"><div className="grid grid-cols-1 gap-8 lg:grid-cols-3"><div className="space-y-4 lg:col-span-2"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-20 w-full" /></div><Skeleton className="h-40 w-full rounded-lg" /></div></CardContent></Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Back to Courses</Button>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Terminal className="text-destructive mb-4 h-12 w-12" />
            <h2 className="mb-2 text-xl font-semibold">Course Not Found</h2>
            <Button onClick={onBack}>Return to Courses</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedModules = (course.modules || []).filter((m: Module) => m.completed).length;
  const totalModules = (course.modules || []).length;
  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground -ml-2 w-fit">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
      </Button>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 border-primary/20 rounded-lg border p-2">
                  <BookOpen className="text-primary h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{course.title}</h1>
              </div>
              <CardDescription className="text-base">{course.description}</CardDescription>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="text-muted-foreground flex items-center gap-2"><FileText className="text-primary h-4 w-4" /><span>{totalModules} Modules</span></div>
                <div className="text-muted-foreground flex items-center gap-2"><Clock className="text-primary h-4 w-4" /><span>{course.estimated_hours ? `${course.estimated_hours} Hours` : `~${totalModules * 2} Hours`}</span></div>
                <div className="text-muted-foreground flex items-center gap-2"><Award className="text-primary h-4 w-4" /><span>Certificate</span></div>
              </div>
            </div>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">Course Progress</h3>
                <div className="mb-4 text-center">
                  <div className="text-primary text-4xl font-bold">{progressPercentage}%</div>
                  <div className="text-muted-foreground text-sm">Complete</div>
                </div>
                <Progress value={progressPercentage} className="mb-4 h-2" />
                <div className="text-muted-foreground text-center text-sm">{completedModules} / {totalModules} modules completed</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="border-border/50 border-b">
          <CardTitle className="flex items-center gap-2"><Terminal className="text-primary h-5 w-5" />Training Modules</CardTitle>
        </CardHeader>
        <div className="divide-border/50 divide-y">
          {(course.modules || []).map((module: Module, index: number, array: Module[]) => {
            const previousModule = index > 0 ? array[index - 1] : null;
            const isPreviousInitialAssessment = index - 1 === 0 || previousModule?.type === 'initial_assessment';
            const isModuleUnlocked = user?.role === 'admin' || index === 0 ||
              (previousModule?.completed && (isPreviousInitialAssessment || previousModule.testScore === undefined || previousModule.testScore >= 70));

            return (
              <div key={module.id || index}
                className={cn('p-6 transition-colors', isModuleUnlocked && 'hover:bg-muted/50 group cursor-pointer')}
                onClick={() => isModuleUnlocked && setSelectedModuleId(module.id)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="mt-1 shrink-0">
                      {module.completed ? (
                        <div className="bg-primary/10 border-primary/20 flex h-8 w-8 items-center justify-center rounded-full border"><CheckCircle className="text-primary h-5 w-5" /></div>
                      ) : !isModuleUnlocked ? (
                        <div className="bg-muted border-border flex h-8 w-8 items-center justify-center rounded-full border"><Lock className="text-muted-foreground h-4 w-4" /></div>
                      ) : (
                        <div className="border-border group-hover:border-primary/50 flex h-8 w-8 items-center justify-center rounded-full border transition-colors">
                          <span className="text-muted-foreground group-hover:text-primary text-sm font-bold">{String(index + 1).padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={cn('mb-1 text-lg font-medium transition-colors', isModuleUnlocked ? 'group-hover:text-primary' : 'text-muted-foreground')}>{module.title}</h3>
                      <p className={cn('mb-3 text-sm', isModuleUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/50')}>{module.description}</p>
                      {module.testScore && (
                        <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                          Test Score: {module.testScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant={module.completed ? 'outline' : 'default'} disabled={!isModuleUnlocked}
                    className={cn(!isModuleUnlocked && 'opacity-50')}
                    onClick={(e) => { e.stopPropagation(); if (isModuleUnlocked) setSelectedModuleId(module.id); }}>
                    {isModuleUnlocked ? <><Play className="mr-2 h-4 w-4" />{module.completed ? 'Review' : 'Start'}</> : <><Lock className="mr-2 h-4 w-4" />Locked</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
```

---

## 13. `src/features/student/components/Labs/LabsList.tsx` — Labs List

```tsx
import React from 'react';
import { FlaskRound as Flask, Clock, CheckCircle, ArrowRight, Terminal, Lock, BookOpen, Users, Activity } from 'lucide-react';
import { labs } from '@data/labs';
import { useAuth } from '@context/AuthContext';
import { labApiService, LabStats } from '@services/labApiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Progress } from '@shared/components/ui/progress';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';

interface LabsListProps {
  onLabSelect: (labId: string) => void;
}

export const LabsList: React.FC<LabsListProps> = ({ onLabSelect }) => {
  const { user } = useAuth();
  const [completedLabs, setCompletedLabs] = React.useState<string[]>([]);
  const [labStats, setLabStats] = React.useState<LabStats | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>('Web Security');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadLabData = async () => {
      try {
        setLoading(true);
        const stats = await labApiService.getLabStats();
        setLabStats(stats);
        setCompletedLabs(stats.completedLabIds);
      } catch (error) {
        console.error('Error fetching lab stats:', error);
        setCompletedLabs([]);
      } finally {
        setLoading(false);
      }
    };
    loadLabData();
  }, []);

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'advanced': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const categories = [...new Set(labs.map((l) => l.category))];
  const filteredLabs = labs.filter((lab) => lab.category === activeCategory);
  const completionPercentage = Math.round(labStats?.completionPercentage ?? (labs.length > 0 ? (completedLabs.length / labs.length) * 100 : 0));

  return (
    <div className="animate-in fade-in flex flex-col gap-6 p-4 duration-500 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Virtual Labs</h1>
          <p className="text-muted-foreground">Hands-on security simulations and practical exercises</p>
        </div>
        <div className="bg-card border-border/50 flex items-center gap-2 rounded-lg border px-4 py-2">
          <Flask className="text-primary h-5 w-5" />
          <span className="text-sm font-medium">{labStats?.completedLabs ?? completedLabs.length} / {labStats?.totalLabs ?? labs.length} Completed</span>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-primary text-sm font-bold">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-muted-foreground mt-2 text-xs">Complete all labs to earn your certification</p>
        </CardContent>
      </Card>

      {categories.length > 1 && (
        <div className="bg-card border-border/50 flex flex-wrap gap-2 rounded-lg border p-1">
          {categories.map((category) => (
            <button key={category} onClick={() => setActiveCategory(category)}
              className={cn('rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
                activeCategory === category ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
              {category}
              <span className={cn('ml-2 rounded-full px-1.5 py-0.5 text-xs', activeCategory === category ? 'bg-primary-foreground/20' : 'bg-muted')}>
                {labs.filter((l) => l.category === category).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Card key={i} className="border-border/50"><CardHeader className="space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /></CardHeader></Card>)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredLabs.map((lab) => {
            const isCompleted = completedLabs.includes(lab.id);
            const isLocked = (lab.difficulty === 'advanced' || lab.difficulty === 'pro') && (user as any)?.subscription_tier !== 'pro';

            return (
              <Card key={lab.id}
                className={cn('group cursor-pointer transition-all duration-200',
                  isLocked ? 'border-border/30 opacity-60' : 'border-border/50 hover:border-primary/30 hover:shadow-lg',
                  isCompleted && 'border-primary/30 bg-primary/5')}
                onClick={() => !isLocked && onLabSelect(lab.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-center gap-3">
                      <div className={cn('rounded-lg border p-2', isLocked ? 'bg-muted border-border' : 'bg-primary/10 border-primary/20')}>
                        {isLocked ? <Lock className="text-muted-foreground h-5 w-5" /> : <Terminal className="text-primary h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className={cn('line-clamp-1 text-lg transition-colors', !isLocked && 'group-hover:text-primary')}>{lab.title}</CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase', getDifficultyVariant(lab.difficulty))}>{lab.difficulty}</span>
                          {isCompleted && <span className="text-primary flex items-center gap-1 text-[10px] font-semibold"><CheckCircle className="h-3 w-3" /> Completed</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4 line-clamp-2">{lab.description}</CardDescription>
                  <div className="text-muted-foreground mb-4 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span>{lab.estimatedTime}</span></div>
                    <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /><span>Solo Mission</span></div>
                  </div>
                  <Button variant={isCompleted ? 'outline' : 'default'} className="w-full" disabled={isLocked}>
                    {isLocked ? <><Lock className="mr-2 h-4 w-4" />Unlock with Pro</> :
                     isCompleted ? <><BookOpen className="mr-2 h-4 w-4" />Review Lab</> :
                     <><Terminal className="mr-2 h-4 w-4" />Start Lab<ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

---

## 14. `src/shared/stores/useCourseStore.ts` — Course Store (Zustand)

```tsx
import { create } from 'zustand';
import { courseService } from '../services/courseService';
import type { Module, Course } from '../types/types';

interface ProgressRow {
  module_id?: string;
  completed?: boolean | null;
  quiz_score?: number | null;
  completedTopics?: string[];
}

interface CourseState {
  course: Course | null;
  modules: Module[];
  loading: boolean;
  error: string | null;
  setCourse: (course: Course | null) => void;
  fetchCourseProgress: (courseId: string, userId?: string, lazy?: boolean) => Promise<void>;
  fetchModuleContent: (moduleId: string) => Promise<void>;
  updateModuleLocal: (moduleId: string, updates: Partial<Module>) => void;
  completeModule: (userId: string, courseId: string, moduleId: string, score?: number, topics?: string[]) => Promise<void>;
  reset: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  course: null,
  modules: [],
  loading: false,
  error: null,

  setCourse: (course) => set({ course, modules: course?.modules || [] }),

  fetchCourseProgress: async (courseId, userId, lazy = false) => {
    set({ loading: true, error: null });
    try {
      const data = await courseService.getCourseById(courseId, lazy);
      if (!data) { set({ error: 'Course not found', loading: false }); return; }

      let normalizedModules = data.course_modules ?? data.modules ?? [];

      if (userId) {
        const progress = await courseService.getCourseProgress(courseId) as ProgressRow[] | null;
        const moduleProgress = (progress || []).reduce((acc: Record<string, ProgressRow>, p: ProgressRow) => {
          if (p.module_id) acc[p.module_id] = p;
          return acc;
        }, {});

        normalizedModules = (data.modules || []).map((m: Module) => {
          const prog = moduleProgress[m.id];
          return { ...m, completed: !!prog?.completed, testScore: prog?.quiz_score ?? m.testScore ?? undefined, completedTopics: prog?.completedTopics || [] };
        });
      }

      set({ course: { ...data, modules: normalizedModules }, modules: normalizedModules, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchModuleContent: async (moduleId: string) => {
    const { modules, updateModuleLocal } = get();
    const existing = modules.find((m) => m.id === moduleId);
    if (existing && !existing.content) {
      try {
        const contentData = await courseService.getModuleContent(moduleId);
        if (contentData) updateModuleLocal(moduleId, { content: contentData.content, topics: contentData.topics });
      } catch (err) {
        console.error('Failed to fetch module content:', err);
      }
    }
  },

  updateModuleLocal: (moduleId, updates) => {
    const { modules, course } = get();
    const newModules = modules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m));
    set({ modules: newModules, course: course ? { ...course, modules: newModules } : null });
  },

  completeModule: async (userId, courseId, moduleId, score, topics) => {
    get().updateModuleLocal(moduleId, { completed: true, testScore: score, completedTopics: topics });
    try {
      await courseService.updateProgress(userId, moduleId, true, score, courseId, topics);
    } catch (err) {
      console.error('Failed to sync progress to backend:', err);
    }
  },

  reset: () => set({ course: null, modules: [], loading: false, error: null }),
}));
```

---

## 15. `src/shared/types/types.ts` — Shared Types

```tsx
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'teacher';
  avatar_url?: string;
  created_at?: string;
  certificates?: string[];
  phone_number?: string;
  faculty?: string;
  department?: string;
  contact_email?: string;
  email_type?: 'vu' | 'personal';
  onboarding_completed?: boolean;
}

export interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  modules: Module[];
  teacher_name?: string;
  progress?: number;
  course_modules?: Module[];
  is_published?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  enrollment_count?: number;
  rating?: number;
  estimated_hours?: number;
  created_at?: string;
  teacher_id?: string;
  category?: string;
  module_count?: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  course_id: string;
  completed?: boolean;
  testScore?: number;
  videoUrl?: string;
  labUrl?: string;
  order?: number;
  topics?: { title: string; content: string }[];
  completedTopics?: string[];
  module_order?: number;
  questions?: Question[];
  quiz?: any[];
  type?: 'lecture' | 'quiz' | 'initial_assessment' | 'final_assessment';
}

export interface Certificate {
  id: string;
  user_id: string;
  course_name: string;
  issued_date: string;
  certificate_url: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}
```

---

## 16. `src/shared/components/layout/AppSidebar.tsx` — App Sidebar

```tsx
import * as React from 'react';
import { LayoutDashboard, BookOpen, Terminal, Video, User, LogOut, ChevronRight, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@context/AuthContext';
import { BugReportModal } from '@student/components/Support/BugReportModal';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent,
} from '@shared/components/ui/sidebar';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange, ...props }: AppSidebarProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isBugModalOpen, setIsBugModalOpen] = React.useState(false);

  const navMain = [
    { title: 'Navigation', items: [
      { title: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
      { title: 'Courses', id: 'courses', icon: BookOpen },
      { title: 'Practice Labs', id: 'labs', icon: Terminal },
    ]},
    { title: 'Community', items: [
      { title: 'Lessons', id: 'videos', icon: Video },
    ]},
    { title: 'Account', items: [
      { title: 'Profile', id: 'profile', icon: User },
    ]},
  ];

  return (
    <Sidebar collapsible="icon" {...props} className="border-sidebar-border/50 border-r">
      <SidebarHeader className="border-sidebar-border/50 h-20 border-b" />
      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-muted-foreground/50 text-xs font-semibold tracking-widest uppercase">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton tooltip={item.title} isActive={activeTab === item.id}
                      onClick={() => onTabChange(item.id)}
                      className={activeTab === item.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'}>
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                      {activeTab === item.id && <ChevronRight className="ml-auto size-3 opacity-50" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsBugModalOpen(true)}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Bug className="size-4 shrink-0" />
                  <span>Report a Bug</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => { try { await logout(); router.push('/'); } catch (error) { console.error('Logout failed:', error); } }}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="size-4 shrink-0" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
      <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
    </Sidebar>
  );
}
```

---

*End of GradeU Frontend Code Reference*
