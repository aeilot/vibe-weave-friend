/**
 * Background task service for proactive messaging
 * Simulates background tasks that check for inactivity and send proactive messages
 */

import { db, type Conversation } from "./db";
import { makeProactiveDecision, type Message as AIMessage } from "../ai";

class BackgroundTaskService {
  private intervalId: number | null = null;
  private isRunning = false;
  private CHECK_INTERVAL_MS = 60000; // Check every minute

  /**
   * Start background tasks
   */
  start() {
    if (this.isRunning) {
      console.log("Background tasks already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting background tasks for proactive messaging");

    this.intervalId = window.setInterval(async () => {
      await this.checkInactivity();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop background tasks
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Stopped background tasks");
  }

  /**
   * Check for inactive conversations and send proactive messages
   */
  private async checkInactivity() {
    try {
      const conversation = await db.getCurrentConversation();
      
      // Skip if no activity yet
      if (!conversation.lastActivityAt) {
        return;
      }

      // Calculate minutes since last activity
      const now = new Date();
      const lastActivity = new Date(conversation.lastActivityAt);
      const minutesInactive = (now.getTime() - lastActivity.getTime()) / 60000;

      // Skip if not enough time has passed
      if (minutesInactive < 5) {
        return;
      }

      // Get conversation messages
      const dbMessages = await db.getConversationMessages(conversation.id);
      
      // Convert to AI message format
      const conversationHistory: AIMessage[] = dbMessages
        .slice(-15) // Last 15 messages for context
        .map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content,
        })) as AIMessage[];

      // Check if we should send a proactive message
      const decision = await makeProactiveDecision(
        conversationHistory,
        conversation.summary || "新对话",
        conversation.messageCount || 0,
        minutesInactive
      );

      console.log("Proactive decision:", decision);

      // Send proactive message if decided
      if (
        (decision.action === "continue" || decision.action === "new_topic") &&
        decision.suggestedMessage
      ) {
        const user = await db.getCurrentUser();
        
        // Create proactive message
        await db.createMessage({
          content: decision.suggestedMessage,
          sender: "ai",
          conversationId: conversation.id,
          userId: user.id,
          isProactive: true,
        });

        console.log("Sent proactive message:", decision.suggestedMessage);

        // Trigger a custom event to notify UI
        window.dispatchEvent(new CustomEvent("proactive-message", {
          detail: {
            message: decision.suggestedMessage,
            action: decision.action,
          },
        }));
      }
    } catch (error) {
      console.error("Error in background task:", error);
    }
  }

  /**
   * Check if background tasks are running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const backgroundTasks = new BackgroundTaskService();
export default backgroundTasks;
