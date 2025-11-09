# Advanced AI Features Implementation

## Overview

This document describes the advanced AI features implemented based on the lingxi repository architecture.

## Features Implemented

### 1. OpenAI Node SDK Integration

**Previous**: Fetch-based API calls to Supabase proxy or direct OpenAI API
**Now**: Official OpenAI Node SDK with better error handling and type safety

```typescript
import OpenAI from 'openai';

function createOpenAIClient(apiConfig: ApiConfig): OpenAI {
  return new OpenAI({
    apiKey: apiConfig.apiKey,
    baseURL: apiConfig.apiEndpoint || undefined,
    dangerouslyAllowBrowser: true,
  });
}
```

**Benefits**:
- Better TypeScript types
- Improved error messages
- Cleaner API
- Direct integration

### 2. Automatic Session Summaries

**Trigger**: Every 10 messages
**Function**: `generateSessionSummary()`

**How it works**:
1. Collects last 20 messages from conversation
2. Sends to OpenAI for summarization
3. Updates conversation summary and title
4. Shows toast notification to user

**Example**:
```typescript
// Auto-generate summary every 10 messages
if (messageCount % 10 === 0 && messageCount > 0) {
  const summary = await generateSessionSummary(
    historyForSummary,
    conversation.summary // Existing summary for incremental updates
  );
  
  await db.updateConversation(conversation.id, {
    summary,
    title: summary.substring(0, 50),
  });
}
```

**User Experience**:
- Toast: "会话已更新 - 自动生成摘要: [summary]..."
- Conversation title auto-updates
- Summaries build incrementally on previous summaries

### 3. Adaptive Personality

**Trigger**: Every 20 messages (minimum 20 messages)
**Function**: `decidePersonalityUpdate()`

**Analysis includes**:
- User's language style and formality level
- Topics being discussed
- Level of detail user prefers
- User satisfaction with responses
- Consistency of conversation topics

**Returns**:
```typescript
{
  shouldUpdate: boolean,
  reason: string,
  suggestedPersonality?: string,
  confidence: number (0.0-1.0)
}
```

**Example**:
```typescript
const decision = await decidePersonalityUpdate(
  historyForAnalysis,
  currentPersonality,
  messageCount,
  conversation.summary
);

if (decision.shouldUpdate && decision.suggestedPersonality) {
  await db.updateConversation(conversation.id, {
    currentPersonality: decision.suggestedPersonality,
  });
  
  // Show notification
  toast({
    title: "个性已自适应",
    description: `${decision.reason} (置信度: ${(decision.confidence * 100).toFixed(0)}%)`,
  });
}
```

**User Experience**:
- Toast: "个性已自适应 - [reason] (置信度: XX%)"
- AI personality gradually adapts to user's preferences
- Transparent updates with confidence scores

### 4. Proactive Messaging

**Service**: `backgroundTasks` (src/lib/backgroundTasks.ts)
**Check Interval**: 60 seconds
**Inactivity Threshold**: 5 minutes
**Function**: `makeProactiveDecision()`

**Decision Types**:
- `continue`: Proactively continue current topic
- `new_topic`: Suggest starting new related topic
- `wait`: Wait for user response

**Architecture**:
```typescript
class BackgroundTaskService {
  start()  // Starts 60s interval timer
  stop()   // Stops all timers
  
  private async checkInactivity() {
    // 1. Get current conversation
    // 2. Calculate minutes since last activity
    // 3. Skip if < 5 minutes
    // 4. Get conversation history
    // 5. Call makeProactiveDecision()
    // 6. Send message if decided
    // 7. Trigger UI event
  }
}
```

**Integration**:
```typescript
// Component lifecycle
useEffect(() => {
  backgroundTasks.start();
  
  // Listen for proactive messages
  window.addEventListener("proactive-message", handleProactiveMessage);
  
  return () => {
    window.removeEventListener("proactive-message", handleProactiveMessage);
    backgroundTasks.stop();
  };
}, []);
```

**User Experience**:
- Background service runs automatically
- Sends intelligent follow-ups after 5 min inactivity
- Toast: "收到主动消息 - [message preview]..."
- Proactive messages marked with `isProactive: true`

### 5. Split Messages Support

**Format**: AI can return JSON with message array
**System Prompt**: `SPLIT_MESSAGE_SYSTEM_PROMPT`

**JSON Structure**:
```json
{
  "messages": [
    "First part of the response",
    "Second part of the response",
    "Third part of the response"
  ]
}
```

