/**
 * Database service layer
 * This provides a unified interface for data persistence
 * Currently uses localStorage but follows Prisma schema structure
 * Can be easily replaced with actual Prisma client when backend is available
 */

export interface User {
  id: string;
  name: string;
  email?: string;
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
  async createUser(data: { name: string; email?: string }): Promise<User> {
    const users = this.getFromStorage<User>("users");
    const user: User = {
      id: this.generateId(),
      name: data.name,
      email: data.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(user);
    this.saveToStorage("users", users);
    return user;
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

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    localStorage.removeItem("users");
    localStorage.removeItem("conversations");
    localStorage.removeItem("messages");
    localStorage.removeItem("memories");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentConversationId");
  }
}

// Export singleton instance
export const db = new DatabaseService();
export default db;
