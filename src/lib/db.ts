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

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    localStorage.removeItem("users");
    localStorage.removeItem("conversations");
    localStorage.removeItem("messages");
    localStorage.removeItem("memories");
    localStorage.removeItem("groups");
    localStorage.removeItem("groupMembers");
    localStorage.removeItem("groupMessages");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentConversationId");
  }
}

// Export singleton instance
export const db = new DatabaseService();
export default db;
