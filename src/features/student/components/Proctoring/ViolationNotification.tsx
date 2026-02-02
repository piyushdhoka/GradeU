import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Eye, Users, Monitor } from 'lucide-react';
import { cn } from '@lib/utils';

interface ViolationNotificationProps {
  violations: number;
  threshold: number;
  lastViolationReason?: string;
  onDismiss?: () => void;
}

export const ViolationNotification: React.FC<ViolationNotificationProps> = ({
  violations,
  threshold,
  lastViolationReason,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (violations > 0 && !dismissed) {
      setIsVisible(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [violations, dismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const getViolationIcon = (reason?: string) => {
    switch (reason) {
      case 'no_face':
        return <Eye className="h-5 w-5" />;
      case 'multiple_faces':
        return <Users className="h-5 w-5" />;
      case 'window_blur':
        return <Monitor className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getViolationMessage = (reason?: string) => {
    switch (reason) {
      case 'no_face':
        return 'Please ensure your face is visible in the camera';
      case 'multiple_faces':
        return 'Only one person should be visible during the exam';
      case 'window_blur':
        return 'Please stay focused on the exam window';
      default:
        return 'Proctoring violation detected';
    }
  };

  const getSeverityLevel = () => {
    if (violations >= threshold - 1) return 'critical';
    if (violations >= threshold - 2) return 'warning';
    return 'info';
  };


  if (!isVisible || violations === 0) return null;

  const severity = getSeverityLevel();

  return (
    <div className="fixed top-20 right-4 z-[100] max-w-sm animate-in fade-in slide-in-from-right duration-500">
      <div className={cn(
        "rounded-2xl border backdrop-blur-xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group",
        severity === 'critical' ? "bg-red-500/10 border-red-500/30 shadow-red-500/10" :
          severity === 'warning' ? "bg-yellow-500/10 border-yellow-500/30 shadow-yellow-500/10" :
            "bg-[#00FF88]/10 border-[#00FF88]/30 shadow-[#00FF88]/10"
      )}>
        <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-50" style={{ color: severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#eab308' : '#00FF88' }} />

        <div className="flex items-start">
          <div className={cn(
            "flex-shrink-0 p-2 rounded-lg",
            severity === 'critical' ? "bg-red-500/20 text-red-400" :
              severity === 'warning' ? "bg-yellow-500/20 text-yellow-400" :
                "bg-[#00FF88]/20 text-[#00FF88]"
          )}>
            {getViolationIcon(lastViolationReason)}
          </div>
          <div className="ml-4 flex-1">
            <h3 className={cn(
              "text-xs font-black uppercase tracking-[0.2em]",
              severity === 'critical' ? "text-red-400" :
                severity === 'warning' ? "text-yellow-400" :
                  "text-[#00FF88]"
            )}>
              Security Alert
            </h3>
            <div className="mt-2">
              <p className="text-white text-sm font-bold leading-tight">{getViolationMessage(lastViolationReason)}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#00B37A] uppercase tracking-widest">
                  Integrity Level: {violations}/{threshold}
                </span>
                {violations >= threshold - 1 && (
                  <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-black animate-pulse">
                    CRITICAL
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="text-[#00B37A] hover:text-white transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationNotification;
