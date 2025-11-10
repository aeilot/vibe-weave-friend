import { useState, useEffect } from "react";
import { MessageCircle, Users, Plus, ArrowRight, Search, UserPlus, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateGroupTopicSuggestions } from "@/ai";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { LoginDialog } from "@/components/LoginDialog";
import { db, type Group as GroupType } from "@/lib/db";

const staticGroups = [
  {
    id: "static-1",
    name: "工作小组",
    members: 5,
    lastMessage: "下周一开会讨论项目进度",
    time: "10:30",
    unread: 2,
  },
  {
    id: "static-2",
    name: "朋友聚会",
    members: 8,
    lastMessage: "周末去爬山吗？",
    time: "昨天",
    unread: 0,
  },
  {
    id: "static-3",
    name: "学习小组",
    members: 12,
    lastMessage: "今天的作业都完成了吗",
    time: "周三",
    unread: 5,
  },
];

const Group = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupType | typeof staticGroups[0] | null>(null);
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userGroups, setUserGroups] = useState<GroupType[]>([]);

  // Load user's groups
  useEffect(() => {
    const loadGroups = async () => {
      if (isSignedIn && user) {
        const groups = await db.getUserGroups(user.id);
        setUserGroups(groups);
      }
    };
    loadGroups();
  }, [isSignedIn, user]);

  // Use real groups if signed in, otherwise use static groups
  const displayGroups = isSignedIn ? userGroups : staticGroups.map(g => ({
    id: g.id,
    name: g.name,
    description: g.lastMessage,
    creatorId: undefined,
    lastMessageAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const filteredGroups = displayGroups.filter(group => {
    const searchLower = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(searchLower) ||
      group.description?.toLowerCase().includes(searchLower) ||
      group.id.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateGroup = async () => {
    if (!isSignedIn) {
      setShowLoginDialog(true);
      toast({
        title: "请先登录",
        description: "登录后可以创建群聊",
        variant: "destructive",
      });
      return;
    }

    if (newGroupName.trim()) {
      const group = await db.createGroup({
        name: newGroupName,
        description: newGroupDesc,
        creatorId: user?.id,
      });

      // Add creator as admin
      if (user) {
        await db.addGroupMember({
          groupId: group.id,
          userId: user.id,
          role: "admin",
        });
      }

      // Add a default AI assistant to the group
      await db.createAIGroupMember({
        groupId: group.id,
        name: "Soul",
        role: "guide",
        personality: "一个友好的话题引导者，帮助大家开启有趣的讨论。",
      });

      // Reload groups
      const groups = await db.getUserGroups(user!.id);
      setUserGroups(groups);

      setNewGroupName("");
      setNewGroupDesc("");
      setIsDialogOpen(false);
      toast({
        title: "群聊已创建",
        description: `"${newGroupName}" 创建成功！默认 AI 助手 Soul 已加入。`,
      });
    }
  };

  const handleGetTopicSuggestions = async (group: typeof groups[0]) => {
    setSelectedGroup(group);
    setLoadingSuggestions(true);
    try {
      const suggestions = await generateGroupTopicSuggestions(group.name);
      setTopicSuggestions(suggestions);
    } catch (error) {
      console.error("Failed to generate topic suggestions:", error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "无法生成话题建议",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">群聊空间</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  className="rounded-xl gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>创建新群聊</DialogTitle>
                  <DialogDescription>
                    创建一个新的群聊空间，邀请朋友加入
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">群聊名称</Label>
                    <Input
                      id="group-name"
                      placeholder="输入群聊名称..."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-desc">群聊简介（可选）</Label>
                    <Input
                      id="group-desc"
                      placeholder="输入群聊简介..."
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateGroup}
                      className="flex-1 rounded-xl gradient-primary"
                      disabled={!newGroupName.trim()}
                    >
                      创建群聊
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索群聊名称、描述或 ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-background/50 border-border"
            />
            {searchQuery && (
              <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                {filteredGroups.length} 个结果
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Groups List */}
      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
          {/* AI Topic Suggestions Section */}
          <Card className="p-4 gradient-soft border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">AI 话题建议</h3>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              让 AI 为你的群聊推荐有趣的话题
            </p>
            {selectedGroup && topicSuggestions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-primary mb-2">
                  为 "{selectedGroup.name}" 推荐的话题：
                </p>
                {topicSuggestions.map((topic, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm">{topic}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                点击下方群聊卡片右侧的 ✨ 图标获取话题建议
              </p>
            )}
          </Card>

          {filteredGroups.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">没有找到匹配的群聊</p>
            </Card>
          ) : (
            filteredGroups.map((group, index) => (
            <Card
              key={group.id}
              className="p-4 hover:shadow-elevated transition-all duration-300 animate-slide-up border-border/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="relative cursor-pointer"
                  onClick={() => {
                    if (!isSignedIn) {
                      setShowLoginDialog(true);
                      toast({
                        title: "请先登录",
                        description: "登录后可以查看群聊详情",
                        variant: "destructive",
                      });
                    } else {
                      navigate(`/group/${group.id}`);
                    }
                  }}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  {!isSignedIn && (staticGroups.find(g => g.id === group.id)?.unread || 0) > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">
                        {staticGroups.find(g => g.id === group.id)?.unread}
                      </span>
                    </div>
                  )}
                </div>
                
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (!isSignedIn) {
                      setShowLoginDialog(true);
                      toast({
                        title: "请先登录",
                        description: "登录后可以查看群聊详情",
                        variant: "destructive",
                      });
                    } else {
                      navigate(`/group/${group.id}`);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{group.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {!isSignedIn ? staticGroups.find(g => g.id === group.id)?.time : ""}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {!isSignedIn ? (staticGroups.find(g => g.id === group.id)?.members || 0) : 0} 人
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {group.description || (!isSignedIn ? staticGroups.find(g => g.id === group.id)?.lastMessage : "")}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetTopicSuggestions(group);
                  }}
                  disabled={loadingSuggestions}
                  className="rounded-xl flex-shrink-0"
                >
                  <Sparkles className={`w-5 h-5 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </Card>
            ))
          )}
        </div>

        {/* AI Assistant Card */}
        <div className="max-w-lg mx-auto mt-6">
          <Card className="p-6 gradient-soft border-primary/20 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">智能群聊助手</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  我可以帮助调节群聊气氛，化解冲突，让交流更顺畅
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate("/group-assistant-info")}
                  className="rounded-lg gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300"
                >
                  了解更多
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
};

export default Group;
