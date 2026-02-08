import React from 'react';
import { Metadata } from 'next';
import { Navbar, NavBody, NavbarLogo, NavbarButton } from '@components/ui/resizable-navbar';
import { LandingFooter } from '@student/components/Landing/LandingFooter';
import Link from 'next/link';
import { siteConfig } from '@lib/metaConfig';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'Read the GradeU disclaimer regarding the use of our educational content, third-party links, and advertising on our platform.',
  alternates: {
    canonical: `${siteConfig.url}/disclaimer`,
  },
};

export default function DisclaimerPage() {
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
        <h1 className="mb-8 text-4xl font-black tracking-tighter">Disclaimer</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
          <p>Last updated: February 07, 2026</p>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">1. General Information</h2>
            <p>
              The information provided on GradeU (&quot;the Platform&quot;) is for general
              educational and informational purposes only. All content on the Platform is provided
              in good faith; however, we make no representation or warranty of any kind, express or
              implied, regarding the accuracy, adequacy, validity, reliability, availability, or
              completeness of any information on the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">2. Educational Content</h2>
            <p>
              The educational content, courses, labs, and assessments available on GradeU are
              designed to supplement learning and should not be considered a substitute for
              professional advice, formal education, or accredited academic programs. While we
              strive to keep our content accurate and up to date, technology and industry standards
              change rapidly and we cannot guarantee that all content reflects the latest
              developments.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">3. No Professional Advice</h2>
            <p>
              The Platform does not provide professional, legal, medical, or financial advice.
              Content should not be used as a substitute for consultation with qualified
              professionals in the relevant field. Any actions you take based on the information
              provided on GradeU are strictly at your own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">4. Third-Party Links</h2>
            <p>
              GradeU may contain links to third-party websites, services, or resources that are not
              owned or controlled by us. We have no control over, and assume no responsibility for,
              the content, privacy policies, or practices of any third-party websites or services.
              You acknowledge and agree that GradeU shall not be responsible or liable for any
              damage or loss caused by or in connection with the use of any such third-party
              content, goods, or services.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">5. Advertising Disclaimer</h2>
            <p>
              GradeU may display advertisements provided by third-party advertising networks,
              including Google AdSense. These ads may use cookies and similar technologies to serve
              ads based on your prior visits to this or other websites. The presence of
              advertisements on the Platform does not constitute an endorsement, guarantee, or
              recommendation by GradeU of the advertiser or the products or services advertised.
            </p>
            <p>
              Third-party ad networks may collect information about your browsing activity across
              websites to provide targeted advertising. You may opt out of personalized advertising
              by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                Google Ads Settings
              </a>{' '}
              or the{' '}
              <a
                href="https://optout.networkadvertising.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                Network Advertising Initiative opt-out page
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">6. Certificates</h2>
            <p>
              Certificates issued by GradeU are a recognition of course completion and assessment
              performance on our platform. They do not represent accredited academic credentials
              unless explicitly stated. The value and recognition of these certificates may vary
              depending on the employer or institution.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">7. Limitation of Liability</h2>
            <p>
              Under no circumstance shall GradeU or its affiliates be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the
              Platform or reliance on the information provided herein. This includes, but is not
              limited to, loss of data, loss of revenue, or interruption of service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">8. Changes to This Disclaimer</h2>
            <p>
              We reserve the right to update or modify this Disclaimer at any time without prior
              notice. Your continued use of the Platform after any changes constitutes your
              acceptance of the revised Disclaimer. We encourage you to review this page
              periodically to stay informed.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">9. Contact Us</h2>
            <p>
              If you have any questions about this Disclaimer, please contact us at{' '}
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
