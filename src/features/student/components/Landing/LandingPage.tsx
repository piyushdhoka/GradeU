"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

// UI Components
import { SEO } from '@components/SEO/SEO';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from '@components/ui/resizable-navbar';
import { StickyBanner } from '@components/ui/sticky-banner';

// Sections
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingFooter } from './LandingFooter';
import LandingTestimonials from './LandingTestimonials';


export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = (tab?: string) => {
    if (user) {
      router.push('/dashboard');
      return;
    }
    router.push(`/login${tab ? `?tab=${tab}` : ''}`);
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // navbar mobile state
  const [mobileOpen, setMobileOpen] = useState(false);

  // close mobile menu on route change or resize
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 640) setMobileOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <SEO
        description="Empowering excellence with GradeU. Elevate your learning journey with our advanced education platform."
      />

      <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-brand-400/30">
        <StickyBanner className="bg-zinc-900 border-b border-zinc-800">
          <p className="text-sm font-medium text-zinc-300 tracking-wide text-center px-4">
            Join the GradeU Community. Connect with students and mentors.{" "}
            <button
              onClick={() => router.push('/community')}
              className="text-brand-400 font-bold hover:underline ml-2"
            >
              Join Community &rarr;
            </button>
          </p>
        </StickyBanner>

        {/* Nav */}
        <Navbar>
          {/* Desktop Navigation */}
          <NavBody>
            <NavbarLogo onClickAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <NavItems
              items={[
                {
                  name: 'Features',
                  link: '#features',
                  onClick: () => {
                    const el = document.getElementById('features');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                },
                {
                  name: 'Reviews',
                  link: '#testimonials',
                  onClick: () => {
                    const el = document.getElementById('testimonials');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                },
              ]}
            />
            <div className="flex items-center gap-3">
              <NavbarButton
                variant="secondary"
                onClickAction={() => window.open("https://t.me/GradeU_Bot", "_blank")}
                className="hidden md:flex items-center justify-center px-3"
              >
                <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="url(#paint0_linear_87_7225)" />
                  <path d="M22.9866 10.2088C23.1112 9.40332 22.3454 8.76755 21.6292 9.082L7.36482 15.3448C6.85123 15.5703 6.8888 16.3483 7.42147 16.5179L10.3631 17.4547C10.9246 17.6335 11.5325 17.541 12.0228 17.2023L18.655 12.6203C18.855 12.4821 19.073 12.7665 18.9021 12.9426L14.1281 17.8646C13.665 18.3421 13.7569 19.1512 14.314 19.5005L19.659 22.8523C20.2585 23.2282 21.0297 22.8506 21.1418 22.1261L22.9866 10.2088Z" fill="white" />
                  <defs>
                    <linearGradient id="paint0_linear_87_7225" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#37BBFE" />
                      <stop offset="1" stopColor="#007DBB" />
                    </linearGradient>
                  </defs>
                </svg>
              </NavbarButton>
              <NavbarButton variant="primary" onClickAction={() => handleGetStarted()}>
                {user ? 'Go to Dashboard' : 'Get Started'}
              </NavbarButton>
            </div>
          </NavBody>

          {/* Mobile Navigation */}
          <MobileNav>
            <MobileNavHeader>
              <NavbarLogo onClickAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <MobileNavToggle
                isOpen={mobileOpen}
                onClickAction={() => setMobileOpen(!mobileOpen)}
              />
            </MobileNavHeader>

            <MobileNavMenu
              isOpen={mobileOpen}
              onClose={() => setMobileOpen(false)}
            >
              <button
                onClick={() => {
                  setMobileOpen(false);
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-zinc-300 hover:text-brand-400 transition-colors text-sm font-medium"
              >
                Features
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  const el = document.getElementById('testimonials');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-zinc-300 hover:text-brand-400 transition-colors text-sm font-medium"
              >
                Reviews
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  window.open("https://t.me/GradeU_Bot", "_blank");
                }}
                className="text-zinc-300 hover:text-brand-400 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span>Telegram Bot</span>
                <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="url(#paint0_linear_87_7225_mobile)" />
                  <path d="M22.9866 10.2088C23.1112 9.40332 22.3454 8.76755 21.6292 9.082L7.36482 15.3448C6.85123 15.5703 6.8888 16.3483 7.42147 16.5179L10.3631 17.4547C10.9246 17.6335 11.5325 17.541 12.0228 17.2023L18.655 12.6203C18.855 12.4821 19.073 12.7665 18.9021 12.9426L14.1281 17.8646C13.665 18.3421 13.7569 19.1512 14.314 19.5005L19.659 22.8523C20.2585 23.2282 21.0297 22.8506 21.1418 22.1261L22.9866 10.2088Z" fill="white" />
                  <defs>
                    <linearGradient id="paint0_linear_87_7225_mobile" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#37BBFE" />
                      <stop offset="1" stopColor="#007DBB" />
                    </linearGradient>
                  </defs>
                </svg>
              </button>
              <div className="flex w-full flex-col gap-3 pt-4 border-t border-zinc-800">
                <NavbarButton
                  onClickAction={() => { setMobileOpen(false); handleGetStarted(); }}
                  variant="primary"
                  className="w-full"
                >
                  {user ? 'Dashboard' : 'Get Started'}
                </NavbarButton>
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>

        <LandingHero />

        <LandingFeatures />

        {/* Testimonials - Self Contained */}
        <div id="testimonials">
          <LandingTestimonials />
        </div>

        {/* Footer */}
        {/* Footer Area */}
        <footer className="bg-black border-t border-zinc-900">
          <LandingFooter />
        </footer>

      </div>
    </>
  );
};
