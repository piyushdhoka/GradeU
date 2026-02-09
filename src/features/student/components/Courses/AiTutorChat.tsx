import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, Minimize2, Maximize2 } from 'lucide-react';
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

const quickSuggestions = [
  'Explain this concept',
  'Give me an example',
  'What are the key points?',
  'How is this used in practice?',
];

export const AiTutorChat: React.FC<AiTutorChatProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI Tutor for **${context.moduleTitle}**. I can help you understand the concepts in this module. Ask me anything!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input.trim();
    if (!messageToSend || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: messageToSend }]);
    setIsLoading(true);

    try {
      const messageHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      messageHistory.push({ role: 'user', content: messageToSend });

      const reply = await aiTutorService.chat(messageHistory as any, context);

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
    const formatted = content
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(
        /```([\s\S]*?)```/gi,
        '<pre class="bg-black/20 p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>'
      )
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      // Line breaks
      .replace(/\n/g, '<br/>');

    return formatted;
  };

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="bg-primary hover:bg-primary/90 group h-14 w-14 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-110 hover:shadow-primary/30"
        >
          <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" />
        </Button>
      )}

      {isOpen && (
        <Card
          className={cn(
            'animate-in fade-in slide-in-from-bottom-10 flex flex-col overflow-hidden border-border/50 shadow-2xl duration-300',
            isExpanded ? 'h-[600px] w-[440px]' : 'h-[480px] w-80 md:w-96'
          )}
        >
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 relative rounded-full p-2">
                <Bot className="text-primary h-5 w-5" />
                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">AI Tutor</CardTitle>
                <p className="text-muted-foreground text-[11px]">
                  {context.moduleTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="flex-1 space-y-3 overflow-y-auto p-4" ref={scrollRef}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex gap-2',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="bg-primary/10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      <Bot className="text-primary h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                  >
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="bg-primary/10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    <Bot className="text-primary h-3.5 w-3.5" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
                      <span className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
                      <span className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick suggestions */}
              {showSuggestions && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {quickSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/50 bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask about this module..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  className="h-9 rounded-xl border-border/50 bg-background text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
                />
                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="h-9 w-9 shrink-0 rounded-xl"
                >
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
