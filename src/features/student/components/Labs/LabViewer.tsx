import React, { useState, useEffect } from 'react';
import { Terminal, ExternalLink, ArrowLeft, CheckCircle } from 'lucide-react';
import { labs } from '@data/labs';
import { isLabCompleted, markLabAsCompleted } from '@utils/labCompletion';
import { labApiService } from '@services/labApiService';
import { useAuth } from '@context/AuthContext';

interface LabViewerProps {
  labId: string;
  onBack: () => void;
}

export const LabViewer: React.FC<LabViewerProps> = ({ labId, onBack }) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for external completion sync from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const completedLabId = params.get('labCompleted');

    if (completedLabId === labId) {
      handleExternalCompletion();
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [labId]);

  // Load initial completion status
  useEffect(() => {
    loadCompletionStatus();
  }, [labId]);

  const loadCompletionStatus = async () => {
    try {
      setIsLoading(true);
      const status = await labApiService.getLabStatus(labId);
      setIsCompleted(status.completed);

      // Also sync with localStorage
      if (status.completed) {
        markLabAsCompleted(labId);
      }
    } catch (error) {
      console.error('Error loading lab status:', error);
      // Fallback to localStorage
      setIsCompleted(isLabCompleted(labId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalCompletion = async () => {
    try {
      setIsLoading(true);
      // Mark as completed via API (webhook may have already done this, but ensure sync)
      await labApiService.markLabAsCompleted(labId);
      markLabAsCompleted(labId); // Also update localStorage
      setIsCompleted(true);
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 5000);
    } catch (error) {
      console.error('Error syncing external completion:', error);
      // Still show as completed locally
      markLabAsCompleted(labId);
      setIsCompleted(true);
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    try {
      // Mark in localStorage for offline support
      markLabAsCompleted(labId);

      // Also save to database
      await labApiService.markLabAsCompleted(labId);

      setIsCompleted(true);
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 3000);
    } catch (error) {
      console.error('Error marking lab as completed:', error);
      // Still mark as completed locally even if API fails
      setIsCompleted(true);
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 3000);
    }
  };

  const lab = labs.find((l) => l.id === labId);

  if (!lab) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="mx-auto max-w-4xl py-20 text-center">
          <Terminal className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-white">Lab Not Found</h2>
          <p className="mb-6 text-[#00B37A]">
            Lab simulations are currently being prepared. Check back soon.
          </p>
          <button
            onClick={onBack}
            className="rounded-lg bg-[#00FF88] px-6 py-3 font-bold text-black transition-colors hover:bg-[#00CC66]"
          >
            Return to Labs
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-[#00FF88] border-[#00FF88] bg-[#00FF88]/10';
      case 'intermediate':
        return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'advanced':
        return 'text-red-400 border-red-400 bg-red-400/10';
      default:
        return 'text-slate-400 border-slate-400 bg-slate-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="group mb-8 flex items-center space-x-2 text-[#00B37A] transition-colors hover:text-[#00FF88]"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to Labs</span>
        </button>

        {/* Lab Header Card */}
        <div className="mb-8 overflow-hidden rounded-xl border border-[#00FF88]/10 bg-[#0A0F0A]">
          <div className="p-8">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-center space-x-3">
                  <div className="rounded-lg border border-[#00FF88]/20 bg-[#00FF88]/10 p-3">
                    <Terminal className="h-6 w-6 text-[#00FF88]" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">{lab.title}</h1>
                    <p className="mt-1 font-mono text-sm text-[#00B37A]">THEORETICAL TRAINING</p>
                  </div>
                </div>
                <p className="mb-6 text-lg text-[#EAEAEA]">{lab.description}</p>

                <div className="flex flex-wrap items-center gap-4 space-x-6 font-mono text-sm">
                  <span
                    className={`rounded border px-3 py-1 ${getDifficultyColor(lab.difficulty)} font-bold tracking-wider uppercase`}
                  >
                    {lab.difficulty}
                  </span>
                  <div className="text-[#00B37A]">
                    <span className="text-[#00FF88]">⏱</span> {lab.estimatedTime}
                  </div>
                  <div className="text-[#00B37A]">
                    <span className="text-[#00FF88]">🛠</span> {lab.tools.join(', ')}
                  </div>
                </div>
              </div>

              {/* Launch Lab Button */}
              <a
                href={
                  lab.liveUrl
                    ? `${lab.liveUrl}?studentId=${user?.id}&returnUrl=${encodeURIComponent(window.location.origin + '/labs/' + labId)}`
                    : '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!lab.liveUrl) {
                    e.preventDefault();
                    alert('Lab URL not configured');
                  }
                }}
                className="ml-6 flex items-center space-x-2 rounded-lg bg-[#00FF88] px-6 py-3 font-bold whitespace-nowrap text-black transition-all hover:bg-[#00CC66] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
              >
                <span>{isCompleted ? 'Reopen Lab' : 'Launch Lab'}</span>
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Theory Section */}
        <div className="overflow-hidden rounded-xl border border-[#00FF88]/10 bg-[#0A0F0A]">
          <div className="border-b border-[#00FF88]/10 p-6">
            <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
              <Terminal className="h-5 w-5 text-[#00FF88]" />
              <span>Learning Materials</span>
            </h2>
          </div>

          <div className="p-8">
            <div className="prose prose-invert max-w-none text-[#EAEAEA]">
              <div
                className="space-y-4 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    let s = lab.instructions.replace(/\n/g, '<br/>');
                    s = s.replace(
                      /^# (.+)$/gm,
                      '<h2 class="text-2xl font-bold text-white mt-6 mb-4">$1</h2>'
                    );
                    s = s.replace(
                      /^## (.+)$/gm,
                      '<h3 class="text-xl font-bold text-[#00FF88] mt-5 mb-3">$1</h3>'
                    );
                    s = s.replace(/^- (.+)$/gm, '<li class="ml-6 text-[#EAEAEA] mb-2">• $1</li>');
                    s = s.replace(
                      /^(\d+)\. (.+)$/gm,
                      '<li class="ml-6 text-[#EAEAEA] mb-2">$1. $2</li>'
                    );
                    s = s.replace(
                      /\*\*(.+?)\*\*/g,
                      '<strong class="text-[#00FF88] font-bold">$1</strong>'
                    );
                    return s;
                  })(),
                }}
              />
            </div>
          </div>
        </div>

        {/* Completion Status Banner */}
        {showCompletionMessage && (
          <div className="animate-slide-in fixed top-4 right-4 z-50 rounded-lg border-2 border-[#00FF88] bg-[#00FF88] px-6 py-4 text-black shadow-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6" />
              <div>
                <p className="font-bold">Lab Completed!</p>
                <p className="text-sm">Completion status synced successfully.</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed top-4 right-4 z-50 rounded-lg border border-[#00FF88]/20 bg-[#0A0F0A] px-6 py-4 text-[#00FF88] shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#00FF88]"></div>
              <span className="font-medium">Syncing lab status...</span>
            </div>
          </div>
        )}

        {/* Additional Resources */}
        <div className="mt-8 rounded-xl border border-[#00FF88]/10 bg-[#0A0F0A] p-6">
          <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
            <ExternalLink className="h-5 w-5 text-[#00FF88]" />
            <span>Lab Environment</span>
          </h3>
          <p className="mb-6 text-[#00B37A]">
            Ready to apply what you've learned? Click the button below to access the live lab
            environment where you can practice hands-on exploitation techniques.
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <a
              href={
                lab.liveUrl
                  ? `${lab.liveUrl}?studentId=${user?.id}&returnUrl=${encodeURIComponent(window.location.origin + '/labs/' + labId)}`
                  : '#'
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!lab.liveUrl) {
                  e.preventDefault();
                  alert('Lab URL not configured');
                }
              }}
              className="inline-flex items-center space-x-2 rounded-lg bg-[#00FF88] px-6 py-3 font-bold text-black transition-all hover:bg-[#00CC66] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
            >
              <span>{isCompleted ? 'Reopen Lab Environment' : 'Launch Lab Environment'}</span>
              <ExternalLink className="h-5 w-5" />
            </a>

            {isCompleted ? (
              <button
                disabled
                className="inline-flex cursor-default items-center space-x-2 rounded-lg border border-[#00FF88]/40 bg-[#00FF88]/20 px-6 py-3 font-bold text-[#00FF88]"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Lab Completed</span>
              </button>
            ) : (
              <button
                onClick={handleMarkAsCompleted}
                className="inline-flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition-all hover:bg-green-700 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Mark as Completed</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
