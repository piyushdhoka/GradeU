import React from 'react';
import { Metadata } from 'next';
import { Navbar, NavBody, NavbarLogo, NavbarButton } from '@components/ui/resizable-navbar';
import { LandingFooter } from '@student/components/Landing/LandingFooter';
import Link from 'next/link';
import { siteConfig } from '@lib/metaConfig';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'Review the GradeU terms and conditions governing the use of our educational platform, services, and content.',
  alternates: {
    canonical: `${siteConfig.url}/terms`,
  },
};

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
              By accessing or using GradeU (&quot;the Platform&quot;), you agree to be bound by
              these Terms and Conditions and all applicable laws and regulations. If you do not
              agree with any part of these terms, you must not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">2. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
              You must provide accurate and complete information when creating your account and keep
              your account information up to date.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">3. Use of the Platform</h2>
            <p>
              GradeU grants you a limited, non-exclusive, non-transferable license to access and use
              the Platform for personal, non-commercial educational purposes. You agree not to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Reproduce, distribute, or publicly display any content from the Platform without
                prior written consent.
              </li>
              <li>Use automated tools, bots, or scrapers to access the Platform.</li>
              <li>Share your account credentials with others.</li>
              <li>Attempt to circumvent any proctoring or assessment security measures.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">4. Intellectual Property</h2>
            <p>
              The content, organization, graphics, design, course materials, and other matters
              related to GradeU are protected under applicable copyrights and trademarks. All
              intellectual property rights in the Platform and its content belong to GradeU or its
              licensors and are protected by international copyright laws.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">5. User-Generated Content</h2>
            <p>
              By posting content on GradeU (including community forum posts, comments, or
              submissions), you grant GradeU a non-exclusive, worldwide, royalty-free license to
              use, display, and distribute your content in connection with the Platform. You retain
              ownership of your content but are responsible for ensuring it does not violate any
              third-party rights.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">6. Certificates</h2>
            <p>
              Certificates issued by GradeU acknowledge course completion and assessment performance
              on our platform. GradeU reserves the right to revoke certificates if it is determined
              that they were obtained through dishonest means, including cheating or identity fraud
              during proctored assessments.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">7. Prohibited Uses</h2>
            <p>
              You may not use GradeU for any illegal or unauthorized purpose. You must not attempt
              to hack, destabilize, or interfere with the delivery of our educational services. Any
              violation of these rules may result in immediate termination of your account.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">8. Disclaimer of Warranties</h2>
            <p>
              GradeU provides its services &quot;as is&quot; and &quot;as available&quot; without
              any warranties of any kind, whether express or implied, including but not limited to
              implied warranties of merchantability, fitness for a particular purpose, and
              non-infringement. We do not guarantee that the Platform will be uninterrupted,
              error-free, or secure at all times.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, GradeU shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of profits,
              data, or goodwill, arising from your use of or inability to use the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our sole discretion, with
              or without notice, for conduct that we believe violates these Terms or is harmful to
              other users, us, or third parties, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">11. Changes to Terms</h2>
            <p>
              We may update these Terms and Conditions from time to time. We will notify you of
              significant changes by posting the new terms on this page. Your continued use of the
              Platform after changes are posted constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">13. Contact Us</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us at{' '}
              <a href="mailto:smartgaurd123@gmail.com" className="text-brand-400 hover:underline">
                smartgaurd123@gmail.com
              </a>{' '}
              or visit our{' '}
              <Link href="/contact" className="text-brand-400 hover:underline">
                Contact page
              </Link>
              .
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
