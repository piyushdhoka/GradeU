import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';

import { Input } from '@components/ui/input';
import { aiTutorService } from '@services/aiTutorService';
import { cn } from '@lib/utils';

interface AiTutorChatProps {
  context: {
    courseTitle: string;
    moduleTitle: string;
    moduleDescription: string;
    topicContent?: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AiTutorChat: React.FC<AiTutorChatProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I am your AI Tutor. I can help you understand this module. Ask me anything!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Prepare message history for API (map internal Message to API format if needed, here they match strictly except generic 'system' role which we omit for history)
      const messageHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      messageHistory.push({ role: 'user', content: userMessage });

      const reply = await aiTutorService.chat(messageHistory as any, context); // Cast as any because simplified alignment

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    let formatted = content
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(
        /```([\s\S]*?)```/gi,
        '<pre class="bg-black/10 p-2 rounded my-2 overflow-x-auto"><code>$1</code></pre>'
      )
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-black/10 px-1 rounded">$1</code>')
      // Line breaks
      .replace(/\n/g, '<br/>');

    return formatted;
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="animate-in fade-in slide-in-from-bottom-10 w-80 shadow-2xl duration-300 md:w-96">
          <CardHeader className="flex flex-row items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-full p-2">
                <Bot className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">AI Tutor</CardTitle>
                <p className="text-muted-foreground text-xs">Always here to help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-80 space-y-4 overflow-y-auto p-4" ref={scrollRef}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                </div>
              ))}
              {isLoading && (
                <div className="bg-muted text-foreground w-max max-w-[80%] rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current delay-0" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current delay-150" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current delay-300" />
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  className="focus-visible:ring-0"
                />
                <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
