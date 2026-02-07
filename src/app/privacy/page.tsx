import React from 'react';
import { Navbar, NavBody, NavbarLogo, NavbarButton } from '@components/ui/resizable-navbar';
import { LandingFooter } from '@student/components/Landing/LandingFooter';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black font-sans text-zinc-100">
      <Navbar>
        <NavBody>
          <Link href="/">
            <NavbarLogo />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <NavbarButton variant="primary">Get Started</NavbarButton>
            </Link>
          </div>
        </NavBody>
      </Navbar>

      <main className="mx-auto max-w-4xl px-6 py-24">
        <h1 className="mb-8 text-4xl font-black tracking-tighter">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
          <p>Last updated: February 07, 2026</p>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">1. Information We Collect</h2>
            <p>
              At GradeU, we collect information to provide better services to all our users. This
              includes account information, usage data from our interactive labs, and communication
              preferences.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">2. How We Use Information</h2>
            <p>
              We use the information we collect to maintain and improve our services, develop new
              educational tools, and protect GradeU and our users. We do not sell your personal data
              to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">3. Data Security</h2>
            <p>
              We work hard to protect GradeU and our users from unauthorized access to or
              unauthorized alteration, disclosure, or destruction of information we hold.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">4. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information at any time
              through your account settings or by contacting our support team.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-900 bg-black">
        <LandingFooter />
      </footer>
    </div>
  );
}
