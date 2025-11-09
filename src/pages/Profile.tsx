import { useState, useEffect } from "react";
import { Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, User, Cpu, Eye, EyeOff, Brain, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getDefaultPersonality, type PersonalityConfig } from "@/ai";

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
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isPersonalityDialogOpen, setIsPersonalityDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdminApiKey, setShowAdminApiKey] = useState(false);

  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiKey: "",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
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

  // Load configs from localStorage on mount
  useEffect(() => {
    const savedApiConfig = localStorage.getItem("userApiConfig");
    const savedAdminConfig = localStorage.getItem("adminConfig");
    
    if (savedApiConfig) {
      setApiConfig(JSON.parse(savedApiConfig));
    }
    if (savedAdminConfig) {
      setAdminConfig(JSON.parse(savedAdminConfig));
    }
  }, []);

  const handleSaveApiConfig = () => {
    localStorage.setItem("userApiConfig", JSON.stringify(apiConfig));
    setIsApiDialogOpen(false);
    toast({
      title: "保存成功",
      description: "AI API 配置已保存",
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">我的</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-muted/50"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* User Profile Card */}
          <Card className="p-6 shadow-elevated animate-fade-in">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <div className="w-full h-full gradient-primary flex items-center justify-center text-2xl font-bold text-white">
                  你
                </div>
                <AvatarFallback>User</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">SoulLink 用户</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  已陪伴 7 天 · 积极成长中
                </p>
                <Button
                  size="sm"
                  className="rounded-lg gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300"
                >
                  完善资料
                </Button>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 animate-slide-up">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">24</div>
              <div className="text-xs text-muted-foreground">对话次数</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary mb-1">3</div>
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
                    <Label htmlFor="apiEndpoint">API Endpoint</Label>
                    <Input
                      id="apiEndpoint"
                      value={apiConfig.apiEndpoint}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                      placeholder="https://api.openai.com/v1/chat/completions"
                    />
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
                      <Label htmlFor="adminApiEndpoint">强制 API Endpoint</Label>
                      <Input
                        id="adminApiEndpoint"
                        value={adminConfig.forcedApiEndpoint || ""}
                        onChange={(e) => setAdminConfig(prev => ({ ...prev, forcedApiEndpoint: e.target.value }))}
                        placeholder="https://api.openai.com/v1/chat/completions"
                      />
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
            {menuItems.map((item, index) => (
              <Card
                key={index}
                className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-0.5">{item.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>

          {/* Logout Button */}
          <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer border-destructive/20 animate-slide-up" style={{ animationDelay: "300ms" }}>
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

          {/* Version Info */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            SoulLink v1.0.0
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
