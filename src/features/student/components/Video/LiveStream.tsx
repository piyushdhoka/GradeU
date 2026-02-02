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
      setViewerCount(prev => prev + Math.floor(Math.random() * 3) - 1);
      
      // Simulate instructor messages
      if (Math.random() < 0.1) {
        const instructorMessages = [
          "Great question! Let me demonstrate this vulnerability.",
          "Remember to always validate input in your applications.",
          "This is a common attack vector we see in the wild.",
          "Make sure you're following along in your lab environment.",
          "Any questions about this SQL injection technique?"
        ];
        
        const randomMessage = instructorMessages[Math.floor(Math.random() * instructorMessages.length)];
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          user: instructor,
          message: randomMessage,
          timestamp: new Date(),
          isInstructor: true
        }]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [instructor]);

  const handleJoinStream = () => {
    setIsJoined(true);
    setViewerCount(prev => prev + 1);
    if (onJoin) onJoin();
  };

  const handleLeaveStream = () => {
    setIsJoined(false);
    setViewerCount(prev => prev - 1);
    if (onLeave) onLeave();
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'You',
      message: newMessage,
      timestamp: new Date(),
      isInstructor: false
    }]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  if (!isJoined) {
    return (
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <div className="relative">
          <div className="aspect-video bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 accent-amber rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-10 w-10 text-contrast" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">{title}</h2>
              <p className="text-muted mb-4">Live Cybersecurity Training Session</p>
              <div className="flex items-center justify-center space-x-4 text-sm text-low mb-6">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 accent-amber rounded-full animate-pulse"></div>
                  <span className="text-primary">LIVE</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-primary">{viewerCount} viewers</span>
                </div>
                <div>
                  <span className="text-primary">Instructor: {instructor}</span>
                </div>
              </div>
              <button
                onClick={handleJoinStream}
                className="btn-primary btn-primary-rounded"
              >
                Join Live Stream
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="bg-card rounded-lg shadow-md overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
        {/* Video Stream */}
        <div className={`${showChat ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <VideoPlayer
            videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            title={title}
            isLive={true}
          />
          
          {/* Stream Controls */}
          <div className="bg-muted p-4 border-t border-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-low">
                  <div className="w-2 h-2 accent-amber rounded-full animate-pulse"></div>
                  <span className="font-medium text-primary">LIVE</span>
                  <span className="text-low">•</span>
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-primary">{viewerCount} viewers</span>
                </div>
                <div className="text-sm text-muted">
                  Instructor: <span className="font-medium text-primary">{instructor}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-2 rounded-lg transition-colors ${isMicOn ? 'accent-emerald text-contrast' : 'bg-card text-muted'}`}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`p-2 rounded-lg transition-colors ${isCameraOn ? 'accent-emerald text-contrast' : 'bg-card text-muted'}`}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="flex items-center space-x-1 px-3 py-2 btn-primary btn-primary-rounded"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </button>
                <button
                  onClick={handleLeaveStream}
                  className="px-3 py-2 btn-cta rounded-lg"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Chat */}
        {showChat && (
          <div className="lg:col-span-1 bg-muted border-l border-card flex flex-col h-96 lg:h-auto">
            <div className="bg-muted p-3 border-b border-card">
              <h3 className="font-medium text-primary">Live Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className="text-sm">
                  <div className="flex items-start space-x-2">
                    <div className={`font-medium ${message.isInstructor ? 'text-accent' : 'text-muted'}`}>
                      {message.user}
                      {message.isInstructor && (
                        <span className="ml-1 text-xs accent-amber text-contrast px-1 rounded">
                          Instructor
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-low">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="text-primary mt-1">{message.message}</div>
                </div>
              ))}
            </div>
            
            <div className="p-3 border-t border-card">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-card rounded-lg text-sm bg-card text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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