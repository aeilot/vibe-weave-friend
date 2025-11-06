import { MessageCircle, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">群聊空间</h1>
          <Button
            size="icon"
            className="rounded-xl gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Groups List */}
      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-3 animate-fade-in">
          {groups.map((group, index) => (
            <Card
              key={group.id}
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
                    <span className="text-xs text-muted-foreground">
                      {group.time}
                    </span>
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
          ))}
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
