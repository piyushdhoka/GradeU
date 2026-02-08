import React from 'react';
import { Metadata } from 'next';
import { Navbar, NavBody, NavbarLogo, NavbarButton } from '@components/ui/resizable-navbar';
import { LandingFooter } from '@student/components/Landing/LandingFooter';
import Link from 'next/link';
import { siteConfig } from '@lib/metaConfig';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the GradeU team. Reach out for support, feedback, or partnership inquiries via email or our social channels.',
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
};

export default function ContactPage() {
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
        <h1 className="mb-8 text-4xl font-black tracking-tighter">Contact Us</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
          <p className="text-lg leading-relaxed">
            Have questions, feedback, or need support? We&apos;d love to hear from you. Reach out to
            us through any of the channels below and our team will get back to you as soon as
            possible.
          </p>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Email</h2>
            <p>
              For general inquiries, support requests, or feedback, you can reach us at:{' '}
              <a href="mailto:smartgaurd123@gmail.com" className="text-brand-400 hover:underline">
                smartgaurd123@gmail.com
              </a>
            </p>
            <p>We aim to respond to all emails within 24–48 business hours.</p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Social Media</h2>
            <p>
              Stay connected and follow us on our social channels for updates and announcements:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">Twitter:</strong>{' '}
                <a
                  href="https://twitter.com/GradeU_Edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:underline"
                >
                  @GradeU_Edu
                </a>
              </li>
              <li>
                <strong className="text-white">GitHub:</strong>{' '}
                <a
                  href="https://github.com/gradeu-org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:underline"
                >
                  gradeu-org
                </a>
              </li>
              <li>
                <strong className="text-white">Telegram Bot:</strong>{' '}
                <a
                  href="https://t.me/GradeU_Bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:underline"
                >
                  @GradeU_Bot
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Website</h2>
            <p>
              Visit our website at{' '}
              <a
                href="https://gradeu.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline"
              >
                www.gradeu.in
              </a>{' '}
              for the latest information about our courses, labs, and features.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Feedback &amp; Suggestions</h2>
            <p>
              Your input helps us improve. If you have suggestions for new features, course topics,
              or any other improvements, please don&apos;t hesitate to reach out via email. We
              carefully review every piece of feedback we receive.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Partnership Inquiries</h2>
            <p>
              Interested in partnering with GradeU? Whether you&apos;re an educational institution,
              a content creator, or a technology company, we&apos;re open to exploring collaboration
              opportunities. Please email us with details about your proposal.
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
