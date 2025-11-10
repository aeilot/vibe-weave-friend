/**
 * Database service layer
 * This provides a unified interface for data persistence
 * Currently uses localStorage but follows Prisma schema structure
 * Can be easily replaced with actual Prisma client when backend is available
 */

export interface User {
  id: string;
  clerkId?: string;
  name: string;
  email?: string;
  conversationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  title?: string;
  userId: string;
  summary?: string; // Session summary
  messageCount: number;
  lastActivityAt?: Date;
  currentPersonality?: string; // Current personality prompt
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  sender: string; // "user" or "ai"
  conversationId: string;
  userId?: string;
  hasMemory: boolean;
  memoryTag?: string;
  emotionDetected?: string;
  isProactive?: boolean; // Mark proactive messages
  createdAt: Date;
}

export interface Memory {
  id: string;
  content: string;
  category?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  creatorId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string; // "admin" or "member"
  joinedAt: Date;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  moodText: string;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  userId: string;
  date: string;
  title: string;
  description: string;
  type: string; // "social", "emotion", "milestone"
  createdAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
  createdAt: Date;
}

class DatabaseService {
  private getFromStorage<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  // User operations
  async createUser(data: { name: string; email?: string; clerkId?: string }): Promise<User> {
    const users = this.getFromStorage<User>("users");
    const user: User = {
      id: this.generateId(),
      clerkId: data.clerkId,
      name: data.name,
      email: data.email,
      conversationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(user);
    this.saveToStorage("users", users);
    return user;
  }

  async getUserByClerkId(clerkId: string): Promise<User | null> {
    const users = this.getFromStorage<User>("users");
    return users.find(u => u.clerkId === clerkId) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = this.getFromStorage<User>("users");
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveToStorage("users", users);
    return users[index];
  }

  async getUser(id: string): Promise<User | null> {
    const users = this.getFromStorage<User>("users");
    return users.find(u => u.id === id) || null;
  }

  async getCurrentUser(): Promise<User> {
    const userId = localStorage.getItem("currentUserId");
    if (userId) {
      const user = await this.getUser(userId);
      if (user) return user;
    }
    
    // Create default user if none exists
    const user = await this.createUser({ name: "用户" });
    localStorage.setItem("currentUserId", user.id);
    return user;
  }

  // Conversation operations
  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const conversations = this.getFromStorage<Conversation>("conversations");
    const conversation: Conversation = {
      id: this.generateId(),
      title,
      userId,
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    conversations.push(conversation);
    this.saveToStorage("conversations", conversations);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const conversations = this.getFromStorage<Conversation>("conversations");
    return conversations.find(c => c.id === id) || null;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    const conversations = this.getFromStorage<Conversation>("conversations");
    const index = conversations.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveToStorage("conversations", conversations);
    return conversations[index];
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const conversations = this.getFromStorage<Conversation>("conversations");
    return conversations.filter(c => c.userId === userId);
  }

  async getCurrentConversation(): Promise<Conversation> {
    const conversationId = localStorage.getItem("currentConversationId");
    if (conversationId) {
      const conversation = await this.getConversation(conversationId);
      if (conversation) return conversation;
    }
    
    // Create new conversation for current user
    const user = await this.getCurrentUser();
    const conversation = await this.createConversation(user.id, "新对话");
    localStorage.setItem("currentConversationId", conversation.id);
    return conversation;
  }

  // Message operations
  async createMessage(data: {
    content: string;
    sender: string;
    conversationId: string;
    userId?: string;
    hasMemory?: boolean;
    memoryTag?: string;
    emotionDetected?: string;
    isProactive?: boolean;
  }): Promise<Message> {
    const messages = this.getFromStorage<Message>("messages");
    const message: Message = {
      id: this.generateId(),
      content: data.content,
      sender: data.sender,
      conversationId: data.conversationId,
      userId: data.userId,
      hasMemory: data.hasMemory || false,
      memoryTag: data.memoryTag,
      emotionDetected: data.emotionDetected,
      isProactive: data.isProactive,
      createdAt: new Date(),
    };
    messages.push(message);
    this.saveToStorage("messages", messages);
    
    // Update conversation message count and last activity
    const conversation = await this.getConversation(data.conversationId);
    if (conversation) {
      await this.updateConversation(data.conversationId, {
        messageCount: (conversation.messageCount || 0) + 1,
        lastActivityAt: new Date(),
      });
    }
    
    return message;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const messages = this.getFromStorage<Message>("messages");
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async deleteMessage(id: string): Promise<void> {
    const messages = this.getFromStorage<Message>("messages");
    this.saveToStorage("messages", messages.filter(m => m.id !== id));
  }

  // Memory operations
  async createMemory(data: {
    content: string;
    category?: string;
    userId?: string;
  }): Promise<Memory> {
    const memories = this.getFromStorage<Memory>("memories");
    const memory: Memory = {
      id: this.generateId(),
      content: data.content,
      category: data.category,
      userId: data.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memories.push(memory);
    this.saveToStorage("memories", memories);
    return memory;
  }

  async getUserMemories(userId: string): Promise<Memory[]> {
    const memories = this.getFromStorage<Memory>("memories");
    return memories.filter(m => m.userId === userId);
  }

  async getMemoriesByCategory(category: string, userId?: string): Promise<Memory[]> {
    const memories = this.getFromStorage<Memory>("memories");
    return memories.filter(m => 
      m.category === category && (!userId || m.userId === userId)
    );
  }

  // Group operations
  async createGroup(data: {
    name: string;
    description?: string;
    creatorId?: string;
  }): Promise<Group> {
    const groups = this.getFromStorage<Group>("groups");
    const group: Group = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      creatorId: data.creatorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    groups.push(group);
    this.saveToStorage("groups", groups);
    return group;
  }

  async getGroup(id: string): Promise<Group | null> {
    const groups = this.getFromStorage<Group>("groups");
    return groups.find(g => g.id === id) || null;
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group | null> {
    const groups = this.getFromStorage<Group>("groups");
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) return null;
    
    groups[index] = {
      ...groups[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveToStorage("groups", groups);
    return groups[index];
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const groupMembers = this.getFromStorage<GroupMember>("groupMembers");
    const userGroupIds = groupMembers
      .filter(m => m.userId === userId)
      .map(m => m.groupId);
    
    const groups = this.getFromStorage<Group>("groups");
    return groups.filter(g => userGroupIds.includes(g.id));
  }

  async deleteGroup(id: string): Promise<void> {
    const groups = this.getFromStorage<Group>("groups");
    this.saveToStorage("groups", groups.filter(g => g.id !== id));
    
    // Also delete group members and messages
    const groupMembers = this.getFromStorage<GroupMember>("groupMembers");
    this.saveToStorage("groupMembers", groupMembers.filter(m => m.groupId !== id));
    
    const groupMessages = this.getFromStorage<GroupMessage>("groupMessages");
    this.saveToStorage("groupMessages", groupMessages.filter(m => m.groupId !== id));
  }

  // Group Member operations
  async addGroupMember(data: {
    groupId: string;
    userId: string;
    role?: string;
  }): Promise<GroupMember> {
    const groupMembers = this.getFromStorage<GroupMember>("groupMembers");
    
    // Check if already a member
    const existing = groupMembers.find(
      m => m.groupId === data.groupId && m.userId === data.userId
    );
    if (existing) return existing;
    
    const member: GroupMember = {
      id: this.generateId(),
      groupId: data.groupId,
      userId: data.userId,
      role: data.role || "member",
      joinedAt: new Date(),
    };
    groupMembers.push(member);
    this.saveToStorage("groupMembers", groupMembers);
    return member;
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const groupMembers = this.getFromStorage<GroupMember>("groupMembers");
    return groupMembers.filter(m => m.groupId === groupId);
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    const groupMembers = this.getFromStorage<GroupMember>("groupMembers");
    this.saveToStorage(
      "groupMembers",
      groupMembers.filter(m => !(m.groupId === groupId && m.userId === userId))
    );
  }

  // Group Message operations
  async createGroupMessage(data: {
    groupId: string;
    userId: string;
    content: string;
  }): Promise<GroupMessage> {
    const groupMessages = this.getFromStorage<GroupMessage>("groupMessages");
    const message: GroupMessage = {
      id: this.generateId(),
      groupId: data.groupId,
      userId: data.userId,
      content: data.content,
      createdAt: new Date(),
    };
    groupMessages.push(message);
    this.saveToStorage("groupMessages", groupMessages);
    
    // Update group's last message time
    await this.updateGroup(data.groupId, {
      lastMessageAt: new Date(),
    });
    
    return message;
  }

  async getGroupMessages(groupId: string): Promise<GroupMessage[]> {
    const groupMessages = this.getFromStorage<GroupMessage>("groupMessages");
    return groupMessages
      .filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // UserSettings operations
  // SECURITY NOTE: API keys are stored in plain text in localStorage/database
  // This is necessary for the application to make API calls on behalf of users
  // For production deployments, consider implementing:
  // 1. Backend proxy pattern to avoid storing keys in frontend
  // 2. Encryption at rest with secure key management
  // 3. See SECURITY_API_KEYS.md for detailed recommendations
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const settings = this.getFromStorage<UserSettings>("userSettings");
    return settings.find(s => s.userId === userId) || null;
  }

  async createUserSettings(data: {
    userId: string;
    apiKey?: string;
    apiEndpoint?: string;
    model?: string;
  }): Promise<UserSettings> {
    const settings = this.getFromStorage<UserSettings>("userSettings");
    const newSettings: UserSettings = {
      id: this.generateId(),
      userId: data.userId,
      apiKey: data.apiKey, // Stored in plain text - see security note above
      apiEndpoint: data.apiEndpoint,
      model: data.model,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    settings.push(newSettings);
    this.saveToStorage("userSettings", settings);
    return newSettings;
  }

  async updateUserSettings(
    userId: string,
    updates: {
      apiKey?: string;
      apiEndpoint?: string;
      model?: string;
    }
  ): Promise<UserSettings | null> {
    const settings = this.getFromStorage<UserSettings>("userSettings");
    const index = settings.findIndex(s => s.userId === userId);
    
    if (index === -1) {
      // Create new settings if not exists
      return this.createUserSettings({ userId, ...updates });
    }
    
    settings[index] = {
      ...settings[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveToStorage("userSettings", settings);
    return settings[index];
  }

  async deleteUserSettings(userId: string): Promise<void> {
    const settings = this.getFromStorage<UserSettings>("userSettings");
    const filtered = settings.filter(s => s.userId !== userId);
    this.saveToStorage("userSettings", filtered);
  }

  // DiaryEntry operations
  async createDiaryEntry(data: {
    userId: string;
    date: string;
    title: string;
    content: string;
    mood: string;
    moodText: string;
    aiGenerated: boolean;
  }): Promise<DiaryEntry> {
    const diaries = this.getFromStorage<DiaryEntry>("diaryEntries");
    const diary: DiaryEntry = {
      id: this.generateId(),
      userId: data.userId,
      date: data.date,
      title: data.title,
      content: data.content,
      mood: data.mood,
      moodText: data.moodText,
      aiGenerated: data.aiGenerated,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    diaries.push(diary);
    this.saveToStorage("diaryEntries", diaries);
    return diary;
  }

  async getUserDiaryEntries(userId: string): Promise<DiaryEntry[]> {
    const diaries = this.getFromStorage<DiaryEntry>("diaryEntries");
    return diaries
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getDiaryEntry(id: string): Promise<DiaryEntry | null> {
    const diaries = this.getFromStorage<DiaryEntry>("diaryEntries");
    return diaries.find(d => d.id === id) || null;
  }

  async updateDiaryEntry(id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry | null> {
    const diaries = this.getFromStorage<DiaryEntry>("diaryEntries");
    const index = diaries.findIndex(d => d.id === id);
    if (index === -1) return null;
    
    diaries[index] = {
      ...diaries[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.saveToStorage("diaryEntries", diaries);
    return diaries[index];
  }

  async deleteDiaryEntry(id: string): Promise<void> {
    const diaries = this.getFromStorage<DiaryEntry>("diaryEntries");
    this.saveToStorage("diaryEntries", diaries.filter(d => d.id !== id));
  }

  // Milestone operations
  async createMilestone(data: {
    userId: string;
    date: string;
    title: string;
    description: string;
    type: string;
  }): Promise<Milestone> {
    const milestones = this.getFromStorage<Milestone>("milestones");
    const milestone: Milestone = {
      id: this.generateId(),
      userId: data.userId,
      date: data.date,
      title: data.title,
      description: data.description,
      type: data.type,
      createdAt: new Date(),
    };
    milestones.push(milestone);
    this.saveToStorage("milestones", milestones);
    return milestone;
  }

  async getUserMilestones(userId: string): Promise<Milestone[]> {
    const milestones = this.getFromStorage<Milestone>("milestones");
    return milestones
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async deleteMilestone(id: string): Promise<void> {
    const milestones = this.getFromStorage<Milestone>("milestones");
    this.saveToStorage("milestones", milestones.filter(m => m.id !== id));
  }

  // Achievement operations
  async createAchievement(data: {
    userId: string;
    name: string;
    description: string;
    unlocked?: boolean;
  }): Promise<Achievement> {
    const achievements = this.getFromStorage<Achievement>("achievements");
    const achievement: Achievement = {
      id: this.generateId(),
      userId: data.userId,
      name: data.name,
      description: data.description,
      unlocked: data.unlocked || false,
      unlockedAt: data.unlocked ? new Date() : undefined,
      createdAt: new Date(),
    };
    achievements.push(achievement);
    this.saveToStorage("achievements", achievements);
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const achievements = this.getFromStorage<Achievement>("achievements");
    return achievements.filter(a => a.userId === userId);
  }

  async unlockAchievement(userId: string, achievementName: string): Promise<Achievement | null> {
    const achievements = this.getFromStorage<Achievement>("achievements");
    const index = achievements.findIndex(a => a.userId === userId && a.name === achievementName);
    
    if (index === -1) return null;
    
    achievements[index] = {
      ...achievements[index],
      unlocked: true,
      unlockedAt: new Date(),
    };
    this.saveToStorage("achievements", achievements);
    return achievements[index];
  }

  // Analytics methods for Archive page
  async getEmotionTrendData(userId: string, days: number = 7): Promise<Array<{
    date: string;
    happy: number;
    calm: number;
    anxious: number;
    sad: number;
  }>> {
    const messages = this.getFromStorage<Message>("messages");
    const userConvs = await this.getUserConversations(userId);
    const convIds = userConvs.map(c => c.id);
    
    const userMessages = messages.filter(m => 
      convIds.includes(m.conversationId) && m.sender === "user"
    );
    
    const trends = [];
    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOfWeek = weekDays[date.getDay()];
      
      const dayMessages = userMessages.filter(m => {
        const msgDate = new Date(m.createdAt);
        return msgDate.toDateString() === date.toDateString();
      });
      
      // Calculate emotion scores based on message sentiment
      let happy = 50, calm = 50, anxious = 30, sad = 20;
      
      if (dayMessages.length > 0) {
        const positiveCount = dayMessages.filter(m => m.emotionDetected === "positive").length;
        const neutralCount = dayMessages.filter(m => m.emotionDetected === "neutral").length;
        const negativeCount = dayMessages.filter(m => m.emotionDetected === "negative").length;
        const total = dayMessages.length;
        
        if (total > 0) {
          happy = Math.round((positiveCount / total) * 100);
          calm = Math.round(((positiveCount + neutralCount) / total) * 80);
          anxious = Math.round((negativeCount / total) * 80);
          sad = Math.round((negativeCount / total) * 60);
        }
      }
      
      trends.push({ date: dayOfWeek, happy, calm, anxious, sad });
    }
    
    return trends;
  }

  async getEmotionCalendarData(userId: string, days: number = 7): Promise<Array<{
    date: number;
    mood: string;
    intensity: string;
  }>> {
    const messages = this.getFromStorage<Message>("messages");
    const userConvs = await this.getUserConversations(userId);
    const convIds = userConvs.map(c => c.id);
    
    const userMessages = messages.filter(m => 
      convIds.includes(m.conversationId) && m.sender === "user"
    );
    
    const calendar = [];
    const moodEmojis = {
      positive: "😊",
      neutral: "😌",
      negative: "😔",
      anxious: "😤",
    };
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      const dayMessages = userMessages.filter(m => {
        const msgDate = new Date(m.createdAt);
        return msgDate.toDateString() === date.toDateString();
      });
      
      let mood = "😌";
      let intensity = "medium";
      
      if (dayMessages.length > 0) {
        const positiveCount = dayMessages.filter(m => m.emotionDetected === "positive").length;
        const negativeCount = dayMessages.filter(m => m.emotionDetected === "negative").length;
        
        if (positiveCount > negativeCount && positiveCount > dayMessages.length / 2) {
          mood = moodEmojis.positive;
          intensity = "high";
        } else if (negativeCount > positiveCount) {
          mood = negativeCount > dayMessages.length / 2 ? moodEmojis.negative : moodEmojis.anxious;
          intensity = negativeCount > dayMessages.length / 2 ? "low" : "medium";
        } else {
          mood = moodEmojis.neutral;
          intensity = "medium";
        }
      }
      
      calendar.push({ date: i + 1, mood, intensity });
    }
    
    return calendar;
  }

  async getRelationshipData(userId: string): Promise<Array<{
    name: string;
    interactions: number;
    sentiment: string;
    color: string;
  }>> {
    const groupMembers = this.getFromStorage<GroupMember>("groupMembers");
    const groupMessages = this.getFromStorage<GroupMessage>("groupMessages");
    const users = this.getFromStorage<User>("users");
    
    const userGroups = groupMembers.filter(m => m.userId === userId).map(m => m.groupId);
    
    // Get all members from user's groups
    const otherMembers = groupMembers.filter(m => 
      userGroups.includes(m.groupId) && m.userId !== userId
    );
    
    // Count interactions per user
    const interactionMap = new Map<string, number>();
    
    for (const member of otherMembers) {
      const memberMessages = groupMessages.filter(m => 
        m.userId === member.userId && userGroups.includes(m.groupId)
      );
      interactionMap.set(member.userId, memberMessages.length);
    }
    
    // Get top 4 relationships
    const relationships = Array.from(interactionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([uid, count], index) => {
        const user = users.find(u => u.id === uid);
        const colors = ["bg-success", "bg-primary", "bg-warning", "bg-secondary"];
        
        return {
          name: user?.name || "用户",
          interactions: count,
          sentiment: count > 20 ? "positive" : count > 10 ? "neutral" : "positive",
          color: colors[index % colors.length],
        };
      });
    
    return relationships;
  }

  // Initialize default achievements for a user
  async initializeUserAchievements(userId: string): Promise<void> {
    const existing = await this.getUserAchievements(userId);
    if (existing.length > 0) return;
    
    const defaultAchievements = [
      { name: "初次相遇", description: "完成第一次对话" },
      { name: "7天陪伴", description: "连续使用7天" },
      { name: "情感突破", description: "进行深度情感对话" },
      { name: "社交达人", description: "参与群聊并积极互动" },
      { name: "连续30天", description: "连续使用30天" },
      { name: "自我探索", description: "写下10篇日记" },
    ];
    
    for (const achievement of defaultAchievements) {
      await this.createAchievement({
        userId,
        ...achievement,
        unlocked: false,
      });
    }
    
    // Check and unlock "初次相遇" if user has messages
    const conversations = await this.getUserConversations(userId);
    if (conversations.length > 0) {
      await this.unlockAchievement(userId, "初次相遇");
    }
  }

  // Check and unlock achievements based on user activity
  async checkAndUnlockAchievements(userId: string): Promise<string[]> {
    const unlocked: string[] = [];
    
    // Get user data
    const conversations = await this.getUserConversations(userId);
    const diaries = await this.getUserDiaryEntries(userId);
    const groups = await this.getUserGroups(userId);
    
    // Check "初次相遇"
    if (conversations.length > 0) {
      const result = await this.unlockAchievement(userId, "初次相遇");
      if (result) unlocked.push("初次相遇");
    }
    
    // Check "7天陪伴"
    const sortedConvs = conversations
      .filter(c => c.lastActivityAt)
      .sort((a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime());
    
    if (sortedConvs.length >= 7) {
      const result = await this.unlockAchievement(userId, "7天陪伴");
      if (result) unlocked.push("7天陪伴");
    }
    
    // Check "自我探索"
    if (diaries.length >= 10) {
      const result = await this.unlockAchievement(userId, "自我探索");
      if (result) unlocked.push("自我探索");
    }
    
    // Check "社交达人"
    if (groups.length > 0) {
      const groupMessages = this.getFromStorage<GroupMessage>("groupMessages");
      const userGroupMessages = groupMessages.filter(m => m.userId === userId);
      if (userGroupMessages.length >= 20) {
        const result = await this.unlockAchievement(userId, "社交达人");
        if (result) unlocked.push("社交达人");
      }
    }
    
    return unlocked;
  }

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    localStorage.removeItem("users");
    localStorage.removeItem("conversations");
    localStorage.removeItem("messages");
    localStorage.removeItem("memories");
    localStorage.removeItem("groups");
    localStorage.removeItem("groupMembers");
    localStorage.removeItem("groupMessages");
    localStorage.removeItem("userSettings");
    localStorage.removeItem("diaryEntries");
    localStorage.removeItem("milestones");
    localStorage.removeItem("achievements");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentConversationId");
  }
}

// Export singleton instance
export const db = new DatabaseService();
export default db;
