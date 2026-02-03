import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Send, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';

interface LiveStreamProps {
  streamId?: string;
  title: string;
  instructor: string;
  onJoin?: () => void;
  onLeave?: () => void;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isInstructor?: boolean;
}

export const LiveStream: React.FC<LiveStreamProps> = ({ title, instructor, onJoin, onLeave }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Simulate live stream data
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 3) - 1);

      // Simulate instructor messages
      if (Math.random() < 0.1) {
        const instructorMessages = [
          'Great question! Let me demonstrate this vulnerability.',
          'Remember to always validate input in your applications.',
          'This is a common attack vector we see in the wild.',
          "Make sure you're following along in your lab environment.",
          'Any questions about this SQL injection technique?',
        ];

        const randomMessage =
          instructorMessages[Math.floor(Math.random() * instructorMessages.length)];
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            user: instructor,
            message: randomMessage,
            timestamp: new Date(),
            isInstructor: true,
          },
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [instructor]);

  const handleJoinStream = () => {
    setIsJoined(true);
    setViewerCount((prev) => prev + 1);
    if (onJoin) onJoin();
  };

  const handleLeaveStream = () => {
    setIsJoined(false);
    setViewerCount((prev) => prev - 1);
    if (onLeave) onLeave();
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user: 'You',
        message: newMessage,
        timestamp: new Date(),
        isInstructor: false,
      },
    ]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  if (!isJoined) {
    return (
      <div className="bg-card overflow-hidden rounded-lg shadow-md">
        <div className="relative">
          <div className="bg-muted flex aspect-video items-center justify-center">
            <div className="text-center">
              <div className="accent-amber mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <Video className="text-contrast h-10 w-10" />
              </div>
              <h2 className="text-primary mb-2 text-2xl font-bold">{title}</h2>
              <p className="text-muted mb-4">Live Cybersecurity Training Session</p>
              <div className="text-low mb-6 flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="accent-amber h-2 w-2 animate-pulse rounded-full"></div>
                  <span className="text-primary">LIVE</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="text-primary h-4 w-4" />
                  <span className="text-primary">{viewerCount} viewers</span>
                </div>
                <div>
                  <span className="text-primary">Instructor: {instructor}</span>
                </div>
              </div>
              <button onClick={handleJoinStream} className="btn-primary btn-primary-rounded">
                Join Live Stream
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card overflow-hidden rounded-lg shadow-md">
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-4">
        {/* Video Stream */}
        <div className={`${showChat ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <VideoPlayer
            videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            title={title}
            isLive={true}
          />

          {/* Stream Controls */}
          <div className="bg-muted border-card border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-low flex items-center space-x-2 text-sm">
                  <div className="accent-amber h-2 w-2 animate-pulse rounded-full"></div>
                  <span className="text-primary font-medium">LIVE</span>
                  <span className="text-low">•</span>
                  <Users className="text-primary h-4 w-4" />
                  <span className="text-primary">{viewerCount} viewers</span>
                </div>
                <div className="text-muted text-sm">
                  Instructor: <span className="text-primary font-medium">{instructor}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`rounded-lg p-2 transition-colors ${isMicOn ? 'accent-emerald text-contrast' : 'bg-card text-muted'}`}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`rounded-lg p-2 transition-colors ${isCameraOn ? 'accent-emerald text-contrast' : 'bg-card text-muted'}`}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="btn-primary btn-primary-rounded flex items-center space-x-1 px-3 py-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </button>
                <button onClick={handleLeaveStream} className="btn-cta rounded-lg px-3 py-2">
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Chat */}
        {showChat && (
          <div className="bg-muted border-card flex h-96 flex-col border-l lg:col-span-1 lg:h-auto">
            <div className="bg-muted border-card border-b p-3">
              <h3 className="text-primary font-medium">Live Chat</h3>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {chatMessages.map((message) => (
                <div key={message.id} className="text-sm">
                  <div className="flex items-start space-x-2">
                    <div
                      className={`font-medium ${message.isInstructor ? 'text-accent' : 'text-muted'}`}
                    >
                      {message.user}
                      {message.isInstructor && (
                        <span className="accent-amber text-contrast ml-1 rounded px-1 text-xs">
                          Instructor
                        </span>
                      )}
                    </div>
                    <div className="text-low text-xs">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-primary mt-1">{message.message}</div>
                </div>
              ))}
            </div>

            <div className="border-card border-t p-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="border-card bg-card text-primary flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="btn-primary rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
