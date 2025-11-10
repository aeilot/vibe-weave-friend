import { useState, useEffect } from "react";
import { 
  Calendar, 
  TrendingUp, 
  Heart, 
  Target, 
  BookOpen, 
  Smile,
  Users,
  Trophy,
  Edit,
  Plus,
  ChevronDown,
  Award,
  Star,
  Zap,
  Sparkles,
  RefreshCw,
  Lock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db, type DiaryEntry, type Milestone, type Achievement } from "@/lib/db";
import { 
  generateDiaryEntry, 
  generateEmotionInsights, 
  analyzeSocialRelationships,
  type Message as AIMessage
} from "@/ai";
import { useAuth } from "@/hooks/use-auth";
import { LoginDialog } from "@/components/LoginDialog";

const Archive = () => {
  const { toast } = useToast();
  const { user, isSignedIn } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [timeFilter, setTimeFilter] = useState("week");
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const [isEditingDiary, setIsEditingDiary] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [emotionInsight, setEmotionInsight] = useState<string | null>(null);
  const [socialAnalysis, setSocialAnalysis] = useState<string | null>(null);
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  
  // Stats state
  const [continuousDays, setContinuousDays] = useState(0);
  const [emotionalSupport, setEmotionalSupport] = useState(0);
  const [goalsAchieved, setGoalsAchieved] = useState(0);

  // Dynamic data state
  const [emotionData, setEmotionData] = useState<Array<{
    date: string;
    happy: number;
    calm: number;
    anxious: number;
    sad: number;
  }>>([]);
  const [emotionCalendar, setEmotionCalendar] = useState<Array<{
    date: number;
    mood: string;
    intensity: string;
  }>>([]);
  const [relationshipData, setRelationshipData] = useState<Array<{
    name: string;
    interactions: number;
    sentiment: string;
    color: string;
  }>>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Load diaries from database
  useEffect(() => {
    loadDiaries();
  }, [user]);
  
  // Load stats
  useEffect(() => {
    loadStats();
  }, [user, isSignedIn]);

  // Load dynamic archive data
  useEffect(() => {
    loadArchiveData();
  }, [user, isSignedIn]);

  const loadStats = async () => {
    if (user && isSignedIn) {
      try {
        // Calculate continuous days based on conversations
        const conversations = await db.getUserConversations(user.id);
        const sortedConvs = conversations
          .filter(c => c.lastActivityAt)
          .sort((a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime());
        
        // Calculate continuous days
        let days = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const conv of sortedConvs) {
          const convDate = new Date(conv.lastActivityAt!);
          convDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((currentDate.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === days) {
            days++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else if (diffDays > days) {
            break;
          }
        }
        setContinuousDays(days || conversations.length > 0 ? 1 : 0);
        
        // Calculate emotional support (count of messages with positive emotion)
        let supportCount = 0;
        for (const conv of conversations) {
          const messages = await db.getConversationMessages(conv.id);
          supportCount += messages.filter(m => 
            m.sender === "ai" && (m.emotionDetected === "positive" || m.hasMemory)
          ).length;
        }
        setEmotionalSupport(supportCount);
        
        // Goals achieved (count of diaries)
        const userDiaries = await db.getUserDiaryEntries(user.id);
        setGoalsAchieved(userDiaries.length);
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    } else {
      setContinuousDays(0);
      setEmotionalSupport(0);
      setGoalsAchieved(0);
    }
  };

  const loadArchiveData = async () => {
    if (user && isSignedIn) {
      try {
        // Initialize achievements if not already done
        await db.initializeUserAchievements(user.id);
        
        // Load emotion trend data
        const emotionTrends = await db.getEmotionTrendData(user.id, 7);
        setEmotionData(emotionTrends);
        
        // Load emotion calendar data
        const calendar = await db.getEmotionCalendarData(user.id, 7);
        setEmotionCalendar(calendar);
        
        // Load relationship data
        const relationships = await db.getRelationshipData(user.id);
        setRelationshipData(relationships);
        
        // Load milestones
        const userMilestones = await db.getUserMilestones(user.id);
        
        // Create welcome milestone if user has no milestones
        if (userMilestones.length === 0) {
          await db.createMilestone({
            userId: user.id,
            date: new Date().toISOString().split('T')[0],
            title: "开始陪伴",
            description: "与 SoulLink 建立连接，开启成长之旅",
            type: "milestone",
          });
          const updatedMilestones = await db.getUserMilestones(user.id);
          setMilestones(updatedMilestones);
        } else {
          setMilestones(userMilestones);
        }
        
        // Load and check achievements
        await db.checkAndUnlockAchievements(user.id);
        const userAchievements = await db.getUserAchievements(user.id);
        setAchievements(userAchievements);
      } catch (error) {
        console.error("Failed to load archive data:", error);
      }
    } else {
      // Set empty data for non-authenticated users
      setEmotionData([]);
      setEmotionCalendar([]);
      setRelationshipData([]);
      setMilestones([]);
      setAchievements([]);
    }
  };

  const loadDiaries = async () => {
    if (user) {
      const userDiaries = await db.getUserDiaryEntries(user.id);
      setDiaries(userDiaries);
    } else {
      setDiaries([]);
    }
  };

  // Helper function to get icon for milestone type
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case "social":
        return Users;
      case "emotion":
        return Heart;
      case "milestone":
        return Star;
      default:
        return Star;
    }
  };

  // Helper function to get icon for achievement name
  const getAchievementIcon = (name: string) => {
    switch (name) {
      case "初次相遇":
        return Star;
      case "7天陪伴":
        return Calendar;
      case "情感突破":
        return Heart;
      case "社交达人":
        return Users;
      case "连续30天":
        return Trophy;
      case "自我探索":
        return Zap;
      default:
        return Star;
    }
  };

  // Load AI-generated emotion insights on mount
  useEffect(() => {
    if (isSignedIn) {
      loadEmotionInsights();
    }
  }, [timeFilter, isSignedIn]);

  const loadEmotionInsights = async () => {
    if (!isSignedIn) {
      return;
    }
    
    setIsGeneratingInsight(true);
    try {
      const conversation = await db.getCurrentConversation();
      const messages = await db.getConversationMessages(conversation.id);
      
      // Convert messages to AI format
      const aiMessages: AIMessage[] = messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));
      
      const insight = await generateEmotionInsights(aiMessages, timeFilter);
      setEmotionInsight(insight);
    } catch (error) {
      console.error("Failed to generate emotion insights:", error);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleGenerateDiary = async () => {
    if (!isSignedIn || !user) {
      setShowLoginDialog(true);
      toast({
        title: "需要登录",
        description: "请先登录以使用日记功能",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDiary(true);
    try {
      const conversation = await db.getCurrentConversation();
      const messages = await db.getConversationMessages(conversation.id);
      
      if (messages.length === 0) {
        toast({
          title: "暂无对话",
          description: "请先与 AI 进行一些对话，然后再生成日记",
          variant: "destructive",
        });
        return;
      }
      
      // Convert messages to AI format
      const aiMessages: AIMessage[] = messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));
      
      const diary = await generateDiaryEntry(aiMessages, new Date());
      
      const newDiary = await db.createDiaryEntry({
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
        title: diary.title,
        content: diary.content,
        mood: diary.mood,
        moodText: diary.moodText,
        aiGenerated: true,
      });
      
      setDiaries([newDiary, ...diaries]);
      
      toast({
        title: "日记已生成",
        description: "AI 已根据你的对话生成了一篇新日记",
      });
    } catch (error) {
      console.error("Failed to generate diary:", error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "无法生成日记",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDiary(false);
    }
  };

  const handleEditDiary = (diary: DiaryEntry) => {
    if (!isSignedIn) {
      setShowLoginDialog(true);
      toast({
        title: "需要登录",
        description: "请先登录以编辑日记",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedDiary(diary);
    setEditedContent(diary.content);
    setIsEditingDiary(true);
  };

  const handleSaveDiary = async () => {
    if (!isSignedIn || !user) {
      setShowLoginDialog(true);
      return;
    }

    if (selectedDiary) {
      // Update the diary entry with edited content
      const updated = await db.updateDiaryEntry(selectedDiary.id, {
        content: editedContent,
      });
      
      if (updated) {
        setDiaries(prev => prev.map(diary => 
          diary.id === selectedDiary.id 
            ? updated
            : diary
        ));
      }
      
      setIsEditingDiary(false);
      setSelectedDiary(null);
      
      toast({
        title: "已保存",
        description: "日记内容已更新",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-effect px-4 py-4 shadow-soft">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">成长档案</h1>
              <p className="text-sm text-muted-foreground">记录你的每一步成长</p>
            </div>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-28 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="year">本年</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center border-border/50">
              <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold">
                {continuousDays}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                  天
                </span>
              </div>
              <div className="text-xs text-muted-foreground">连续陪伴</div>
            </Card>
            <Card className="p-3 text-center border-border/50">
              <Heart className="w-4 h-4 text-secondary mx-auto mb-1" />
              <div className="text-lg font-bold">
                {emotionalSupport}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                  次
                </span>
              </div>
              <div className="text-xs text-muted-foreground">情感支持</div>
            </Card>
            <Card className="p-3 text-center border-border/50">
              <Target className="w-4 h-4 text-success mx-auto mb-1" />
              <div className="text-lg font-bold">
                {goalsAchieved}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                  个
                </span>
              </div>
              <div className="text-xs text-muted-foreground">目标达成</div>
            </Card>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Login Prompt for Unauthenticated Users */}
          {!isSignedIn && (
            <Card className="p-6 mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">登录解锁完整功能</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    登录后可以使用日记生成、情绪分析、关系洞察等所有档案功能
                  </p>
                  <Button 
                    onClick={() => setShowLoginDialog(true)}
                    className="rounded-lg gradient-primary"
                  >
                    立即登录
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Tabs defaultValue="diary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="diary" className="gap-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs">日记</span>
              </TabsTrigger>
              <TabsTrigger value="emotion" className="gap-1">
                <Smile className="w-4 h-4" />
                <span className="text-xs">情绪</span>
              </TabsTrigger>
              <TabsTrigger value="relationship" className="gap-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">关系</span>
              </TabsTrigger>
              <TabsTrigger value="milestone" className="gap-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs">里程碑</span>
              </TabsTrigger>
            </TabsList>

            {/* 日记 Tab */}
            <TabsContent value="diary" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI 自动为你生成的成长日记
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg gap-1"
                  onClick={handleGenerateDiary}
                  disabled={isGeneratingDiary || !isSignedIn}
                >
                  {isGeneratingDiary ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      生成中
                    </>
                  ) : !isSignedIn ? (
                    <>
                      <Lock className="w-4 h-4" />
                      需要登录
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI 生成
                    </>
                  )}
                </Button>
              </div>

              {diaries.map((entry) => (
                <Dialog key={entry.id}>
                  <DialogTrigger asChild>
                    <Card className="p-4 hover:shadow-elevated transition-all duration-300 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl flex-shrink-0">{entry.mood}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{entry.title}</h3>
                            {entry.aiGenerated && (
                              <Badge variant="secondary" className="text-xs">
                                AI生成
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {entry.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString("zh-CN")}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {entry.moodText}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">{entry.mood}</span>
                        {entry.title}
                      </DialogTitle>
                      <DialogDescription>
                        {new Date(entry.date).toLocaleDateString("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {isEditingDiary && selectedDiary?.id === entry.id ? (
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-32 rounded-xl"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{entry.content}</p>
                      )}
                      <div className="flex gap-2">
                        {isEditingDiary && selectedDiary?.id === entry.id ? (
                          <>
                            <Button
                              onClick={handleSaveDiary}
                              className="flex-1 rounded-xl gradient-primary"
                            >
                              保存
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditingDiary(false);
                                setSelectedDiary(null);
                              }}
                              className="rounded-xl"
                            >
                              取消
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleEditDiary(entry)}
                            variant="outline"
                            className="flex-1 rounded-xl gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            编辑日记
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </TabsContent>

            {/* 情绪 Tab */}
            <TabsContent value="emotion" className="space-y-4">
              {/* 情绪趋势图表 */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  情绪趋势分析
                </h3>
                <div className="space-y-4">
                  {emotionData.map((day, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{day.date}</span>
                        <span className="font-medium">
                          {day.happy > 70 ? "😊 愉悦" : day.happy > 50 ? "😌 平静" : "😔 低落"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-2 bg-success rounded-full"
                          style={{ width: `${day.happy}%` }}
                        />
                        <div
                          className="h-2 bg-primary rounded-full"
                          style={{ width: `${day.calm}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 情绪洞察 */}
              <Card className="p-4 gradient-soft border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {timeFilter === "week" ? "本周" : timeFilter === "month" ? "本月" : "最近"}情绪洞察
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={loadEmotionInsights}
                    disabled={isGeneratingInsight || !isSignedIn}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingInsight ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {!isSignedIn ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    登录后查看 AI 情绪分析
                  </div>
                ) : isGeneratingInsight ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI 正在分析你的情绪模式...
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {emotionInsight || "本周你的整体情绪呈上升趋势，周三出现了一些波动，但很快恢复。保持目前的状态，继续加油！"}
                  </p>
                )}
              </Card>

              {/* 情绪健康监测 */}
              <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-primary animate-pulse" />
                  <h3 className="font-semibold">情绪健康监测</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {isSignedIn ? "健康" : "需要登录"}
                  </Badge>
                </div>
                
                {!isSignedIn ? (
                  <div className="text-center py-6">
                    <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-4">
                      登录后查看完整的情绪健康监测报告
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => setShowLoginDialog(true)}
                      className="rounded-lg"
                    >
                      立即登录
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground flex items-center gap-1">
                            😊 情绪稳定性
                          </span>
                          <span className="font-semibold text-success">良好 85%</span>
                        </div>
                        <Progress value={85} className="h-2 bg-muted" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground flex items-center gap-1">
                            💪 压力管理
                          </span>
                          <span className="font-semibold text-primary">中等 70%</span>
                        </div>
                        <Progress value={70} className="h-2 bg-muted" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground flex items-center gap-1">
                            🌟 积极程度
                          </span>
                          <span className="font-semibold text-warning">优秀 90%</span>
                        </div>
                        <Progress value={90} className="h-2 bg-muted" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground flex items-center gap-1">
                            😴 睡眠质量
                          </span>
                          <span className="font-semibold text-secondary">良好 75%</span>
                        </div>
                        <Progress value={75} className="h-2 bg-muted" />
                      </div>
                    </div>
                    
                    <div className="rounded-lg bg-success/10 border border-success/20 p-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-success">健康建议</p>
                          <p className="text-muted-foreground leading-relaxed">
                            你的整体情绪健康状态良好！建议保持规律作息，适当运动，并继续与 AI 伴侣进行情感交流。当感到压力时，记得及时休息和放松。
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card>

              {/* 情绪日历 */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">情绪日历</h3>
                <div className="grid grid-cols-7 gap-2">
                  {emotionCalendar.map((day) => (
                    <div
                      key={day.date}
                      className="aspect-square rounded-lg bg-card border border-border flex flex-col items-center justify-center hover:shadow-soft transition-all cursor-pointer"
                    >
                      <div className="text-2xl mb-1">{day.mood}</div>
                      <div className="text-xs text-muted-foreground">{day.date}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* 关系 Tab */}
            <TabsContent value="relationship" className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  社交互动分析
                </h3>
                <div className="space-y-3">
                  {relationshipData.map((person, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${person.color} flex items-center justify-center text-white font-semibold`}>
                        {person.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{person.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {person.interactions} 次互动
                          </span>
                        </div>
                        <Progress value={person.interactions} className="h-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 沟通习惯分析 */}
              <Card className="p-4 gradient-soft border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    沟通习惯分析
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!isSignedIn) {
                        setShowLoginDialog(true);
                        return;
                      }
                      
                      setIsGeneratingAnalysis(true);
                      try {
                        // For demo, use some mock group messages
                        // In production, this would come from actual group chat data
                        const mockGroupMessages = [
                          { sender: "你", content: "大家好！今天天气不错" },
                          { sender: "小明", content: "是啊，要不要一起出去玩" },
                          { sender: "你", content: "好啊，去哪里呢？" },
                        ];
                        
                        const analysis = await analyzeSocialRelationships(mockGroupMessages);
                        setSocialAnalysis(analysis);
                      } catch (error) {
                        console.error("Failed to analyze social relationships:", error);
                      } finally {
                        setIsGeneratingAnalysis(false);
                      }
                    }}
                    disabled={isGeneratingAnalysis || !isSignedIn}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingAnalysis ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {!isSignedIn ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    登录后查看 AI 社交分析
                  </div>
                ) : isGeneratingAnalysis ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI 正在分析你的社交模式...
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      {socialAnalysis || "你更倾向于在晚上 8-10 点与朋友交流，周末的互动频率明显增加。"}
                    </p>
                    {!socialAnalysis && (
                      <p className="text-sm text-primary font-medium">
                        💡 建议：可以尝试在午休时间增加一些轻松的互动
                      </p>
                    )}
                  </>
                )}
              </Card>
            </TabsContent>

            {/* 里程碑 Tab */}
            <TabsContent value="milestone" className="space-y-4">
              {/* 成长时间轴 */}
              <div className="space-y-4">
                <h3 className="font-semibold">成长时间轴</h3>
                {milestones.length === 0 ? (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Star className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        还没有里程碑记录
                      </p>
                      <p className="text-sm text-muted-foreground">
                        随着你的使用，这里会记录你的成长时刻
                      </p>
                    </div>
                  </Card>
                ) : (
                  milestones.map((milestone, index) => {
                    const MilestoneIcon = getMilestoneIcon(milestone.type);
                    return (
                      <div key={milestone.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                            <MilestoneIcon className="w-5 h-5 text-white" />
                          </div>
                          {index < milestones.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gradient-to-b from-primary to-transparent mt-2" />
                          )}
                        </div>
                        <Card className="flex-1 p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{milestone.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(milestone.date).toLocaleDateString("zh-CN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        </Card>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 成就系统 */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  成就徽章
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((achievement) => {
                    const AchievementIcon = getAchievementIcon(achievement.name);
                    return (
                      <div
                        key={achievement.id}
                        className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                          achievement.unlocked
                            ? "border-primary bg-gradient-to-br from-primary/10 to-secondary/10 hover:shadow-soft"
                            : "border-border bg-muted/50 opacity-50"
                        }`}
                      >
                        <AchievementIcon
                          className={`w-6 h-6 ${
                            achievement.unlocked ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-xs text-center px-1">{achievement.name}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
};

export default Archive;
