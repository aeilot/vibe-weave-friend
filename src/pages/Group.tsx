import { useState } from "react";
import { MessageCircle, Users, Plus, ArrowRight, Search, UserPlus } from "lucide-react";
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

const groups = [
  {
    id: 1,
    name: "工作小组",
    members: 5,
    lastMessage: "下周一开会讨论项目进度",
    time: "10:30",
    unread: 2,
  },
  {
    id: 2,
    name: "朋友聚会",
    members: 8,
    lastMessage: "周末去爬山吗？",
    time: "昨天",
    unread: 0,
  },
  {
    id: 3,
    name: "学习小组",
    members: 12,
    lastMessage: "今天的作业都完成了吗",
    time: "周三",
    unread: 5,
  },
];

const Group = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      // TODO: 实际创建群聊的逻辑
      console.log("创建群聊:", newGroupName);
      setNewGroupName("");
      setIsDialogOpen(false);
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
              placeholder="搜索群聊..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-background/50 border-border"
            />
          </div>
        </div>
      </header>

      {/* Groups List */}
      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-3 animate-fade-in">
          {filteredGroups.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">没有找到匹配的群聊</p>
            </Card>
          ) : (
            filteredGroups.map((group, index) => (
            <Card
              key={group.id}
              onClick={() => navigate(`/group/${group.id}`)}
              className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer animate-slide-up border-border/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  {group.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">
                        {group.unread}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{group.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {group.time}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {group.members} 人
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {group.lastMessage}
                  </p>
                </div>
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
                  className="rounded-lg gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300"
                >
                  了解更多
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Group;
