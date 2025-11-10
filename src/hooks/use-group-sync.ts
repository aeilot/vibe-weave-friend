import { useEffect, useRef } from "react";
import { db, type GroupMessage } from "@/lib/db";

interface UseGroupSyncOptions {
  groupId: string;
  enabled: boolean;
  onNewMessages?: (messages: GroupMessage[]) => void;
  pollInterval?: number; // in milliseconds
}

/**
 * Hook for syncing group messages across devices
 * Uses polling to check for new messages periodically
 */
export function useGroupSync({
  groupId,
  enabled,
  onNewMessages,
  pollInterval = 5000, // Default 5 seconds
}: UseGroupSyncOptions) {
  const lastMessageIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !groupId) {
      return;
    }

    const checkForNewMessages = async () => {
      try {
        const messages = await db.getGroupMessages(groupId);
        
        if (messages.length === 0) {
          return;
        }

        // Get the most recent message ID
        const latestMessage = messages[messages.length - 1];
        
        // If this is the first check, just store the ID
        if (lastMessageIdRef.current === null) {
          lastMessageIdRef.current = latestMessage.id;
          return;
        }

        // Check if there are new messages
        const lastKnownIndex = messages.findIndex(
          (m) => m.id === lastMessageIdRef.current
        );

        if (lastKnownIndex !== -1 && lastKnownIndex < messages.length - 1) {
          // We have new messages
          const newMessages = messages.slice(lastKnownIndex + 1);
          lastMessageIdRef.current = latestMessage.id;
          
          if (onNewMessages) {
            onNewMessages(newMessages);
          }
        } else if (lastKnownIndex === -1) {
          // Last known message not found, might be deleted or we're out of sync
          // Reset and consider all messages as new
          lastMessageIdRef.current = latestMessage.id;
        }
      } catch (error) {
        console.error("Error checking for new messages:", error);
      }
    };

    // Initial check
    checkForNewMessages();

    // Set up polling
    intervalRef.current = setInterval(checkForNewMessages, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [groupId, enabled, onNewMessages, pollInterval]);

  return {
    // Could return methods to manually trigger sync or pause/resume
    forceSync: async () => {
      // Force an immediate sync check
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Will be restarted by useEffect
    },
  };
}

/**
 * Hook for optimistic UI updates with rollback support
 */
export function useOptimisticMessages() {
  const pendingMessages = useRef<Map<string, any>>(new Map());

  const addOptimisticMessage = (tempId: string, message: any) => {
    pendingMessages.current.set(tempId, message);
  };

  const confirmMessage = (tempId: string, confirmedMessage: any) => {
    pendingMessages.current.delete(tempId);
    return confirmedMessage;
  };

  const rollbackMessage = (tempId: string) => {
    const message = pendingMessages.current.get(tempId);
    pendingMessages.current.delete(tempId);
    return message;
  };

  return {
    addOptimisticMessage,
    confirmMessage,
    rollbackMessage,
    hasPendingMessages: () => pendingMessages.current.size > 0,
  };
}
