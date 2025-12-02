import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Volume2, Loader2, Copy, Check, Trash2, Sparkles, TrendingUp, Building2, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  { icon: TrendingUp, text: "What's the market sentiment today?", color: "text-green-500" },
  { icon: Building2, text: "Analyze Reliance Industries", color: "text-blue-500" },
  { icon: HelpCircle, text: "Explain P/E ratio in simple terms", color: "text-purple-500" },
  { icon: Sparkles, text: "Top performing Indian stocks this week", color: "text-amber-500" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "te", name: "తెలుగు" },
  { code: "ta", name: "தமிழ்" },
  { code: "hi", name: "हिंदी" },
];

const formatMessageContent = (text: string) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const formatted: JSX.Element[] = [];
  
  lines.forEach((line, index) => {
    let cleanLine = line.replace(/^\*+\s*/, '').replace(/\*\*/g, '');
    
    if (!cleanLine.trim()) {
      formatted.push(<div key={index} className="h-2" />);
      return;
    }
    
    // Check for headings
    if (cleanLine.startsWith('## ') || cleanLine.startsWith('### ')) {
      formatted.push(
        <h3 key={index} className="font-semibold text-base mt-3 mb-1">
          {cleanLine.replace(/^#+\s*/, '')}
        </h3>
      );
    } else if (cleanLine.includes(':') && cleanLine.split(':')[0].length < 40) {
      const [heading, ...rest] = cleanLine.split(':');
      const content = rest.join(':').trim();
      
      formatted.push(
        <div key={index} className="mb-1.5">
          <span className="font-medium text-foreground">{heading}:</span>
          {content && <span className="text-muted-foreground ml-1">{content}</span>}
        </div>
      );
    } else if (cleanLine.startsWith('- ') || cleanLine.startsWith('• ')) {
      formatted.push(
        <div key={index} className="flex gap-2 mb-1 pl-2">
          <span className="text-primary">•</span>
          <span>{cleanLine.slice(2)}</span>
        </div>
      );
    } else {
      formatted.push(
        <p key={index} className="mb-1.5 leading-relaxed">
          {cleanLine}
        </p>
      );
    }
  });
  
  return formatted.length > 0 ? formatted : <span>{text}</span>;
};

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm FINNOLAN, your AI financial assistant. I can help you with:\n\n• Stock analysis and recommendations\n• Market trends and sentiment\n• Financial concepts explained simply\n• Investment strategies\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("en");
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleClearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: "Chat cleared. How can I help you?",
      timestamp: new Date(),
    }]);
  };

  const handlePlayVoice = async (messageId: string, text: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setPlayingMessageId(messageId);

      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text, language: voiceLanguage },
      });

      if (error) throw error;

      if (!data?.audioContent) {
        throw new Error("No audio content received");
      }

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), (c) => c.charCodeAt(0))],
        { type: "audio/mp3" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setPlayingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setPlayingMessageId(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error("Voice playback error:", error);
      setPlayingMessageId(null);
      toast({
        title: "Error",
        description: "Failed to generate voice output",
        variant: "destructive",
      });
    }
  };

  const streamChat = async (userMessages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: userMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Credits required",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to start stream");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      const assistantId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await streamChat([...messages, userMessage]);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  return (
    <Card className="flex flex-col h-[700px] overflow-hidden border-border/50 shadow-xl bg-gradient-to-b from-card to-card/95">
      {/* Header */}
      <CardHeader className="border-b border-border/50 py-4 px-6 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">FINNOLAN AI</h2>
              <p className="text-xs text-muted-foreground">Your Financial Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={voiceLanguage} onValueChange={setVoiceLanguage}>
              <SelectTrigger className="w-[100px] h-9 text-xs">
                <Volume2 className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-sm">
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={handleClearChat}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div className={cn(
                  "group relative max-w-[85%]",
                  message.role === "user" && "order-first"
                )}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/70 border border-border/50 rounded-bl-md"
                    )}
                  >
                    <div className="text-sm leading-relaxed">
                      {message.role === "assistant" 
                        ? (message.content ? formatMessageContent(message.content) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          ))
                        : message.content
                      }
                    </div>
                  </div>
                  
                  {/* Message actions */}
                  {message.role === "assistant" && message.content && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopyMessage(message.id, message.content)}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 mr-1" />
                        )}
                        {copiedMessageId === message.id ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handlePlayVoice(message.id, message.content)}
                        disabled={playingMessageId === message.id}
                      >
                        {playingMessageId === message.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        {playingMessageId === message.id ? "Playing..." : "Listen"}
                      </Button>
                      <span className="text-xs text-muted-foreground/60 ml-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  {message.role === "user" && (
                    <div className="text-right mt-1">
                      <span className="text-xs text-muted-foreground/60">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start animate-in fade-in-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted/70 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/50 p-4 bg-card/80 backdrop-blur-sm">
          {/* Suggested prompts - only show when chat is minimal */}
          {messages.length <= 2 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => handleSend(prompt.text)}
                  disabled={isLoading}
                  className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all text-left group"
                >
                  <prompt.icon className={cn("h-4 w-4 shrink-0", prompt.color)} />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                    {prompt.text}
                  </span>
                </button>
              ))}
            </div>
          )}
          
          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder="Ask about stocks, markets, or financial concepts..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !isLoading && handleSend(input)}
                className="pr-4 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={() => handleSend(input)} 
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
