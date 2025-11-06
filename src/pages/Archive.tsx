import { Calendar, TrendingUp, Heart, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const stats = [
  {
    icon: Calendar,
    label: "连续陪伴",
    value: "7",
    unit: "天",
    color: "text-primary",
  },
  {
    icon: Heart,
    label: "情感支持",
    value: "24",
    unit: "次",
    color: "text-secondary",
  },
  {
    icon: Target,
    label: "目标达成",
    value: "3",
    unit: "个",
    color: "text-success",
  },
];

const growthRecords = [
  {
    date: "2024-01-15",
    title: "开始使用 SoulLink",
    description: "与 Soul 的第一次对话，分享了今天的心情",
    mood: "平静",
  },
  {
    date: "2024-01-18",
    title: "情绪突破",
    description: "成功处理了工作压力，找到了新的应对方法",
    mood: "积极",
  },
  {
    date: "2024-01-20",
    title: "社交进步",
    description: "在群聊中更积极地表达了自己的想法",
    mood: "自信",
  },
];

const Archive = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-6 shadow-soft">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-1">成长档案</h1>
          <p className="text-sm text-muted-foreground">记录你的每一步成长</p>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="p-4 text-center hover:shadow-elevated transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {stat.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {stat.unit}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Growth Trend */}
          <Card className="p-6 shadow-soft animate-slide-up" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold">情感状态趋势</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">整体情绪</span>
                  <span className="font-medium text-success">良好 ↑</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">社交活跃度</span>
                  <span className="font-medium text-primary">提升中 ↑</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">自我认知</span>
                  <span className="font-medium text-secondary">进步 ↑</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
            </div>
          </Card>

          {/* Growth Records */}
          <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
            <h2 className="text-lg font-semibold mb-4">成长记录</h2>
            <div className="space-y-3">
              {growthRecords.map((record, index) => (
                <Card
                  key={index}
                  className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer border-l-4 border-l-primary"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{record.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {record.mood}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {record.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Archive;