**Parsing**:
```typescript
// Try to parse as JSON
const parsed = JSON.parse(cleanedText);

if (
  typeof parsed === "object" &&
  "messages" in parsed &&
  Array.isArray(parsed.messages) &&
  parsed.messages.every(msg => typeof msg === "string")
) {
  return { messages: parsed.messages };
}

// Otherwise return as plain text
return text;
```

**Display**:
```typescript
// Handle split messages
if (aiResponse.messages && aiResponse.messages.length > 1) {
  for (const msg of aiResponse.messages) {
    // Save message
    const splitMessage = await db.createMessage({
      content: msg,
      sender: "ai",
      conversationId: conversation.id,
      // ...
    });
    
    // Display in UI
    setMessages(prev => [...prev, /* message */]);
    
    // Delay between messages
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
```

**User Experience**:
- Complex responses broken into digestible parts
- 500ms delay between parts for readability
- Each part displayed as separate message
- Feels more natural and conversational

## Database Schema Updates

**Conversation Model**:
```typescript
{
  id: string
  title?: string
  userId: string
  summary?: string            // NEW: Session summary
  messageCount: number        // NEW: Auto-updated count
  lastActivityAt?: Date       // NEW: For proactive messaging
  currentPersonality?: string // NEW: Adaptive personality
  createdAt: Date
  updatedAt: Date
}
```

**Message Model**:
```typescript
{
  id: string
  content: string
  sender: string
  conversationId: string
  userId?: string
  hasMemory: boolean
  memoryTag?: string
  emotionDetected?: string
  isProactive?: boolean  // NEW: Mark proactive messages
  createdAt: Date
}
```

## API Functions

### New Functions in src/ai.ts

#### 1. generateSessionSummary()
```typescript
async function generateSessionSummary(
  conversationHistory: Message[],
  existingSummary?: string,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<string>
```

**Purpose**: Generate or update conversation summary
**Returns**: Summary string (max 100 characters)
**Fallback**: Uses first user message if LLM unavailable

#### 2. decidePersonalityUpdate()
```typescript
async function decidePersonalityUpdate(
  conversationHistory: Message[],
  currentPersonality: PersonalityConfig,
  messageCount: number,
  sessionSummary: string,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<PersonalityUpdateDecision>
```

**Purpose**: Analyze if personality should adapt
**Returns**: Decision with reason, suggested personality, and confidence
**Fallback**: Simple heuristic every 50 messages if no LLM

#### 3. makeProactiveDecision()
```typescript
async function makeProactiveDecision(
  conversationHistory: Message[],
  sessionSummary: string,
  messageCount: number,
  minutesInactive: number,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<ProactiveDecision>
```

**Purpose**: Decide if AI should proactively message user
**Returns**: Action (continue/new_topic/wait), reason, and optional message
**Fallback**: Simple rule-based decision if no LLM

## Configuration

**Background Task Interval**: 60 seconds (configurable)
**Inactivity Threshold**: 5 minutes (configurable)
**Summary Trigger**: Every 10 messages
**Personality Check**: Every 20 messages (min 20 total)
**Split Message Delay**: 500ms between parts

## Error Handling

All new functions include:
- Try-catch blocks with fallbacks
- Descriptive error messages
- Toast notifications for user feedback
- Console logging for debugging
- Graceful degradation when LLM unavailable

## Performance Considerations

**Background Tasks**:
- Single interval timer (60s)
- Only processes current conversation
- Skips if no activity or insufficient time
- Minimal CPU usage

**Message Processing**:
- Last 10-30 messages used (context window)
- Summaries cached in database
- Personality updates only every 20 messages
- Split messages limited by AI (not forced)

## Testing

**Build**: ✅ Successful (573KB JS bundle)
**TypeScript**: ✅ No errors
**Security**: ✅ CodeQL passed (0 alerts)
**Integration**: ✅ All features working

## Future Enhancements

1. **Configurable Intervals**: Allow users to adjust check frequency
2. **Personality Presets**: Pre-defined personality templates
3. **Summary History**: View past summaries
4. **Proactive Controls**: User preferences for proactivity level
5. **Multi-Language**: Support for other languages
6. **A/B Testing**: Compare personality effectiveness

## References

- **OpenAI SDK**: https://github.com/openai/openai-node
- **Lingxi Repository**: https://github.com/aeilot/lingxi
- **Implementation Commit**: 6f370fd

## License

See project LICENSE file.
