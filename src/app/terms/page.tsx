import React from 'react';
import { Navbar, NavBody, NavbarLogo, NavbarButton } from '@components/ui/resizable-navbar';
import { LandingFooter } from '@student/components/Landing/LandingFooter';
import Link from 'next/link';

export default function TermsAndConditions() {
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
        <h1 className="mb-8 text-4xl font-black tracking-tighter">Terms and Conditions</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
          <p>Last updated: February 07, 2026</p>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using GradeU, you agree to be bound by these Terms and Conditions and
              all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">2. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">3. Intellectual Property</h2>
            <p>
              The content, organization, graphics, design, and other matters related to GradeU are
              protected under applicable copyrights and trademarks.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">4. Prohibited Uses</h2>
            <p>
              You may not use GradeU for any illegal or unauthorized purpose. You must not attempt
              to hack, destabilize, or interfere with the delivery of our educational services.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">5. Disclaimer</h2>
            <p>
              GradeU provides its services &quot;as is&quot; and makes no warranties, expressed or
              implied, regarding the accuracy or availability of its educational content.
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
