# Prisma Database and AI Integration

This document describes the Prisma database setup and AI functionality implemented in this project.

## Overview

The application now includes:
1. **Prisma ORM Setup** - Database schema and migrations
2. **AI Functionality** - LLM-based personality simulation and chatting (`src/ai.ts`)
3. **Database Service** - Data persistence layer (`src/lib/db.ts`)

## Database Schema

### Models

The Prisma schema defines the following models:

#### User
- Represents application users
- Fields: id, name, email, createdAt, updatedAt
- Relations: conversations, messages

#### Conversation
- Represents chat conversations
- Fields: id, title, userId, createdAt, updatedAt
- Relations: user, messages

#### Message
- Represents individual chat messages
- Fields: id, content, sender, conversationId, userId, hasMemory, memoryTag, emotionDetected, createdAt
- Relations: conversation, user

#### Memory
- Stores important information extracted from conversations
- Fields: id, content, category, userId, createdAt, updatedAt

### Setup

The Prisma setup includes:
- Schema file: `prisma/schema.prisma`
- Configuration: `prisma.config.ts`
- Generated client: `generated/prisma/`
- Migrations: `prisma/migrations/`

## AI Functionality (src/ai.ts)

### Features

#### 1. Personality Simulation
- Default personality: "Soul" - a warm, caring AI companion
- Configurable traits: 关怀, 倾听, 陪伴, 理解, 温暖
- Custom system prompts for LLM interaction

#### 2. Emotion Detection
Automatically detects user emotion from messages:
- **Positive**: Happy, excited, satisfied emotions
- **Negative**: Sad, angry, anxious emotions
- **Neutral**: Default state

#### 3. Memory Tagging
Identifies and tags important information:
- 兴趣爱好 (Hobbies)
- 职业信息 (Career)
- 家庭信息 (Family)
- 社交关系 (Social relationships)
- 人生目标 (Life goals)

#### 4. LLM Integration
- Supports OpenAI API and compatible endpoints
- Integrates with existing Supabase edge function proxy
- Fallback to personality simulation when LLM is unavailable
- Uses API configuration from Profile settings

### Key Functions

```typescript
// Detect emotion from user message
detectEmotion(message: string): "positive" | "neutral" | "negative"

// Simulate personality-based response
simulatePersonality(userMessage: string, personality?: PersonalityConfig): string

// Check if message should trigger memory tagging
shouldTagMemory(message: string): { hasMemory: boolean; memoryTag?: string }

// Call LLM API for chat completion
callLLM(messages: Message[], apiConfig?: ApiConfig, adminConfig?: AdminConfig): Promise<string>

// Generate AI response with full functionality
generateAIResponse(
  userMessage: string,
  conversationHistory?: Message[],
  personality?: PersonalityConfig,
  apiConfig?: ApiConfig,
  adminConfig?: AdminConfig
): Promise<AIResponse>
```

## Database Service (src/lib/db.ts)

### Architecture

Since this is a frontend-only React application, we cannot run Prisma Client directly in the browser. The database service provides:

1. **LocalStorage-based storage** following Prisma schema structure
2. **Compatible interface** for future backend integration
3. **CRUD operations** for all models

### Usage

```typescript
import { db } from "@/lib/db";

// Get current user
const user = await db.getCurrentUser();

// Create a conversation
const conversation = await db.createConversation(user.id, "My Chat");

// Save a message
const message = await db.createMessage({
  content: "Hello!",
  sender: "user",
  conversationId: conversation.id,
  userId: user.id,
});

// Load conversation messages
const messages = await db.getConversationMessages(conversation.id);

// Save a memory
const memory = await db.createMemory({
  content: "User likes basketball",
  category: "兴趣爱好",
  userId: user.id,
});
```

## Integration with Companion Component

The Companion component (`src/pages/Companion.tsx`) now:

1. **Loads messages** from the database on mount
2. **Persists messages** to the database when sent
3. **Uses AI functions** to generate intelligent responses
4. **Detects emotions** and tags memories automatically
5. **Handles errors** with toast notifications

## API Configuration

Users can configure their LLM API settings in the Profile page:
- API Key
- API Endpoint (default: OpenAI)
- Model (default: gpt-3.5-turbo)

The AI functions will:
1. First try to use the Supabase edge function proxy
2. Fall back to direct API calls
3. Use personality simulation if LLM is unavailable

## Future Enhancements

### Backend Integration

To integrate with a real backend:

1. **Create a backend API** (Express, Fastify, or Supabase functions)
2. **Use Prisma Client** on the backend
3. **Replace db.ts** with API calls
4. **Maintain the same interface** for minimal frontend changes

Example backend setup:
```typescript
// backend/src/db.ts
import { PrismaClient } from '../generated/prisma';
export const prisma = new PrismaClient();

// backend/src/routes/messages.ts
app.post('/api/messages', async (req, res) => {
  const message = await prisma.message.create({
    data: req.body,
  });
  res.json(message);
});
```

### Additional Features

- Voice input/output integration
- Multi-modal AI responses (images, audio)
- Advanced emotion tracking over time
- Personalized memory recall
- Group chat support with multiple AI personalities

## Security Considerations

- API keys are stored in localStorage (consider more secure storage)
- Add authentication before deploying
- Validate all user inputs
- Rate limit API calls
- Implement proper error handling

## Development

### Running Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Create a migration
npx prisma migrate dev --name <migration_name>

# View database in Prisma Studio
npx prisma studio
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## License

See the project's main LICENSE file.
