import React from 'react';
import { AlertTriangle, XCircle, Clock, Shield, Terminal, ArrowLeft } from 'lucide-react';

interface ExamTerminationModalProps {
  isOpen: boolean;
  violations: number;
  threshold: number;
  violationReasons: string[];
  onClose: () => void;
}

export const ExamTerminationModal: React.FC<ExamTerminationModalProps> = ({
  isOpen,
  violations,
  threshold,
  violationReasons,
  onClose,
}) => {
  if (!isOpen) return null;

  const getViolationDetails = (reason: string) => {
    switch (reason) {
      case 'no_face':
        return {
          title: 'Face Not Visible',
          description: 'Your face was not detected in the camera for extended periods',
          icon: <Shield className="h-6 w-6 text-red-500" />,
        };
      case 'multiple_faces':
        return {
          title: 'Multiple People Detected',
          description: 'More than one person was detected in the camera view',
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
        };
      case 'window_blur':
        return {
          title: 'Window Focus Lost',
          description: 'You switched away from the exam window or minimized the browser',
          icon: <Clock className="h-6 w-6 text-red-500" />,
        };
      default:
        return {
          title: 'Proctoring Violation',
          description: 'A proctoring rule was violated during the exam',
          icon: <XCircle className="h-6 w-6 text-red-500" />,
        };
    }
  };

  const uniqueReasons = [...new Set(violationReasons)];

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm duration-300">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-red-500/30 bg-[#0A0F0A] shadow-[0_0_100px_rgba(239,68,68,0.2)]">
        <div className="absolute top-0 left-0 h-1 w-full animate-pulse bg-gradient-to-r from-red-600 via-red-400 to-red-600" />

        <div className="overflow-y-auto p-10">
          {/* Header */}
          <div className="mb-10 flex items-center space-x-6">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/20 p-4">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                Neural Link Severed
              </h2>
              <p className="mt-1 font-mono text-xs tracking-[0.3em] text-red-400 uppercase">
                Status: ACCESS_REJECTED // PROTOCOL_VIOLATION
              </p>
            </div>
          </div>

          {/* Violation Summary */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Terminal className="h-24 w-24 text-red-500" />
            </div>
            <div className="mb-3 flex items-center">
              <AlertTriangle className="mr-3 h-5 w-5 text-red-500" />
              <h3 className="text-sm font-black tracking-widest text-red-400 uppercase">
                Integrated Violation Report
              </h3>
            </div>
            <p className="relative z-10 leading-relaxed text-[#EAEAEA]">
              Multiple security anomalies detected. System integrity threshold of{' '}
              <strong>{threshold}</strong> exceeded with{' '}
              <strong>{violations} confirmed violations</strong>.
            </p>
          </div>

          {/* Detailed Violations */}
          <div className="mb-8">
            <h3 className="mb-4 text-xs font-black tracking-widest text-[#00B37A] uppercase opacity-50">
              Anomaly Data Points
            </h3>
            <div className="space-y-4">
              {uniqueReasons.map((reason, index) => {
                const details = getViolationDetails(reason);
                const count = violationReasons.filter((r) => r === reason).length;
                return (
                  <div
                    key={index}
                    className="group flex items-start rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-red-500/20"
                  >
                    <div className="mr-4 flex-shrink-0 rounded-xl bg-red-500/10 p-2 transition-transform group-hover:scale-110">
                      {details.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold tracking-tight text-white">
                        {details.title}
                      </h4>
                      <p className="mt-1 text-sm text-[#00B37A] italic">{details.description}</p>
                      <div className="mt-2 font-mono text-[10px] tracking-widest text-red-400/60 uppercase">
                        Occurrences: {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-6 sm:flex-row">
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="flex flex-1 items-center justify-center space-x-3 rounded-xl bg-red-600 px-8 py-4 font-black tracking-widest text-white uppercase shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all hover:bg-red-500"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Sanitize & Return</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-black tracking-widest text-[#00B37A] uppercase transition-all hover:bg-white/10"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTerminationModal;
