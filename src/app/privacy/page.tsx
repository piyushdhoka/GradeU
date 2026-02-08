import React from 'react';
import { Metadata } from 'next';
import { Navbar, NavBody, NavbarLogo, NavbarButton } from '@components/ui/resizable-navbar';
import { LandingFooter } from '@student/components/Landing/LandingFooter';
import Link from 'next/link';
import { siteConfig } from '@lib/metaConfig';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the GradeU privacy policy to understand how we collect, use, and protect your personal information.',
  alternates: {
    canonical: `${siteConfig.url}/privacy`,
  },
};

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
              includes:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">Account Information:</strong> Name, email address,
                and profile details you provide when creating an account.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> Information about how you
                interact with our platform, including courses accessed, lab activity, assessment
                results, and time spent on the platform.
              </li>
              <li>
                <strong className="text-white">Device Information:</strong> Browser type, operating
                system, IP address, and device identifiers collected automatically when you visit
                our website.
              </li>
              <li>
                <strong className="text-white">Communication Preferences:</strong> Your notification
                and email preferences.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">2. How We Use Information</h2>
            <p>
              We use the information we collect to maintain and improve our services, develop new
              educational tools, and protect GradeU and our users. Specifically, we use your data
              to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Provide, personalize, and improve your learning experience.</li>
              <li>Track your course progress and issue certificates.</li>
              <li>Communicate with you about your account, updates, and new features.</li>
              <li>Analyze usage patterns to enhance platform performance and content quality.</li>
              <li>Prevent fraud and ensure the security of our platform.</li>
            </ul>
            <p>We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">
              3. Cookies and Tracking Technologies
            </h2>
            <p>
              GradeU uses cookies and similar tracking technologies to enhance your browsing
              experience. Cookies are small data files stored on your device that help us remember
              your preferences and understand how you use our platform.
            </p>
            <p>We use the following types of cookies:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">Essential Cookies:</strong> Necessary for the
                platform to function, such as authentication and session management.
              </li>
              <li>
                <strong className="text-white">Analytics Cookies:</strong> Help us understand how
                visitors interact with our website, enabling us to improve our services.
              </li>
              <li>
                <strong className="text-white">Advertising Cookies:</strong> Used by third-party
                advertising partners (including Google AdSense) to serve relevant ads based on your
                browsing behavior.
              </li>
            </ul>
            <p>
              You can manage your cookie preferences through your browser settings. Please note that
              disabling certain cookies may affect the functionality of the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">4. Third-Party Advertising</h2>
            <p>
              We use third-party advertising companies, including Google AdSense, to serve ads when
              you visit our website. These companies may use cookies and web beacons to collect
              non-personally identifiable information about your visits to this and other websites
              in order to provide advertisements about goods and services of interest to you.
            </p>
            <p>
              Google&apos;s use of the DoubleClick advertising cookie enables it and its partners to
              serve ads based on your visits to GradeU and other sites on the internet. You may opt
              out of the use of the DoubleClick cookie for interest-based advertising by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                Google Ads Settings
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">5. Data Sharing</h2>
            <p>We may share your information in the following limited circumstances:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">Service Providers:</strong> With trusted third-party
                service providers who assist us in operating our platform (e.g., hosting, analytics,
                email delivery).
              </li>
              <li>
                <strong className="text-white">Legal Requirements:</strong> When required by law, or
                to protect the rights, property, or safety of GradeU, our users, or others.
              </li>
              <li>
                <strong className="text-white">With Your Consent:</strong> When you explicitly
                consent to the sharing of your information.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">6. Data Security</h2>
            <p>
              We work hard to protect GradeU and our users from unauthorized access to or
              unauthorized alteration, disclosure, or destruction of information we hold. We employ
              industry-standard security measures including encryption, secure data storage, and
              regular security audits to protect your data.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed
              to provide you with our services. If you wish to delete your account, we will delete
              your personal information within a reasonable timeframe, except where we are required
              to retain it by law.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">8. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information at any time
              through your account settings or by contacting our support team. Depending on your
              location, you may also have the right to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Request a copy of the personal data we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Object to or restrict the processing of your data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Withdraw consent at any time where processing is based on consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">9. Children&apos;s Privacy</h2>
            <p>
              GradeU is not directed at children under the age of 13. We do not knowingly collect
              personal information from children under 13. If we become aware that a child under 13
              has provided us with personal information, we will take steps to delete such
              information promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes by posting the new policy on this page and updating the &quot;Last
              updated&quot; date. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
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
