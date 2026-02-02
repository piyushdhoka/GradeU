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
  onClose
}) => {
  if (!isOpen) return null;

  const getViolationDetails = (reason: string) => {
    switch (reason) {
      case 'no_face':
        return {
          title: 'Face Not Visible',
          description: 'Your face was not detected in the camera for extended periods',
          icon: <Shield className="h-6 w-6 text-red-500" />
        };
      case 'multiple_faces':
        return {
          title: 'Multiple People Detected',
          description: 'More than one person was detected in the camera view',
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />
        };
      case 'window_blur':
        return {
          title: 'Window Focus Lost',
          description: 'You switched away from the exam window or minimized the browser',
          icon: <Clock className="h-6 w-6 text-red-500" />
        };
      default:
        return {
          title: 'Proctoring Violation',
          description: 'A proctoring rule was violated during the exam',
          icon: <XCircle className="h-6 w-6 text-red-500" />
        };
    }
  };

  const uniqueReasons = [...new Set(violationReasons)];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-[#0A0F0A] border-2 border-red-500/30 rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.2)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600 animate-pulse" />

        <div className="p-10 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center space-x-6 mb-10">
            <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Neural Link Severed</h2>
              <p className="text-red-400 font-mono text-xs uppercase tracking-[0.3em] mt-1">Status: ACCESS_REJECTED // PROTOCOL_VIOLATION</p>
            </div>
          </div>

          {/* Violation Summary */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <Terminal className="h-24 w-24 text-red-500" />
            </div>
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <h3 className="text-sm font-black text-red-400 uppercase tracking-widest">Integrated Violation Report</h3>
            </div>
            <p className="text-[#EAEAEA] leading-relaxed relative z-10">
              Multiple security anomalies detected. System integrity threshold of <strong>{threshold}</strong> exceeded with <strong>{violations} confirmed violations</strong>.
            </p>
          </div>

          {/* Detailed Violations */}
          <div className="mb-8">
            <h3 className="text-xs font-black text-[#00B37A] uppercase tracking-widest mb-4 opacity-50">Anomaly Data Points</h3>
            <div className="space-y-4">
              {uniqueReasons.map((reason, index) => {
                const details = getViolationDetails(reason);
                const count = violationReasons.filter(r => r === reason).length;
                return (
                  <div key={index} className="flex items-start p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-red-500/20 transition-all">
                    <div className="flex-shrink-0 mr-4 p-2 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
                      {details.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg tracking-tight">{details.title}</h4>
                      <p className="text-sm text-[#00B37A] mt-1 italic">{details.description}</p>
                      <div className="mt-2 text-[10px] font-mono text-red-400/60 uppercase tracking-widest">
                        Occurrences: {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-white/5">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 flex items-center justify-center space-x-3 px-8 py-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Sanitize & Return</span>
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 bg-white/5 border border-white/10 text-[#00B37A] rounded-xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
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
