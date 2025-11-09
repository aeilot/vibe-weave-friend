import { useState, useEffect } from "react";
import { Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, User, Cpu, Eye, EyeOff, Brain, Sparkles, Lightbulb, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getDefaultPersonality, generatePersonalitySuggestions, type PersonalityConfig, type Message as AIMessage } from "@/ai";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { LoginDialog } from "@/components/LoginDialog";

interface ApiConfig {
  apiKey: string;
  apiEndpoint: string;
  model: string;
}

interface AdminConfig {
  forceApi: boolean;
  forcedApiKey?: string;
  forcedApiEndpoint?: string;
  forcedModel?: string;
  useLocalProgram: boolean;
  localProgramUrl?: string;
}

const menuItems = [
  {
    icon: User,
    label: "个人信息",
    description: "管理你的个人资料",
  },
  {
    icon: Bell,
    label: "通知设置",
    description: "消息提醒偏好",
  },
  {
    icon: Shield,
    label: "隐私与安全",
    description: "保护你的数据",
  },
  {
    icon: HelpCircle,
    label: "帮助与反馈",
    description: "获取帮助或提供建议",
  },
];

const Profile = () => {
  const { toast } = useToast();
  const { user, isSignedIn, signOut } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isPersonalityDialogOpen, setIsPersonalityDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdminApiKey, setShowAdminApiKey] = useState(false);
  const [personalitySuggestions, setPersonalitySuggestions] = useState<{ suggestions: string[]; explanation: string } | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiKey: "",
    apiEndpoint: "https://api.openai.com/v1",
    model: "gpt-3.5-turbo",
  });

  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    forceApi: false,
    useLocalProgram: false,
  });

  const [personalityConfig, setPersonalityConfig] = useState<PersonalityConfig>(() => {
    const saved = localStorage.getItem("personalityConfig");
    if (saved) {
      return JSON.parse(saved);
    }
    return getDefaultPersonality();
  });

  // Load configs from localStorage and database on mount
  useEffect(() => {
    const loadConfigs = async () => {
      const savedAdminConfig = localStorage.getItem("adminConfig");
      
      if (savedAdminConfig) {
        setAdminConfig(JSON.parse(savedAdminConfig));
      }

      // Load API config from database if user is logged in
      if (user) {
        try {
          const settings = await db.getUserSettings(user.id);
          if (settings) {
            setApiConfig({
              apiKey: settings.apiKey || "",
              apiEndpoint: settings.apiEndpoint || "https://api.openai.com/v1",
              model: settings.model || "gpt-3.5-turbo",
            });
          } else {
            // Fallback to localStorage for backward compatibility
            const savedApiConfig = localStorage.getItem("userApiConfig");
            if (savedApiConfig) {
              const config = JSON.parse(savedApiConfig);
              setApiConfig(config);
              // Migrate to database
              await db.createUserSettings({
                userId: user.id,
                apiKey: config.apiKey,
                apiEndpoint: config.apiEndpoint,
                model: config.model,
              });
            }
          }
        } catch (error) {
          console.error("Failed to load user settings:", error);
          // Fallback to localStorage
          const savedApiConfig = localStorage.getItem("userApiConfig");
          if (savedApiConfig) {
            setApiConfig(JSON.parse(savedApiConfig));
          }
        }
      } else {
        // Guest mode: use localStorage
        const savedApiConfig = localStorage.getItem("userApiConfig");
        if (savedApiConfig) {
          setApiConfig(JSON.parse(savedApiConfig));
        }
      }
    };
    
    loadConfigs();
  }, [user]);

  // Load user stats
  useEffect(() => {
    const loadUserStats = async () => {
      if (user) {
        const conversations = await db.getUserConversations(user.id);
        setConversationCount(conversations.length);
        
        const groups = await db.getUserGroups(user.id);
        setGroupCount(groups.length);
      }
    };
    
    loadUserStats();
  }, [user]);

  const handleSaveApiConfig = async () => {
    if (user) {
      // Save to database for logged-in users
      try {
        await db.updateUserSettings(user.id, {
          apiKey: apiConfig.apiKey,
          apiEndpoint: apiConfig.apiEndpoint,
          model: apiConfig.model,
        });
        // Also save to localStorage for backward compatibility
        localStorage.setItem("userApiConfig", JSON.stringify(apiConfig));
        setIsApiDialogOpen(false);
        toast({
          title: "保存成功",
          description: "AI API 配置已保存到数据库",
        });
      } catch (error) {
        console.error("Failed to save user settings:", error);
        toast({
          title: "保存失败",
          description: "无法保存配置到数据库，已保存到本地",
          variant: "destructive",
        });
        // Fallback to localStorage
        localStorage.setItem("userApiConfig", JSON.stringify(apiConfig));
        setIsApiDialogOpen(false);
      }
    } else {
      // Guest mode: save to localStorage only
      localStorage.setItem("userApiConfig", JSON.stringify(apiConfig));
      setIsApiDialogOpen(false);
      toast({
        title: "保存成功",
        description: "AI API 配置已保存（访客模式仅保存到本地）",
      });
    }
  };

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

  const handleSaveAdminConfig = () => {
    localStorage.setItem("adminConfig", JSON.stringify(adminConfig));
    setIsAdminDialogOpen(false);
    toast({
      title: "管理员设置已更新",
      description: adminConfig.forceApi ? "已强制指定 API 配置" : "用户可自定义 API 配置",
    });
  };

  const handleToggleForceApi = (checked: boolean) => {
    setAdminConfig(prev => ({
      ...prev,
      forceApi: checked,
    }));
  };

  const handleToggleLocalProgram = (checked: boolean) => {
    setAdminConfig(prev => ({
      ...prev,
      useLocalProgram: checked,
    }));
  };

  const handleGetPersonalitySuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const conversation = await db.getCurrentConversation();
      const messages = await db.getConversationMessages(conversation.id);
      
      if (messages.length < 5) {
        toast({
          title: "对话太少",
          description: "请先与 AI 进行至少 5 次对话，以便生成个性化建议",
          variant: "destructive",
        });
        return;
      }
      
      // Convert messages to AI format
      const aiMessages: AIMessage[] = messages.map(m => ({
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">我的</h1>
          {/* <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-muted/50"
          >
            <Settings className="w-5 h-5" />
          </Button> */}
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* User Profile Card */}
          <Card className="p-6 shadow-elevated animate-fade-in">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <div className="w-full h-full gradient-primary flex items-center justify-center text-2xl font-bold text-white">
                  {isSignedIn && user ? user.name.charAt(0).toUpperCase() : "?"}
                </div>
                <AvatarFallback>User</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">
                  {isSignedIn && user ? user.name : "SoulLink 访客"}
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  {isSignedIn ? "已登录 · 积极成长中" : "未登录 · 体验模式"}
                </p>
                {!isSignedIn ? (
                  <Button
                    size="sm"
                    className="rounded-lg gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300"
                    onClick={() => setShowLoginDialog(true)}
                  >
                    立即登录
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                  >
                    完善资料
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 animate-slide-up">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {isSignedIn ? conversationCount : "0"}
              </div>
              <div className="text-xs text-muted-foreground">对话次数</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary mb-1">
                {isSignedIn ? groupCount : "0"}
              </div>
              <div className="text-xs text-muted-foreground">加入群聊</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-success mb-1">5</div>
              <div className="text-xs text-muted-foreground">成长记录</div>
            </Card>
          </div>

          {/* AI API Configuration - Only show if not forced by admin */}
          {!adminConfig.forceApi && (
            <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
              <DialogTrigger asChild>
                <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: "150ms" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-0.5">AI API 配置</h3>
                      <p className="text-xs text-muted-foreground">
                        配置你的 AI 接口信息
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>AI API 配置</DialogTitle>
                  <DialogDescription>
                    输入你的 AI 接口信息以使用自定义 AI 服务
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKey ? "text" : "password"}
                        value={apiConfig.apiKey}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="sk-..."
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiEndpoint">Base URL / API Endpoint</Label>
                    <Input
                      id="apiEndpoint"
                      value={apiConfig.apiEndpoint}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                    />
                    <p className="text-xs text-muted-foreground">
                      OpenAI base URL. For custom endpoints (e.g., Azure, local), change this value.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">模型</Label>
                    <Input
                      id="model"
                      value={apiConfig.model}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="gpt-3.5-turbo"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsApiDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSaveApiConfig}>
                    保存配置
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Personality Configuration */}
          <Dialog open={isPersonalityDialogOpen} onOpenChange={setIsPersonalityDialogOpen}>
            <DialogTrigger asChild>
              <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: "160ms" }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-0.5">AI 个性设置</h3>
                    <p className="text-xs text-muted-foreground">
                      自定义 AI 的个性和行为方式
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </DialogTrigger>
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

          {/* Admin Configuration */}
          <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
            <DialogTrigger asChild>
              <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer animate-slide-up border-amber-500/20" style={{ animationDelay: "175ms" }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-0.5">管理员设置</h3>
                    <p className="text-xs text-muted-foreground">
                      强制 API 配置和后台设置
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>管理员设置</DialogTitle>
                <DialogDescription>
                  配置系统级 API 设置，强制所有用户使用指定的 API
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>强制指定 API</Label>
                    <p className="text-xs text-muted-foreground">
                      开启后，用户无法自定义 API 配置
                    </p>
                  </div>
                  <Switch
                    checked={adminConfig.forceApi}
                    onCheckedChange={handleToggleForceApi}
                  />
                </div>
                
                {adminConfig.forceApi && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="adminApiKey">强制 API Key</Label>
                      <div className="relative">
                        <Input
                          id="adminApiKey"
                          type={showAdminApiKey ? "text" : "password"}
                          value={adminConfig.forcedApiKey || ""}
                          onChange={(e) => setAdminConfig(prev => ({ ...prev, forcedApiKey: e.target.value }))}
                          placeholder="sk-..."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowAdminApiKey(!showAdminApiKey)}
                        >
                          {showAdminApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminApiEndpoint">强制 Base URL / API Endpoint</Label>
                      <Input
                        id="adminApiEndpoint"
                        value={adminConfig.forcedApiEndpoint || ""}
                        onChange={(e) => setAdminConfig(prev => ({ ...prev, forcedApiEndpoint: e.target.value }))}
                        placeholder="https://api.openai.com/v1"
                      />
                      <p className="text-xs text-muted-foreground">
                        OpenAI base URL for all users
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminModel">强制模型</Label>
                      <Input
                        id="adminModel"
                        value={adminConfig.forcedModel || ""}
                        onChange={(e) => setAdminConfig(prev => ({ ...prev, forcedModel: e.target.value }))}
                        placeholder="gpt-3.5-turbo"
                      />
                    </div>
                  </>
                )}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <Label>使用本地程序接口</Label>
                      <p className="text-xs text-muted-foreground">
                        调用机器上的本地程序处理AI请求
                      </p>
                    </div>
                    <Switch
                      checked={adminConfig.useLocalProgram}
                      onCheckedChange={handleToggleLocalProgram}
                    />
                  </div>
                  
                  {adminConfig.useLocalProgram && (
                    <div className="space-y-2">
                      <Label htmlFor="localProgramUrl">本地程序URL</Label>
                      <Input
                        id="localProgramUrl"
                        value={adminConfig.localProgramUrl || ""}
                        onChange={(e) => setAdminConfig(prev => ({ ...prev, localProgramUrl: e.target.value }))}
                        placeholder="http://localhost:8080/api/chat"
                      />
                      <p className="text-xs text-muted-foreground">
                        输入本地程序的完整URL地址
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveAdminConfig}>
                  保存设置
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Menu Items */}
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
            {/* 个人信息 */}
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-0.5">个人信息</h3>
                      <p className="text-xs text-muted-foreground">
                        管理你的个人资料
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>个人信息</DialogTitle>
                  <DialogDescription>
                    通过 Clerk 管理你的账户信息
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {isSignedIn && user ? (
                    <>
                      <div className="space-y-2">
                        <Label>用户名</Label>
                        <Input value={user.name} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>邮箱</Label>
                        <Input value={user.email || "未设置"} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>用户ID</Label>
                        <Input value={user.id} disabled className="font-mono text-xs" />
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• 账户创建时间: {new Date(user.createdAt).toLocaleDateString("zh-CN")}</p>
                        <p>• 对话次数: {user.conversationCount}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        使用 Clerk SSO 管理。如需修改账户信息，请访问 Clerk 管理面板。
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        请先登录查看个人信息
                      </p>
                      <Button onClick={() => {
                        setIsProfileDialogOpen(false);
                        setShowLoginDialog(true);
                      }}>
                        立即登录
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* 通知设置 */}
            <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
              <DialogTrigger asChild>
                <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-0.5">通知设置</h3>
                      <p className="text-xs text-muted-foreground">
                        消息提醒偏好
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>通知设置</DialogTitle>
                  <DialogDescription>
                    自定义消息提醒和通知偏好
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>AI 消息提醒</Label>
                      <p className="text-xs text-muted-foreground">
                        收到 AI 回复时显示通知
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>群聊消息提醒</Label>
                      <p className="text-xs text-muted-foreground">
                        群组有新消息时提醒
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>主动关怀提醒</Label>
                      <p className="text-xs text-muted-foreground">
                        AI 主动发起对话时提醒
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>成就解锁提醒</Label>
                      <p className="text-xs text-muted-foreground">
                        解锁新成就时显示通知
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>声音提示</Label>
                      <p className="text-xs text-muted-foreground">
                        通知时播放提示音
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => {
                    setIsNotificationDialogOpen(false);
                    toast({
                      title: "设置已保存",
                      description: "通知设置已更新",
                    });
                  }}>
                    保存设置
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* 隐私与安全 */}
            <Dialog open={isPrivacyDialogOpen} onOpenChange={setIsPrivacyDialogOpen}>
              <DialogTrigger asChild>
                <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-0.5">隐私与安全</h3>
                      <p className="text-xs text-muted-foreground">
                        保护你的数据
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>隐私与安全</DialogTitle>
                  <DialogDescription>
                    了解我们如何保护你的数据和隐私
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">服务条款与隐私政策</h4>
                    <div className="rounded-lg border p-4 space-y-3 text-sm">
                      <div>
                        <p className="font-semibold mb-2">1. 数据收集与使用</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          • SoulLink 收集你的对话记录、个人资料和使用数据，用于提供个性化 AI 陪伴服务<br />
                          • 所有数据仅用于改善用户体验，不会出售或分享给第三方<br />
                          • 对话记录存储在你的浏览器本地或加密数据库中
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">2. 数据安全</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          • 使用 Clerk 企业级认证系统保护账户安全<br />
                          • 数据传输采用 HTTPS 加密<br />
                          • 定期进行安全审计和漏洞修复
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">3. 用户权利</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          • 你有权随时查看、修改或删除个人数据<br />
                          • 退出登录时，所有本地数据将被清除<br />
                          • 你可以要求导出或永久删除账户数据
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">4. Cookie 使用</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          • 使用 Cookie 来维持登录状态和个性化设置<br />
                          • 使用 localStorage 存储对话历史和用户偏好<br />
                          • 你可以通过浏览器设置管理 Cookie
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">5. AI 数据处理</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          • AI 对话可能通过 OpenAI API 处理<br />
                          • 对话数据遵循 OpenAI 的隐私政策<br />
                          • 敏感信息不应在对话中分享
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">6. 服务变更</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          • 我们保留随时修改服务条款的权利<br />
                          • 重大变更会提前通知用户<br />
                          • 继续使用服务即表示接受新条款
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">7. 联系方式</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          • 如有隐私问题或安全疑虑，请通过 GitHub Issues 联系我们<br />
                          • 项目地址: https://github.com/aeilot/soullink
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label>数据导出</Label>
                      <p className="text-xs text-muted-foreground">
                        导出你的所有对话和数据
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      导出数据
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* 帮助与反馈 */}
            <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
              <DialogTrigger asChild>
                <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-0.5">帮助与反馈</h3>
                      <p className="text-xs text-muted-foreground">
                        获取帮助或提供建议
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>帮助与反馈</DialogTitle>
                  <DialogDescription>
                    获取使用帮助或向我们提供反馈
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">常见问题</h4>
                    <div className="space-y-2 text-sm">
                      <details className="group">
                        <summary className="cursor-pointer font-medium hover:text-primary">
                          如何配置 AI API？
                        </summary>
                        <p className="text-muted-foreground text-xs mt-2 pl-4">
                          在个人中心点击"AI API 配置"，输入你的 OpenAI API Key、Base URL 和模型名称即可。
                        </p>
                      </details>
                      <details className="group">
                        <summary className="cursor-pointer font-medium hover:text-primary">
                          如何使用档案功能？
                        </summary>
                        <p className="text-muted-foreground text-xs mt-2 pl-4">
                          登录后进入档案页面，可以查看 AI 生成的日记、情绪分析、社交关系洞察等功能。
                        </p>
                      </details>
                      <details className="group">
                        <summary className="cursor-pointer font-medium hover:text-primary">
                          数据存储在哪里？
                        </summary>
                        <p className="text-muted-foreground text-xs mt-2 pl-4">
                          未登录时数据存储在浏览器 localStorage 中，登录后可选择存储到云端数据库。
                        </p>
                      </details>
                      <details className="group">
                        <summary className="cursor-pointer font-medium hover:text-primary">
                          如何自定义 AI 个性？
                        </summary>
                        <p className="text-muted-foreground text-xs mt-2 pl-4">
                          在个人中心点击"AI 个性设置"，可以自定义 AI 的名字、特质和系统提示词。
                        </p>
                      </details>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">项目信息</h4>
                    <div className="rounded-lg border p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">版本号</span>
                        <span className="font-mono">v1.0.0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">GitHub</span>
                        <a 
                          href="https://github.com/aeilot/soullink" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          aeilot/soullink
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">技术栈</span>
                        <span>React + TypeScript + Vite</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">反馈渠道</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => window.open("https://github.com/aeilot/soullink/issues", "_blank")}
                      >
                        <HelpCircle className="w-4 h-4 mr-2" />
                        在 GitHub 上提交 Issue
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => window.open("https://github.com/aeilot/soullink/discussions", "_blank")}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        参与 GitHub 讨论
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Logout Button */}
          {isSignedIn && (
            <Card 
              className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer border-destructive/20 animate-slide-up" 
              style={{ animationDelay: "300ms" }}
              onClick={async () => {
                await signOut();
                toast({
                  title: "已退出登录",
                  description: "你已成功退出登录",
                });
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">退出登录</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          )}

          {/* Version Info */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            SoulLink v1.0.0
          </div>
        </div>
      </main>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
};

export default Profile;
