# Database Configuration Guide

This guide explains how to configure and use the database in the vibe-weave-friend application.

## Overview

The application uses a dual-layer database architecture:
1. **Prisma ORM** - Schema definition and type generation
2. **LocalStorage** - Current frontend implementation
3. **Neon (PostgreSQL)** - Recommended for production backend

## Current Setup (LocalStorage)

### Description
The current implementation uses browser localStorage to store data following the Prisma schema structure. This allows the app to function as a standalone frontend application without requiring a backend server.

### Configuration
No configuration needed. Data is automatically stored in the browser's localStorage.

### Limitations
- Data stored locally in browser only
- No synchronization across devices
- Limited storage capacity (~5-10MB)
- No encryption at rest
- Data cleared if user clears browser cache

## Prisma Schema

### Location
`prisma/schema.prisma`

### Models

#### User
Represents application users.

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  conversations Conversation[]
  messages      Message[]
}
```

#### Conversation
Represents chat sessions with AI.

```prisma
model Conversation {
  id                String   @id @default(uuid())
  title             String?
  userId            String
  summary           String?           // Auto-generated summary
  messageCount      Int      @default(0)
  lastActivityAt    DateTime?
  currentPersonality String?          // Adaptive personality
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]
}
```

#### Message
Individual chat messages.

```prisma
model Message {
  id              String   @id @default(uuid())
  content         String
  sender          String   // "user" or "ai"
  conversationId  String
  userId          String?
  hasMemory       Boolean  @default(false)
  memoryTag       String?
  emotionDetected String?  // "positive", "neutral", "negative"
  isProactive     Boolean  @default(false)  // Proactive messages
  createdAt       DateTime @default(now())
  
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

#### Memory
Important information extracted from conversations.

```prisma
model Memory {
  id        String   @id @default(uuid())
  content   String
  category  String?  // "兴趣爱好", "职业信息", "家庭信息", etc.
  userId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Migrating to Backend Database

### Option 1: Neon (Recommended)

Neon is a serverless PostgreSQL database with excellent free tier and modern developer experience.

#### Setup Steps

1. **Create Neon Account**
   - Visit https://neon.tech
   - Sign up for free account
   - Create a new project

2. **Install Dependencies**
   ```bash
   npm install @neondatabase/serverless
   npm install -D prisma
   ```

3. **Update Prisma Schema**
   
   Change datasource in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Configure Environment Variables**
   
   Create `.env` file:
   ```
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```
   
   Get connection string from Neon dashboard.

5. **Run Migrations**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

6. **Create Backend API**
   
   Example using Express:
   ```typescript
   // server.ts
   import express from 'express';
   import { PrismaClient } from '@prisma/client';
   
   const app = express();
   const prisma = new PrismaClient();
   
   app.use(express.json());
   
   // Get conversation messages
   app.get('/api/conversations/:id/messages', async (req, res) => {
     const messages = await prisma.message.findMany({
       where: { conversationId: req.params.id },
       orderBy: { createdAt: 'asc' },
     });
     res.json(messages);
   });
   
   // Create message
   app.post('/api/messages', async (req, res) => {
     const message = await prisma.message.create({
       data: req.body,
     });
     res.json(message);
   });
   
   // ... more endpoints
   
   app.listen(3000, () => {
     console.log('Server running on port 3000');
   });
   ```

7. **Update Frontend**
   
   Replace `src/lib/db.ts` with API calls:
   ```typescript
   // src/lib/api.ts
   const API_URL = import.meta.env.VITE_API_URL;
   
   export async function getConversationMessages(conversationId: string) {
     const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`);
     return response.json();
   }
   
   export async function createMessage(data: MessageData) {
     const response = await fetch(`${API_URL}/api/messages`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data),
     });
     return response.json();
   }
   ```

### Option 2: Supabase

Supabase provides PostgreSQL with built-in authentication and real-time subscriptions.

#### Setup Steps

1. **Create Supabase Project**
   - Visit https://supabase.com
   - Create new project
   - Wait for database provisioning

2. **Get Connection String**
   - Go to Settings > Database
   - Copy connection string
   - Add to `.env` as `DATABASE_URL`

3. **Update Prisma Schema**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Use Supabase Client**
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     process.env.VITE_SUPABASE_URL!,
     process.env.VITE_SUPABASE_ANON_KEY!
   );
   
   // Query messages
   const { data } = await supabase
     .from('Message')
     .select('*')
     .eq('conversationId', id)
     .order('createdAt');
   ```

### Option 3: SQLite with Better-SQLite3 (Local/Development)

For local development or electron apps.

1. **Install Dependencies**
   ```bash
   npm install better-sqlite3
   npm install -D @types/better-sqlite3
   ```

2. **Keep SQLite in Schema**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

3. **Use in Node.js Backend**
   ```typescript
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   ```

## Environment Variables

### Required Variables

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host:5432/database"

# OpenAI API (for AI features)
VITE_OPENAI_API_KEY="sk-..."

# Optional: Backend API URL (if using separate backend)
VITE_API_URL="http://localhost:3000"
```

### Loading Environment Variables

In development:
```bash
# .env file is automatically loaded by Vite
npm run dev
```

In production:
```bash
# Set environment variables in hosting platform
# Vercel, Netlify, etc. have UI for this
```

## Data Migration

### Exporting from LocalStorage

```typescript
// Export all data from localStorage
function exportData() {
  const data = {
    users: JSON.parse(localStorage.getItem('users') || '[]'),
    conversations: JSON.parse(localStorage.getItem('conversations') || '[]'),
    messages: JSON.parse(localStorage.getItem('messages') || '[]'),
    memories: JSON.parse(localStorage.getItem('memories') || '[]'),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vibe-weave-data.json';
  a.click();
}
```

### Importing to Database

```typescript
// Import data to Prisma database
async function importData(jsonData: any) {
  const prisma = new PrismaClient();
  
  // Import users
  for (const user of jsonData.users) {
    await prisma.user.create({ data: user });
  }
  
  // Import conversations
  for (const conv of jsonData.conversations) {
    await prisma.conversation.create({ data: conv });
  }
  
  // Import messages
  for (const msg of jsonData.messages) {
    await prisma.message.create({ data: msg });
  }
  
  // Import memories
  for (const mem of jsonData.memories) {
    await prisma.memory.create({ data: mem });
  }
}
```

## Performance Optimization

### Indexing

Add indexes to frequently queried fields:

```prisma
model Message {
  // ... fields
  
  @@index([conversationId])
  @@index([createdAt])
  @@index([sender])
}

model Conversation {
  // ... fields
  
  @@index([userId])
  @@index([lastActivityAt])
}
```

### Connection Pooling

For Neon with serverless functions:

```typescript
import { neon, neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

neonConfig.fetchConnectionCache = true;

const prisma = new PrismaClient().$extends(withAccelerate());
```

## Security Best Practices

1. **Never commit `.env` files**
   - Add `.env*` to `.gitignore`
   - Use `.env.example` for documentation

2. **Use environment-specific connections**
   ```
   DATABASE_URL_DEV="..."
   DATABASE_URL_PROD="..."
   ```

3. **Enable SSL/TLS**
   ```
   DATABASE_URL="postgresql://...?sslmode=require"
   ```

4. **Implement authentication**
   - Add user authentication before backend API
   - Validate all API requests
   - Use JWT or session tokens

5. **Rate limiting**
   - Implement rate limits on API endpoints
   - Prevent abuse of AI features

## Monitoring

### Prisma Studio

View and edit database data:
```bash
npx prisma studio
```

### Neon Dashboard

Monitor:
- Database size
- Query performance
- Connection count
- Logs and metrics

## Backup and Recovery

### Neon Backups

Automatic backups:
- Point-in-time recovery
- Configurable retention period
- Restore from dashboard

### Manual Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

## Troubleshooting

### Common Issues

**"Error: P1001: Can't reach database server"**
- Check DATABASE_URL is correct
- Verify network connectivity
- Ensure database is running

**"Error: P2002: Unique constraint failed"**
- Attempting to insert duplicate unique values
- Check ID generation
- Verify data doesn't already exist

**"Error: P2003: Foreign key constraint failed"**
- Referenced record doesn't exist
- Create parent records first
- Check cascade rules

### Debug Mode

Enable Prisma query logging:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review documentation above
3. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
