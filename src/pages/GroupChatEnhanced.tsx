import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  ArrowLeft, 
  Users, 
  Settings, 
  Smile, 
  Paperclip,
  Shield,
  Sparkles,
  Zap,
  MessageCircle,
  Plus,
  Trash2,
  Bot,
  Copy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { generateAIMemberResponse } from "@/ai";
import { db, type AIGroupMember, type GroupMessage as DBGroupMessage } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupSync } from "@/hooks/use-group-sync";

interface GroupMessage {
  id: string;
  content: string;
  sender: "user" | "ai" | "other";
  senderName: string;
  timestamp: Date;
  aiMemberId?: string;
  aiRole?: string;
  senderType?: string;
}

const aiRoles = [
  {
    id: "moderator",
    name: "调解员",
    icon: Shield,
    color: "text-primary",
    description: "帮助化解矛盾，维护群聊和谐",
    greeting: "我会帮助大家保持理性沟通",
  },
  {
    id: "guide",
    name: "话题引导者",
    icon: MessageCircle,
    color: "text-secondary",
    description: "引导有趣话题，激发讨论",
    greeting: "让我们聊点有意思的话题吧",
  },
  {
    id: "entertainer",
    name: "气氛活跃者",
    icon: Zap,
    color: "text-warning",
    description: "活跃气氛，增添趣味",
    greeting: "我会让群聊更加有趣",
  },
];

const GroupChatEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiMembers, setAIMembers] = useState<AIGroupMember[]>([]);
  const [group, setGroup] = useState<any>(null);
  const [showAddAIDialog, setShowAddAIDialog] = useState(false);
  const [newAIName, setNewAIName] = useState("");
  const [newAIRole, setNewAIRole] = useState("guide");
  const [newAIPersonality, setNewAIPersonality] = useState("");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [copiedGroupId, setCopiedGroupId] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle new messages from sync
  const handleNewMessages = useCallback((newMessages: DBGroupMessage[]) => {
    const formattedMessages: GroupMessage[] = newMessages.map(m => ({
      id: m.id,
      content: m.content,
      sender: m.senderType === "ai" ? "ai" : (m.userId === user?.id ? "user" : "other"),
      senderName: m.senderType === "ai" && m.aiMemberId 
        ? aiMembers.find(ai => ai.id === m.aiMemberId)?.name || "AI"
        : (m.userId === user?.id ? "你" : "其他用户"),
      timestamp: new Date(m.createdAt),
      aiMemberId: m.aiMemberId,
      senderType: m.senderType,
    }));
    
    setMessages(prev => [...prev, ...formattedMessages]);
  }, [user, aiMembers]);

  // Set up real-time sync
  useGroupSync({
    groupId: id || "",
    enabled: isSignedIn && !!id,
    onNewMessages: handleNewMessages,
    pollInterval: 5000, // Poll every 5 seconds
  });

  // Load group, AI members, and messages
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      // Load group
      const groupData = await db.getGroup(id);
      if (groupData) {
        setGroup(groupData);
      }

      // Load AI members
      const members = await db.getGroupAIMembers(id);
      setAIMembers(members);

      // Load messages
      const dbMessages = await db.getGroupMessages(id);
      const formattedMessages: GroupMessage[] = dbMessages.map(m => ({
        id: m.id,
        content: m.content,
        sender: m.senderType === "ai" ? "ai" : (m.userId === user?.id ? "user" : "other"),
        senderName: m.senderType === "ai" && m.aiMemberId 
          ? members.find(ai => ai.id === m.aiMemberId)?.name || "AI"
          : (m.userId === user?.id ? "你" : "其他用户"),
        timestamp: new Date(m.createdAt),
        aiMemberId: m.aiMemberId,
        senderType: m.senderType,
      }));
      setMessages(formattedMessages);
    };

    loadData();
  }, [id, user]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          setNotificationsEnabled(permission === "granted");
        });
      }
    }
  }, []);

  // Show notification for new messages
  useEffect(() => {
    if (!notificationsEnabled || !group) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender !== "user" && document.hidden) {
      new Notification(`${group.name} - ${lastMessage.senderName}`, {
        body: lastMessage.content.substring(0, 100),
        icon: "/icon-192x192.png",
        tag: `group-${id}`,
      });
    }
  }, [messages, notificationsEnabled, group, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAddAIMember = async () => {
    if (!id || !newAIName.trim()) return;

    try {
      const aiMember = await db.createAIGroupMember({
        groupId: id,
        name: newAIName,
        role: newAIRole,
        personality: newAIPersonality || undefined,
      });

      setAIMembers([...aiMembers, aiMember]);
      setNewAIName("");
      setNewAIRole("guide");
      setNewAIPersonality("");
      setShowAddAIDialog(false);

      // Add welcome message from new AI
      const roleInfo = aiRoles.find(r => r.id === newAIRole);
      const welcomeMessage = await db.createGroupMessage({
        groupId: id,
        aiMemberId: aiMember.id,
        content: `大家好！我是${aiMember.name}，${roleInfo?.description || "很高兴加入这个群聊"}！`,
        senderType: "ai",
      });

      setMessages([...messages, {
        id: welcomeMessage.id,
        content: welcomeMessage.content,
        sender: "ai",
        senderName: aiMember.name,
        timestamp: new Date(welcomeMessage.createdAt),
        aiMemberId: aiMember.id,
        aiRole: aiMember.role,
        senderType: "ai",
      }]);

      toast({
        title: "AI 成员已添加",
        description: `${aiMember.name} 已加入群聊`,
      });
    } catch (error) {
      console.error("Failed to add AI member:", error);
      toast({
        title: "添加失败",
        description: "无法添加 AI 成员",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAIMember = async (aiMemberId: string) => {
    try {
      await db.removeAIGroupMember(aiMemberId);
      setAIMembers(aiMembers.filter(ai => ai.id !== aiMemberId));
      
      toast({
        title: "AI 成员已移除",
        description: "AI 成员已从群聊中移除",
      });
    } catch (error) {
      console.error("Failed to remove AI member:", error);
      toast({
        title: "移除失败",
        description: "无法移除 AI 成员",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGroupName = async () => {
    if (!id || !editedGroupName.trim()) return;

    try {
      await db.updateGroup(id, { name: editedGroupName });
      setGroup({ ...group, name: editedGroupName });
      setShowSettingsDialog(false);
      
      toast({
        title: "群聊名称已更新",
        description: `群聊名称已更改为 "${editedGroupName}"`,
      });
    } catch (error) {
      console.error("Failed to update group name:", error);
      toast({
        title: "更新失败",
        description: "无法更新群聊名称",
        variant: "destructive",
      });
    }
  };

  const handleAddMemberToGroup = async () => {
    if (!id || !newMemberUserId.trim()) return;

    try {
      // In a real implementation, you'd validate the user ID first
      await db.addGroupMember({
        groupId: id,
        userId: newMemberUserId,
        role: "member",
      });
      
      setNewMemberUserId("");
      
      toast({
        title: "成员已添加",
        description: "新成员已加入群聊",
      });
    } catch (error) {
      console.error("Failed to add member:", error);
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "无法添加成员",
        variant: "destructive",
      });
    }
  };

  const handleCopyGroupId = async () => {
    if (!id) return;
    
    try {
      await navigator.clipboard.writeText(id);
      setCopiedGroupId(true);
      setTimeout(() => setCopiedGroupId(false), 2000);
      
      toast({
        title: "群聊 ID 已复制",
        description: "可以分享给好友加入群聊",
      });
    } catch (error) {
      console.error("Failed to copy group ID:", error);
      toast({
        title: "复制失败",
        description: "无法复制群聊 ID",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !id || !user) return;

    try {
      // Create user message
      const userMsg = await db.createGroupMessage({
        groupId: id,
        userId: user.id,
        content: inputValue,
        senderType: "user",
      });

      const newMessage: GroupMessage = {
        id: userMsg.id,
        content: inputValue,
        sender: "user",
        senderName: "你",
        timestamp: new Date(),
        senderType: "user",
      };

      setMessages([...messages, newMessage]);
      const messageToSend = inputValue;
      setInputValue("");

      // Check for @mentions of AI members
      const mentionedAIs: AIGroupMember[] = [];
      aiMembers.forEach(ai => {
        if (messageToSend.includes(`@${ai.name}`) || messageToSend.includes("@ai")) {
          mentionedAIs.push(ai);
        }
      });

      // If no specific AI mentioned but @ai used, use all active AIs
      if (messageToSend.includes("@ai") && mentionedAIs.length === 0) {
        mentionedAIs.push(...aiMembers.filter(ai => ai.isActive));
      }

      // Generate responses from mentioned AIs
      if (mentionedAIs.length > 0) {
        setIsLoading(true);
        try {
          const allMessages = [...messages, newMessage];
          const groupHistory = allMessages.map(m => ({
            sender: m.senderName,
            content: m.content,
            senderType: m.senderType || (m.sender === "ai" ? "ai" : "user"),
          }));

          for (const aiMember of mentionedAIs) {
            const aiContent = await generateAIMemberResponse(
              messageToSend,
              groupHistory,
              {
                name: aiMember.name,
                role: aiMember.role,
                personality: aiMember.personality,
              }
            );

            // Save AI response to database
            const aiMsg = await db.createGroupMessage({
              groupId: id,
              aiMemberId: aiMember.id,
              content: aiContent,
              senderType: "ai",
            });

            const aiResponse: GroupMessage = {
              id: aiMsg.id,
              content: aiContent,
              sender: "ai",
              senderName: aiMember.name,
              timestamp: new Date(),
              aiMemberId: aiMember.id,
              aiRole: aiMember.role,
              senderType: "ai",
            };
            
            setMessages((prev) => [...prev, aiResponse]);
            
            // Add to history for next AI if multiple AIs responding
            groupHistory.push({
              sender: aiMember.name,
              content: aiContent,
              senderType: "ai",
            });
          }
        } catch (error) {
          console.error("Failed to generate AI response:", error);
          toast({
            title: "AI 回复失败",
            description: error instanceof Error ? error.message : "请检查 API 配置",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "发送失败",
        description: "无法发送消息",
        variant: "destructive",
      });
    }
  };

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/group")}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{group.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {aiMembers.length} AI 成员
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Bot className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>AI 成员管理</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">当前 AI 成员</h3>
                    <Dialog open={showAddAIDialog} onOpenChange={setShowAddAIDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Plus className="w-4 h-4 mr-1" />
                          添加
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>添加 AI 成员</DialogTitle>
                          <DialogDescription>
                            为群聊添加一个新的 AI 助手
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="ai-name">AI 名称</Label>
                            <Input
                              id="ai-name"
                              placeholder="例如: 小助手"
                              value={newAIName}
                              onChange={(e) => setNewAIName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ai-role">AI 角色</Label>
                            <Select value={newAIRole} onValueChange={setNewAIRole}>
                              <SelectTrigger id="ai-role">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {aiRoles.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name} - {role.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ai-personality">
                              自定义个性（可选）
                            </Label>
                            <Textarea
                              id="ai-personality"
                              placeholder="描述 AI 的个性特点..."
                              value={newAIPersonality}
                              onChange={(e) => setNewAIPersonality(e.target.value)}
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleAddAIMember}
                            disabled={!newAIName.trim()}
                          >
                            添加 AI
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {aiMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      还没有 AI 成员，点击上方添加按钮创建
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {aiMembers.map((aiMember) => {
                        const roleInfo = aiRoles.find((r) => r.id === aiMember.role);
                        const Icon = roleInfo?.icon || Bot;
                        return (
                          <div
                            key={aiMember.id}
                            className="p-4 rounded-xl border bg-card"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{aiMember.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {roleInfo?.name || aiMember.role}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveAIMember(aiMember.id)}
                                className="rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {aiMember.personality && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {aiMember.personality.substring(0, 100)}
                                {aiMember.personality.length > 100 ? "..." : ""}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl"
                  onClick={() => {
                    setEditedGroupName(group?.name || "");
                    setShowSettingsDialog(true);
                  }}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>群聊设置</DialogTitle>
                  <DialogDescription>
                    管理群聊名称和成员
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Group Name Section */}
                  <div className="space-y-3">
                    <Label htmlFor="group-name">群聊名称</Label>
                    <div className="flex gap-2">
                      <Input
                        id="group-name"
                        placeholder="输入新的群聊名称"
                        value={editedGroupName}
                        onChange={(e) => setEditedGroupName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleUpdateGroupName}
                        disabled={!editedGroupName.trim() || editedGroupName === group?.name}
                      >
                        更新
                      </Button>
                    </div>
                  </div>

                  {/* Add Member Section */}
                  <div className="space-y-3">
                    <Label htmlFor="member-id">添加成员</Label>
                    <div className="flex gap-2">
                      <Input
                        id="member-id"
                        placeholder="输入用户 ID 或邮箱"
                        value={newMemberUserId}
                        onChange={(e) => setNewMemberUserId(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddMemberToGroup}
                        disabled={!newMemberUserId.trim()}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        添加
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      暂时需要手动输入用户 ID，未来版本将支持用户搜索
                    </p>
                  </div>

                  {/* Group Info */}
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-semibold">群聊信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">群聊 ID:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {id?.substring(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyGroupId}
                            className="h-8 w-8 p-0"
                          >
                            {copiedGroupId ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground">创建时间: {group?.createdAt ? new Date(group.createdAt).toLocaleDateString("zh-CN") : "未知"}</p>
                      <p className="text-muted-foreground">AI 成员: {aiMembers.length} 个</p>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">消息通知:</span>
                        <Badge variant={notificationsEnabled ? "default" : "secondary"}>
                          {notificationsEnabled ? "已启用" : "未启用"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-slide-up",
                message.sender === "user" && "flex-row-reverse"
              )}
            >
              {message.sender !== "user" && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {message.sender === "ai" ? (
                    <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <AvatarFallback className="bg-muted text-xs">
                      {message.senderName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}

              <div className="flex-1 flex flex-col gap-1">
                {message.sender !== "user" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {message.senderName}
                    </span>
                    {message.sender === "ai" && message.aiRole && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20"
                      >
                        {aiRoles.find((r) => r.id === message.aiRole)?.name}
                      </Badge>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 shadow-soft transition-smooth",
                    message.sender === "ai"
                      ? "bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
                      : message.sender === "user"
                      ? "gradient-primary text-white ml-auto"
                      : "bg-card"
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <span
                    className={cn(
                      "text-xs mt-1 block",
                      message.sender === "user"
                        ? "text-white/70"
                        : "text-muted-foreground"
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
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-muted text-xs">你</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 glass-effect border-t border-border px-4 py-4 shadow-elevated">
        <div className="max-w-lg mx-auto">
          {aiMembers.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <p className="text-xs text-muted-foreground">快速提及:</p>
              {aiMembers.map((ai) => (
                <Button
                  key={ai.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputValue(inputValue + `@${ai.name} `)}
                  className="rounded-lg text-xs h-7 px-2"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  @{ai.name}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputValue(inputValue + "@ai ")}
                className="rounded-lg text-xs h-7 px-2"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                @ai (所有)
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-xl">
                  <Smile className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <div className="grid grid-cols-8 gap-1 p-2">
                  {["😊", "😂", "🥰", "😍", "🤔", "👍", "👏", "🎉", 
                    "❤️", "💯", "🔥", "✨", "🌟", "💪", "🙏", "😎",
                    "😢", "😭", "😱", "😅", "🤗", "🤝", "👋", "💡",
                    "📚", "🎯", "🚀", "⭐", "🌈", "🎨", "🎵", "☕"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setInputValue(inputValue + emoji)}
                      className="text-2xl hover:bg-accent rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
              placeholder="输入消息... (使用 @AI名称 或 @ai)"
              disabled={isLoading}
              className="flex-1 rounded-xl border-border bg-background/50"
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="rounded-xl gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {isLoading ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChatEnhanced;
