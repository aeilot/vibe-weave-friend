import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Mic, Settings, Smile, TrendingUp, Heart, Brain, Eye, EyeOff, Lightbulb, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  generateAIResponse, 
  generateSessionSummary, 
  decidePersonalityUpdate, 
  getDefaultPersonality,
  generatePersonalitySuggestions,
  type Message as AIMessage,
  type PersonalityConfig
} from "@/ai";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { backgroundTasks } from "@/lib/backgroundTasks";
import { useAuth } from "@/hooks/use-auth";
import { LoginDialog } from "@/components/LoginDialog";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  hasMemory?: boolean;
  memoryTag?: string;
  emotionDetected?: "positive" | "neutral" | "negative";
  isProactive?: boolean;
  messages?: string[]; // For split messages
}

const quickReplies = [
  "听你说说今天的事",
  "需要一些建议",
  "只是想聊聊天",
  "分享一个好消息",
];

const aiMoods = [
  { mood: "关怀", color: "text-primary", icon: Heart },
  { mood: "倾听", color: "text-secondary", icon: Sparkles },
  { mood: "陪伴", color: "text-success", icon: Smile },
];

const Companion = () => {
  const { toast } = useToast();
  const { isSignedIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [currentMood, setCurrentMood] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isPersonalityDialogOpen, setIsPersonalityDialogOpen] = useState(false);
  const [personalitySuggestions, setPersonalitySuggestions] = useState<{ suggestions: string[]; explanation: string } | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [emotionData, setEmotionData] = useState([
    { time: "8:00", score: 70 },
    { time: "12:00", score: 65 },
    { time: "16:00", score: 75 },
    { time: "20:00", score: 80 },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [personalityConfig, setPersonalityConfig] = useState<PersonalityConfig>(() => {
    const saved = localStorage.getItem("personalityConfig");
    if (saved) {
      return JSON.parse(saved);
    }
    return getDefaultPersonality();
  });

  // Load messages from database on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const conversation = await db.getCurrentConversation();
        const dbMessages = await db.getConversationMessages(conversation.id);

        if (dbMessages.length === 0) {
          // Create initial greeting message
          const greeting = await db.createMessage({
            content: "你好呀！我是你的智能伴侣Soul，很高兴认识你。今天想聊些什么呢？",
            sender: "ai",
            conversationId: conversation.id,
          });
          setMessages([{
            id: greeting.id,
            content: greeting.content,
            sender: greeting.sender as "user" | "ai",
            timestamp: new Date(greeting.createdAt),
          }]);
        } else {
          setMessages(dbMessages.map(m => ({
            id: m.id,
            content: m.content,
            sender: m.sender as "user" | "ai",
            timestamp: new Date(m.createdAt),
            hasMemory: m.hasMemory,
            memoryTag: m.memoryTag || undefined,
            emotionDetected: m.emotionDetected as "positive" | "neutral" | "negative" | undefined,
            isProactive: m.isProactive,
          })));
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast({
          title: "加载失败",
          description: "无法加载历史消息",
          variant: "destructive",
        });
      }
    };

    loadMessages();
  }, [toast]);

  // Start background tasks for proactive messaging
  useEffect(() => {
    backgroundTasks.start();

    // Listen for proactive messages
    const handleProactiveMessage = ((event: CustomEvent) => {
      const { message } = event.detail;
      // Reload messages to show the new proactive message
      const reloadMessages = async () => {
        const conversation = await db.getCurrentConversation();
        const dbMessages = await db.getConversationMessages(conversation.id);
        setMessages(dbMessages.map(m => ({
          id: m.id,
          content: m.content,
          sender: m.sender as "user" | "ai",
          timestamp: new Date(m.createdAt),
          hasMemory: m.hasMemory,
          memoryTag: m.memoryTag || undefined,
          emotionDetected: m.emotionDetected as "positive" | "neutral" | "negative" | undefined,
          isProactive: m.isProactive,
        })));

        toast({
          title: "收到主动消息",
          description: message.substring(0, 50) + "...",
        });
      };
      reloadMessages();
    }) as EventListener;

    window.addEventListener("proactive-message", handleProactiveMessage);

    return () => {
      window.removeEventListener("proactive-message", handleProactiveMessage);
      backgroundTasks.stop();
    };
  }, [toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMood((prev) => (prev + 1) % aiMoods.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePersonalityConfig = () => {
    localStorage.setItem("personalityConfig", JSON.stringify(personalityConfig));
    setIsPersonalityDialogOpen(false);
    toast({
      title: "个性设置已保存",
      description: "AI 个性配置已更新",
    });
  };

  const handleResetPersonality = () => {
    const defaultPersonality = getDefaultPersonality();
    setPersonalityConfig(defaultPersonality);
    localStorage.setItem("personalityConfig", JSON.stringify(defaultPersonality));
    toast({
      title: "已重置",
      description: "AI 个性已恢复为默认设置",
    });
  };

  const handleGetPersonalitySuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const conversation = await db.getCurrentConversation();
      const dbMessages = await db.getConversationMessages(conversation.id);
      
      if (dbMessages.length < 5) {
        toast({
          title: "对话太少",
          description: "请先与 AI 进行至少 5 次对话，以便生成个性化建议",
          variant: "destructive",
        });
        return;
      }
      
      const aiMessages: AIMessage[] = dbMessages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));
      
      const suggestions = await generatePersonalitySuggestions(
        aiMessages,
        personalityConfig
      );
      
      setPersonalitySuggestions(suggestions);
      
      toast({
        title: "建议已生成",
        description: "AI 已根据你的对话历史生成个性优化建议",
      });
    } catch (error) {
      console.error("Failed to generate personality suggestions:", error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "无法生成建议",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSend = async (content?: string) => {
    const messageContent = content || inputValue;
    if (!messageContent.trim()) return;

    // Check if user is signed in, if not show login dialog
    if (!isSignedIn) {
      setShowLoginDialog(true);
      toast({
        title: "请先登录",
        description: "登录后可以保存对话记录并使用更多功能",
        variant: "destructive",
      });
      return;
    }

    setInputValue("");
    setShowQuickReplies(false);
    setIsLoading(true);

    try {
      const conversation = await db.getCurrentConversation();
      const user = await db.getCurrentUser();

      // Create user message
      const userMessage = await db.createMessage({
        content: messageContent,
        sender: "user",
        conversationId: conversation.id,
        userId: user.id,
      });

      // Add to UI
      setMessages(prev => [...prev, {
        id: userMessage.id,
        content: userMessage.content,
        sender: "user",
        timestamp: new Date(userMessage.createdAt),
      }]);

      // Build conversation history for AI
      const conversationHistory: AIMessage[] = messages
        .slice(-10) // Use last 10 messages for context
        .map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content,
        }));

      // Get current personality or use saved/default
      const savedPersonality = localStorage.getItem("personalityConfig");
      const userPersonality = savedPersonality ? JSON.parse(savedPersonality) : getDefaultPersonality();
      const currentPersonality = conversation.currentPersonality
        ? { ...userPersonality, systemPrompt: conversation.currentPersonality }
        : userPersonality;

      // Generate AI response
      const aiResponse = await generateAIResponse(
        messageContent,
        conversationHistory,
        currentPersonality
      );

      // Handle split messages
      if (aiResponse.messages && aiResponse.messages.length > 1) {
        // Save and display each message separately
        for (const msg of aiResponse.messages) {
          const splitMessage = await db.createMessage({
            content: msg,
            sender: "ai",
            conversationId: conversation.id,
            hasMemory: aiResponse.hasMemory,
            memoryTag: aiResponse.memoryTag,
            emotionDetected: aiResponse.emotionDetected,
          });

          setMessages(prev => [...prev, {
            id: splitMessage.id,
            content: splitMessage.content,
            sender: "ai",
            timestamp: new Date(splitMessage.createdAt),
            hasMemory: splitMessage.hasMemory,
            memoryTag: splitMessage.memoryTag || undefined,
            emotionDetected: splitMessage.emotionDetected as "positive" | "neutral" | "negative" | undefined,
          }]);

          // Small delay between messages for better UX
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        // Single message
        const aiMessage = await db.createMessage({
          content: aiResponse.content,
          sender: "ai",
          conversationId: conversation.id,
          hasMemory: aiResponse.hasMemory,
          memoryTag: aiResponse.memoryTag,
          emotionDetected: aiResponse.emotionDetected,
        });

        // Add to UI
        setMessages(prev => [...prev, {
          id: aiMessage.id,
          content: aiMessage.content,
          sender: "ai",
          timestamp: new Date(aiMessage.createdAt),
          hasMemory: aiMessage.hasMemory,
          memoryTag: aiMessage.memoryTag || undefined,
          emotionDetected: aiMessage.emotionDetected as "positive" | "neutral" | "negative" | undefined,
        }]);
      }

      // Save memory if tagged
      if (aiResponse.hasMemory && aiResponse.memoryTag) {
        await db.createMemory({
          content: messageContent,
          category: aiResponse.memoryTag,
          userId: user.id,
        });
      }

      // Get updated conversation
      const updatedConversation = await db.getConversation(conversation.id);
      const messageCount = updatedConversation?.messageCount || 0;

      // Auto-generate summary every 10 messages
      if (messageCount % 10 === 0 && messageCount > 0) {
        try {
          const allMessages = await db.getConversationMessages(conversation.id);
          const historyForSummary: AIMessage[] = allMessages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content,
          })) as AIMessage[];

          const summary = await generateSessionSummary(
            historyForSummary,
            conversation.summary
          );

          await db.updateConversation(conversation.id, {
            summary,
            title: summary.substring(0, 50),
          });

          toast({
            title: "会话已更新",
            description: `自动生成摘要: ${summary.substring(0, 50)}...`,
          });
        } catch (summaryError) {
          console.error("Failed to generate summary:", summaryError);
        }
      }

      // Check for personality update every 20 messages
      if (messageCount % 20 === 0 && messageCount >= 20) {
        try {
          const allMessages = await db.getConversationMessages(conversation.id);
          const historyForAnalysis: AIMessage[] = allMessages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content,
          })) as AIMessage[];

          const decision = await decidePersonalityUpdate(
            historyForAnalysis,
            currentPersonality,
            messageCount,
            conversation.summary || "新对话"
          );

          if (decision.shouldUpdate && decision.suggestedPersonality) {
            await db.updateConversation(conversation.id, {
              currentPersonality: decision.suggestedPersonality,
            });

            toast({
              title: "个性已自适应",
              description: `${decision.reason} (置信度: ${(decision.confidence * 100).toFixed(0)}%)`,
            });
          }
        } catch (personalityError) {
          console.error("Failed to check personality update:", personalityError);
        }
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "无法发送消息",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    // setIsRecording(!isRecording);
    toast({
      title: "Coming Soon",
      description: "语音输入功能即将上线，敬请期待！",
    });

    // 实际项目中这里会调用语音识别 API
    // if (!isRecording) {
    //   setTimeout(() => {
    //     // setIsRecording(false);
    //     // setInputValue("这是通过语音输入的内容");
    //   }, 200);
    // }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const CurrentMoodIcon = aiMoods[currentMood].icon;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-soft animate-float">
                <CurrentMoodIcon className="w-6 h-6 text-white animate-glow" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-background"></div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Soul</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <p className="text-xs text-muted-foreground">
                  {aiMoods[currentMood].mood}模式
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>情绪健康监测</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">今日情绪曲线</h3>
                    <div className="h-32 flex items-end gap-2">
                      {emotionData.map((data, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-lg gradient-primary transition-all"
                            style={{ height: `${data.score}%` }}
                          ></div>
                          <span className="text-xs text-muted-foreground">{data.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">主动关怀提醒</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          检测到你今天的情绪有些波动，记得好好休息哦
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          建议在 22:00 前入睡
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">情绪洞察</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">整体状态</span>
                        <span className="font-medium text-success">良好</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">压力指数</span>
                        <span className="font-medium text-warning">中等</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">睡眠质量</span>
                        <span className="font-medium text-primary">优秀</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl"
              onClick={() => setIsPersonalityDialogOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
          {messages.map((message) => (
            <div key={message.id}>
              <div
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
                <div className="flex-1 flex flex-col gap-2">
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-soft transition-smooth relative",
                      message.sender === "ai"
                        ? "bg-card"
                        : "gradient-primary text-white ml-auto"
                    )}
                  >
                    {message.hasMemory && message.sender === "ai" && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-2 -left-2 text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        💭 {message.memoryTag}
                      </Badge>
                    )}
                    {message.emotionDetected && message.sender === "ai" && (
                      <div className={cn(
                        "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs",
                        message.emotionDetected === "positive" && "bg-success/20 text-success",
                        message.emotionDetected === "negative" && "bg-destructive/20 text-destructive",
                        message.emotionDetected === "neutral" && "bg-muted text-muted-foreground"
                      )}>
                        {message.emotionDetected === "positive" && "😊"}
                        {message.emotionDetected === "negative" && "😔"}
                        {message.emotionDetected === "neutral" && "😐"}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span
                      className={cn(
                        "text-xs mt-1 block",
                        message.sender === "ai"
                          ? "text-muted-foreground"
                          : "text-white/70"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                {message.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/80 to-primary/80 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm shadow-soft">
                    你
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick Replies */}
      {showQuickReplies && messages.length <= 1 && (
        <div className="fixed bottom-32 left-0 right-0 px-4 pb-4 animate-slide-up">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              快捷回复
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickReply(reply)}
                  className="rounded-full text-xs shadow-soft hover:shadow-elevated transition-all duration-300"
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 glass-effect border-t border-border px-4 py-4 shadow-elevated">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant={isRecording ? "destructive" : "secondary"}
            size="icon"
            onClick={handleVoiceInput}
            className={cn(
              "rounded-xl transition-all duration-300",
              isRecording && "animate-pulse"
            )}
          >
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
            placeholder={isRecording ? "正在录音..." : "说说你的想法..."}
            disabled={isRecording || isLoading}
            className="flex-1 rounded-xl border-border bg-background/50"
          />
          <Button
            onClick={() => handleSend()}
            size="icon"
            disabled={!inputValue.trim() || isRecording || isLoading}
            className="rounded-xl gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />

      {/* Personality Settings Dialog */}
      <Dialog open={isPersonalityDialogOpen} onOpenChange={setIsPersonalityDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI 个性设置
            </DialogTitle>
            <DialogDescription>
              配置 AI 助手的名称、特质和系统提示词，打造专属于你的 AI 伴侣
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="personalityName">AI 名称</Label>
              <Input
                id="personalityName"
                value={personalityConfig.name}
                onChange={(e) => setPersonalityConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Soul"
              />
              <p className="text-xs text-muted-foreground">给你的 AI 助手起一个名字</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalityTraits">个性特质</Label>
              <Input
                id="personalityTraits"
                value={personalityConfig.traits.join(", ")}
                onChange={(e) => setPersonalityConfig(prev => ({ 
                  ...prev, 
                  traits: e.target.value.split(",").map(t => t.trim()).filter(t => t) 
                }))}
                placeholder="关怀, 倾听, 陪伴, 理解, 温暖"
              />
              <p className="text-xs text-muted-foreground">用逗号分隔多个特质</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">系统提示词</Label>
              <Textarea
                id="systemPrompt"
                value={personalityConfig.systemPrompt}
                onChange={(e) => setPersonalityConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="你是一个温暖、善解人意的AI伴侣助手..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                定义 AI 的行为方式、语气和对话风格。支持 Markdown 格式。
              </p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">提示词编写建议：</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>明确定义 AI 的角色和身份</li>
                    <li>说明 AI 应该如何回复（语气、风格、长度）</li>
                    <li>列出 AI 的主要特质和行为准则</li>
                    <li>指定特殊要求（如使用表情符号、记住信息等）</li>
                    <li>AI 会根据对话自动适应，但这是基础个性</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* AI Personality Suggestions */}
            <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-purple-500" />
                  <p className="font-semibold text-sm">AI 优化建议</p>
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGetPersonalitySuggestions}
                  disabled={isLoadingSuggestions}
                  className="h-7"
                >
                  {isLoadingSuggestions ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      分析中
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      获取建议
                    </>
                  )}
                </Button>
              </div>
              {personalitySuggestions ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {personalitySuggestions.explanation}
                  </p>
                  <ul className="space-y-1">
                    {personalitySuggestions.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-purple-500 font-bold">{index + 1}.</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  点击"获取建议"让 AI 根据你的对话历史分析并提供个性优化建议
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={handleResetPersonality}>
              重置为默认
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsPersonalityDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSavePersonalityConfig}>
                保存配置
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Companion;
