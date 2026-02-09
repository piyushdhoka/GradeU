import React from 'react';
import { Metadata } from 'next';
import { Navbar, NavBody, NavbarLogo, NavbarButton } from '@components/ui/resizable-navbar';
import { LandingFooter } from '@student/components/Landing/LandingFooter';
import Link from 'next/link';
import { siteConfig } from '@lib/metaConfig';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about GradeU — the next-generation educational platform bridging theory and industry through AI-powered tutoring, interactive labs, and proctored assessments.',
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
};

export default function AboutPage() {
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
        <h1 className="mb-8 text-4xl font-black tracking-tighter">About GradeU</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
          <p className="text-lg leading-relaxed">
            GradeU is a next-generation educational platform built to bridge the gap between
            theoretical knowledge and practical expertise. We empower students, educators, and
            professionals to achieve academic excellence through hands-on, interactive learning
            experiences.
          </p>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Our Mission</h2>
            <p>
              Our mission is to democratize high-quality technical education through hands-on,
              interactive learning experiences. We believe that every student deserves access to
              world-class resources, regardless of their background or location. GradeU is committed
              to providing an equitable learning environment where skills are built through
              practice, not just theory.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Our Vision</h2>
            <p>
              We aspire to become the global standard for skill assessment and verified academic
              excellence. By combining cutting-edge AI technology with proven pedagogical
              approaches, GradeU aims to transform the way people learn, practice, and demonstrate
              their technical competencies.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">What We Offer</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">AI-Powered Tutoring:</strong> Personalized learning
                paths powered by artificial intelligence that adapt to each student&apos;s pace and
                skill level.
              </li>
              <li>
                <strong className="text-white">Interactive Labs:</strong> Hands-on coding and
                technical labs that let you apply what you learn in real-world scenarios.
              </li>
              <li>
                <strong className="text-white">Proctored Assessments:</strong> Secure, proctored
                exams that validate your skills and issue verified certificates recognized by
                employers.
              </li>
              <li>
                <strong className="text-white">Community Forum:</strong> A vibrant community of
                learners and mentors collaborating, sharing knowledge, and growing together.
              </li>
              <li>
                <strong className="text-white">Video Library:</strong> A comprehensive library of
                educational videos and live streams covering a wide range of technical subjects.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Our Team</h2>
            <p>
              Founded by a team of passionate educators and engineers at{' '}
              <strong className="text-white">MovingLines</strong>, GradeU combines AI-driven
              personalization with secure, proctored environments to deliver results that matter in
              the professional world. Our team is dedicated to continuous innovation and
              improvement, ensuring that our platform stays at the forefront of educational
              technology.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Why Choose GradeU?</h2>
            <p>
              Unlike traditional learning platforms that focus solely on video content, GradeU takes
              a results-driven approach. Our platform is designed to help you not just learn but
              prove your skills through verified assessments. With our combination of AI tutoring,
              interactive labs, and proctored exams, GradeU provides a complete learning experience
              that prepares you for real-world challenges.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">Get in Touch</h2>
            <p>
              We value your feedback and are always looking to improve. If you have questions,
              suggestions, or would like to learn more about GradeU, please visit our{' '}
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
