import React, { useRef, useState } from 'react';
import { Proctoring } from './ProctoringEngine';
import ViolationNotification from './ViolationNotification';

export const ProctoringDemo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [violations, setViolations] = useState(0);
  const [lastViolationReason, setLastViolationReason] = useState<string>('');

  const append = (s: string) => setLogs((l) => [new Date().toLocaleTimeString() + ' - ' + s, ...l].slice(0, 200));

  const sendLog = async (payload: Record<string, unknown>) => {
    try {
      await fetch('/proctor-logs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    } catch {
      // ignore send errors
    }
  };

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setRunning(true);
      append('Media started');
      void sendLog({ event: 'media-started', time: new Date().toISOString() });
    } catch (err: unknown) {
      append('Media start failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const stop = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
    setRunning(false);
    setViolations(0);
    setLastViolationReason('');
    append('Media stopped');
    void sendLog({ event: 'media-stopped', time: new Date().toISOString() });
  };

  const handleViolation = (count: number, reason: string) => {
    setViolations(count);
    setLastViolationReason(reason);
    append(`Violation ${count}: ${reason}`);
  };

  const handleViolationWarning = (reason: string, count: number, threshold: number) => {
    setLastViolationReason(reason);
    append(`Warning: ${reason} (${count}/${threshold})`);
  };

  return (
    <div className="p-6">
      {/* Violation Notification */}
      <ViolationNotification
        violations={violations}
        threshold={3}
        lastViolationReason={lastViolationReason}
      />

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Proctoring Demo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="relative bg-black rounded overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 flex space-x-2">
              {!running ? (
                <button onClick={start} className="px-4 py-2 bg-cyan-600 text-white rounded">Start Camera</button>
              ) : (
                <button onClick={stop} className="px-4 py-2 bg-red-600 text-white rounded">Stop Camera</button>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">Proctoring</h3>
              <Proctoring
                videoRef={videoRef}
                mediaStream={stream}
                enabled={running}
                onViolation={handleViolation}
                onEndExam={() => append('End exam triggered')}
                onStatusChange={(s) => append('Status: ' + s)}
                onViolationWarning={handleViolationWarning}
                threshold={3}
              />
            </div>

            <div className="bg-white p-4 rounded shadow mt-4">
              <h3 className="font-semibold mb-2">Logs</h3>
              <div style={{ maxHeight: 320, overflow: 'auto' }}>
                {logs.map((l, idx) => (
                  <div key={idx} className="text-xs font-mono text-gray-700">{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProctoringDemo;
