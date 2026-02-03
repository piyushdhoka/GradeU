'use client';
import { useAuth } from '@context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarInset, SidebarProvider } from '@shared/components/ui/sidebar';
import { AppSidebar } from '@shared/components/layout/AppSidebar';
import { DashboardHeader } from '@shared/components/layout/DashboardHeader';
import { StickyBanner } from '@shared/components/ui/sticky-banner';
import { usePathname } from 'next/navigation';
import { Loader } from '@components/ui/loader';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect after loading is complete
    if (!loading) {
      if (!user) {
        // Check if there's auth data in URL (OAuth callback in progress)
        const hasCode = window.location.search.includes('code=');
        const hasToken = window.location.hash.includes('access_token');

        if (!hasCode && !hasToken) {
          router.replace('/login');
        }
      } else if (!user.onboarding_completed) {
        // Redirect to onboarding if not completed
        router.replace('/onboarding');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F1115]">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Still show loading if no user yet (might be processing OAuth)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F1115]">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-muted-foreground mt-4">Authenticating...</p>
        </div>
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
    if (pathname?.startsWith('/proctor-demo')) return 'proctor-demo';
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
      'proctor-demo': '/proctor-demo',
    };
    const route = routes[tab] || '/dashboard';
    router.push(route);
  };

  if (pathname === '/community') {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* 1. Header Banner - Fixed Height 44px (11) */}
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

      {/* 2. Main Layout Container - Shifted down by Banner (44px) */}
      <div className="flex flex-1 pt-11">
        <SidebarProvider className="dark bg-background text-foreground w-full">
          <AppSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="top-11! z-50! h-[calc(100vh-2.75rem)]!"
          />
          <SidebarInset className="relative flex min-h-0 flex-1 flex-col">
            {/* Dashboard Header - Sticky within its container, sitting below banner */}
            <div className="bg-background/95 sticky top-11 z-40 backdrop-blur-sm">
              <DashboardHeader activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Page Content */}
            <div className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
