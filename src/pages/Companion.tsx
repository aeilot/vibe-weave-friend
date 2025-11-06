import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const Companion = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "你好呀！我是你的智能伴侣，很高兴认识你。今天想聊些什么呢？",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        content: "我理解你的感受。让我们一起慢慢聊，我会一直陪着你。",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-soft animate-float">
                <Sparkles className="w-6 h-6 text-white animate-glow" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Soul</h1>
              <p className="text-xs text-muted-foreground">在线陪伴中</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-slide-up",
                message.sender === "user" && "flex-row-reverse"
              )}
            >
              {message.sender === "ai" && (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 shadow-soft transition-smooth",
                  message.sender === "ai"
                    ? "bg-card"
                    : "gradient-primary text-white"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span className={cn(
                  "text-xs mt-1 block",
                  message.sender === "ai" ? "text-muted-foreground" : "text-white/70"
                )}>
                  {message.timestamp.toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {message.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">你</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 glass-effect border-t border-border px-4 py-4 shadow-elevated">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="说说你的想法..."
            className="flex-1 rounded-xl border-border bg-background/50"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="rounded-xl gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300 hover:scale-105"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Companion;
