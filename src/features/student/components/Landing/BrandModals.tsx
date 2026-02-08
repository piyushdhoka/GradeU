'use client';

import React from 'react';
import { X, Mail, Globe, Users, Shield, Zap } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-300">
      <div className="animate-in zoom-in-95 relative w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 rounded-full bg-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="bg-brand-400/10 rounded-2xl p-3">
              <Users className="text-brand-400 h-8 w-8" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
              About Grade<span className="text-brand-400">U</span>
            </h2>
          </div>

          <div className="space-y-6 leading-relaxed text-zinc-400">
            <p className="text-lg">
              GradeU is a next-generation educational platform built to bridge the gap between
              theoretical knowledge and practical expertise.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                <Shield className="text-brand-400 mb-3 h-6 w-6" />
                <h3 className="mb-1 font-bold text-white">Our Mission</h3>
                <p className="text-sm">
                  To democratize high-quality technical education through hands-on, interactive
                  learning experiences.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                <Zap className="text-brand-400 mb-3 h-6 w-6" />
                <h3 className="mb-1 font-bold text-white">Our Vision</h3>
                <p className="text-sm">
                  Becoming the global standard for skill assessment and verified academic
                  excellence.
                </p>
              </div>
            </div>

            <p>
              Founded by a team of passionate educators and engineers at{' '}
              <strong>MovingLines</strong>, GradeU combines AI-driven personalization with secure,
              proctored environments to deliver results that actually matter in the professional
              world.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContactUsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-300">
      <div className="animate-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 rounded-full bg-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="bg-brand-400/10 rounded-2xl p-3">
              <Mail className="text-brand-400 h-8 w-8" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
              Contact <span className="text-brand-400">Us</span>
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-zinc-400">
              Have questions or feedback? We&apos;d love to hear from you. Reach out to us through
              any of the following channels.
            </p>

            <div className="space-y-4">
              <a
                href="mailto:smartgaurd123@gmail.com"
                className="hover:border-brand-400/50 group flex items-center gap-4 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4 transition-all hover:bg-zinc-800"
              >
                <div className="group-hover:bg-brand-400/10 rounded-xl bg-zinc-700 p-3 transition-colors">
                  <Mail className="group-hover:text-brand-400 h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Email Us</h4>
                  <p className="text-xs text-zinc-500">smartgaurd123@gmail.com</p>
                </div>
              </a>

              <a
                href="https://gradeu.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:border-brand-400/50 group flex items-center gap-4 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4 transition-all hover:bg-zinc-800"
              >
                <div className="group-hover:bg-brand-400/10 rounded-xl bg-zinc-700 p-3 transition-colors">
                  <Globe className="group-hover:text-brand-400 h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Website</h4>
                  <p className="text-xs text-zinc-500">www.gradeu.in</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
