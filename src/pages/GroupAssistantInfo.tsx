import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Bot, Shield, MessageCircle, Zap, Sparkles, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const GroupAssistantInfo = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "智能调解",
      description: "自动检测群聊中的冲突和紧张气氛，适时介入帮助化解矛盾，维护和谐的讨论氛围。",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: MessageCircle,
      title: "话题引导",
      description: "根据对话上下文智能推荐相关话题，在对话冷场时提出有趣的讨论点，保持群聊活跃。",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: Zap,
      title: "气氛活跃",
      description: "适时加入幽默和轻松的元素，调节群聊气氛，让讨论更加有趣和愉快。",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      icon: Heart,
      title: "情绪识别",
      description: "实时分析群聊情绪和氛围，提供情感支持，确保每个成员都感到被理解和尊重。",
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
  ];

  const useCases = [
    {
      title: "工作小组",
      description: "AI 调解员帮助团队保持专业讨论，化解意见分歧，提高协作效率。",
      example: "当讨论变得激烈时，AI 会提醒大家保持冷静，听取各方观点。",
    },
    {
      title: "朋友聚会",
      description: "AI 活跃者让聊天更有趣，提出好玩的话题，增进朋友间的互动。",
      example: "AI 会根据大家的兴趣，推荐周末活动或有趣的话题。",
    },
    {
      title: "学习小组",
      description: "AI 引导者帮助保持学习讨论的深度，提出发人深省的问题。",
      example: "AI 会引导大家深入探讨学习内容，提供不同的思考角度。",
    },
  ];

  const aiRoles = [
    {
      name: "调解员",
      icon: Shield,
      description: "专注于化解冲突，维护讨论和谐",
      capabilities: [
        "检测紧张气氛和潜在冲突",
        "提醒成员保持理性和尊重",
        "确保每个人的声音被听到",
        "引导建设性讨论",
      ],
    },
    {
      name: "话题引导者",
      icon: MessageCircle,
      description: "引导有趣话题，激发深度讨论",
      capabilities: [
        "根据上下文推荐相关话题",
        "提出启发性问题",
        "分享相关知识和观点",
        "保持对话活跃和有意义",
      ],
    },
    {
      name: "气氛活跃者",
      icon: Zap,
      description: "活跃气氛，让聊天更有趣",
      capabilities: [
        "适时加入幽默元素",
        "营造轻松愉快的氛围",
        "用积极态度影响群聊",
        "让每个人都感到放松",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/group")}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">智能群聊助手</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <Card className="p-6 gradient-soft border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-soft flex-shrink-0">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">让群聊更智能、更和谐</h2>
                <p className="text-muted-foreground mb-4">
                  智能群聊助手通过 AI 技术帮助调节群聊气氛、化解冲突、引导话题，让每次交流都更加顺畅和有意义。
                  您可以在一个群聊中添加多个 AI 助手，每个都有不同的角色和个性。
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    多 AI 支持
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="w-3 h-3" />
                    实时介入
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Heart className="w-3 h-3" />
                    情绪识别
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Core Features */}
          <section>
            <h2 className="text-xl font-bold mb-4">核心功能</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="p-5 hover:shadow-elevated transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* AI Roles */}
          <section>
            <h2 className="text-xl font-bold mb-4">AI 角色类型</h2>
            <div className="space-y-4">
              {aiRoles.map((role, index) => {
                const Icon = role.icon;
                return (
                  <Card
                    key={index}
                    className="p-5 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <div className="ml-16">
                      <h4 className="text-sm font-semibold mb-2">核心能力：</h4>
                      <ul className="space-y-1">
                        {role.capabilities.map((cap, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Use Cases */}
          <section>
            <h2 className="text-xl font-bold mb-4">应用场景</h2>
            <div className="space-y-4">
              {useCases.map((useCase, index) => (
                <Card
                  key={index}
                  className="p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <h3 className="font-semibold mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {useCase.description}
                  </p>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">示例：</span> {useCase.example}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* How to Use */}
          <section>
            <h2 className="text-xl font-bold mb-4">如何使用</h2>
            <Card className="p-6">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">创建或进入群聊</h3>
                    <p className="text-sm text-muted-foreground">
                      在群聊页面创建新群聊，或进入已有的群聊。
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">添加 AI 成员</h3>
                    <p className="text-sm text-muted-foreground">
                      点击群聊中的机器人图标，添加一个或多个 AI 助手。可以为每个 AI 选择角色和自定义个性。
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">@提及 AI</h3>
                    <p className="text-sm text-muted-foreground">
                      使用 @AI名称 来请求特定 AI 的帮助，或使用 @ai 来让所有 AI 参与讨论。
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">享受智能群聊</h3>
                    <p className="text-sm text-muted-foreground">
                      AI 会在需要时主动介入，帮助调节气氛、引导话题、化解冲突。
                    </p>
                  </div>
                </li>
              </ol>
            </Card>
          </section>

          {/* CTA */}
          <Card className="p-6 text-center gradient-soft border-primary/20">
            <h2 className="text-xl font-bold mb-2">准备好开始了吗？</h2>
            <p className="text-muted-foreground mb-4">
              创建您的第一个智能群聊，体验 AI 助手带来的全新交流方式！
            </p>
            <Button
              onClick={() => navigate("/group")}
              className="rounded-xl gradient-primary shadow-soft hover:shadow-elevated transition-all duration-300"
            >
              开始使用
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GroupAssistantInfo;
