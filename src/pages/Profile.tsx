import { Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
