# Neon Database Setup Guide

This guide walks you through setting up Neon PostgreSQL database for the vibe-weave-friend application.

## Why Neon?

Neon is a serverless PostgreSQL database platform that provides:
- **Serverless architecture**: No server management required
- **Generous free tier**: 0.5 GB storage, shared compute
- **Instant database branching**: Like Git for your database
- **Auto-scaling**: Scales to zero when not in use
- **Built-in connection pooling**: Perfect for serverless functions
- **Fast cold starts**: Optimized for edge/serverless deployment

## Quick Start

### 1. Create Neon Account

1. Visit [https://neon.tech](https://neon.tech)
2. Click "Sign Up" and create an account (GitHub auth recommended)
3. Verify your email

### 2. Create a New Project

1. Click "Create a project" in the Neon console
2. Choose a name (e.g., "vibe-weave-friend")
3. Select your preferred region (choose closest to your users)
4. Click "Create project"

The database will be provisioned in ~10 seconds.

### 3. Get Connection String

1. In your project dashboard, click "Connection Details"
2. You'll see two connection strings:
   - **Pooled connection** (recommended for serverless)
   - **Direct connection** (for long-running processes)

3. Copy both connection strings:

**Pooled (for serverless functions/edge):**
```
postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

**Direct (for migrations and admin tasks):**
```
postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 4. Configure Environment Variables

Create `.env` file in project root:

```env
# Pooled connection for application
DATABASE_URL="postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"

# Direct connection for migrations
DIRECT_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**Important**: 
- Replace with your actual connection strings from Neon
- Never commit `.env` to version control
- `.env` is already in `.gitignore`

### 5. Install Dependencies

```bash
npm install @neondatabase/serverless
npm install -D prisma
npm install @prisma/client
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client with types based on your schema.

### 7. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create the database tables
- Apply the schema
- Generate Prisma Client
- Create migration files

## Usage Examples

### Option 1: With Prisma Client (Node.js Backend)

Perfect for Express/Fastify/Next.js API routes.

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma;

// Usage in API route
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const conversations = await prisma.conversation.findMany({
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50,
      },
    },
  });
  
  return Response.json(conversations);
}
```

### Option 2: With Neon Serverless Driver (Edge Functions)

Perfect for Vercel Edge, Cloudflare Workers, Deno Deploy.

```typescript
import { neon, neonConfig } from '@neondatabase/serverless';

// Enable caching for better performance
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  const messages = await sql`
    SELECT * FROM "Message"
    WHERE "conversationId" = ${conversationId}
    ORDER BY "createdAt" ASC
  `;
  
  return Response.json(messages);
}
```

### Option 3: Prisma with Neon (Best of Both Worlds)

Use Prisma Client at the edge with Neon's driver.

```typescript
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(request: Request) {
  const conversations = await prisma.conversation.findMany({
    cacheStrategy: { ttl: 60 }, // Cache for 60 seconds
  });
  
  return Response.json(conversations);
}
```

## Database Management

### Viewing Data

Use Prisma Studio to browse and edit data:

```bash
npx prisma studio
```

Opens a web interface at `http://localhost:5555`

### Running Migrations

Create a new migration:
```bash
npx prisma migrate dev --name descriptive_name
```

Apply migrations in production:
```bash
npx prisma migrate deploy
```

### Reset Database

**Warning**: This deletes all data!

```bash
npx prisma migrate reset
```

### Seeding Data

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
    },
  });

  await prisma.conversation.create({
    data: {
      title: 'First Conversation',
      userId: user.id,
      messages: {
        create: [
          {
            content: 'Hello!',
            sender: 'user',
            userId: user.id,
          },
          {
            content: 'Hi! How can I help you today?',
            sender: 'ai',
          },
        ],
      },
    },
  });

  console.log('Database seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

## Neon Features

### Database Branching

Create development branches of your database:

```bash
# In Neon console or CLI
neonctl branches create --name development

# Get connection string for branch
neonctl connection-string development
```

Use different branches for:
- Development
- Staging
- Testing
- Feature development

### Auto-suspend

Neon automatically suspends inactive databases after 5 minutes, saving costs:
- First query "wakes up" the database (~1 second)
- Subsequent queries are fast
- Perfect for development and low-traffic apps

### Connection Pooling

Neon includes built-in connection pooling:
- Use `-pooler` endpoint for serverless/edge
- No need for external pooling services
- Handles thousands of concurrent connections

### Backups

Neon provides automatic backups:
- **Free tier**: 7-day retention
- **Paid tiers**: 30+ day retention
- Point-in-time recovery available
- Restore from Neon console

## Performance Optimization

### Indexing

Our schema includes important indexes:

```prisma
model Conversation {
  @@index([userId])
  @@index([lastActivityAt])
}

model Message {
  @@index([conversationId])
  @@index([createdAt])
  @@index([sender])
}
```

Add more indexes as needed:
```bash
# Edit schema.prisma, then:
npx prisma migrate dev --name add_indexes
```

### Query Optimization

Use Prisma's query optimization features:

```typescript
// Select only needed fields
const messages = await prisma.message.findMany({
  select: {
    id: true,
    content: true,
    sender: true,
    createdAt: true,
  },
});

// Paginate large result sets
const messages = await prisma.message.findMany({
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: 'desc' },
});

// Use cursor-based pagination for performance
const messages = await prisma.message.findMany({
  take: 50,
  cursor: { id: lastMessageId },
  skip: 1, // Skip the cursor
});
```

### Caching

Implement caching for frequently accessed data:

```typescript
// Using Vercel KV or Redis
import { kv } from '@vercel/kv';

async function getCachedConversation(id: string) {
  const cached = await kv.get(`conversation:${id}`);
  if (cached) return cached;
  
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: true },
  });
  
  await kv.set(`conversation:${id}`, conversation, { ex: 300 }); // 5 min cache
  return conversation;
}
```

## Monitoring

### Neon Console

Monitor in Neon dashboard:
- Database size
- Compute hours used
- Active connections
- Query performance
- Storage usage

### Prisma Metrics

Enable query logging:

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Custom Monitoring

Track application metrics:

```typescript
async function logQuery(operation: string, duration: number) {
  console.log(`${operation} took ${duration}ms`);
  
  // Send to monitoring service
  // await analytics.track('database_query', { operation, duration });
}
```

## Troubleshooting

### Connection Issues

**"Can't reach database server"**
- Check DATABASE_URL is correct
- Verify Neon project is active (not suspended)
- Check network/firewall settings

**"Too many connections"**
- Use pooled connection string (with `-pooler`)
- Reduce connection pool size
- Enable connection pooling in app

### Migration Issues

**"Migration failed"**
- Check schema syntax
- Verify database is reachable
- Look at error message for specific issue
- Try `npx prisma migrate reset` (development only)

**"Drift detected"**
- Database schema differs from migration history
- Run `npx prisma migrate dev` to sync
- Or `npx prisma db push` for quick fixes (development)

### Performance Issues

**Slow queries**
- Add indexes to frequently queried fields
- Use `EXPLAIN ANALYZE` to understand query plans
- Consider denormalization for read-heavy operations
- Use caching for hot data

**High latency**
- Choose Neon region close to users
- Use edge/serverless deployment near Neon
- Implement caching layer
- Batch queries when possible

## Security Best Practices

1. **Never expose connection strings**
   - Use environment variables
   - Don't commit `.env` files
   - Rotate credentials if leaked

2. **Use SSL connections**
   - Always include `?sslmode=require` in connection string
   - Neon enforces SSL by default

3. **Implement authentication**
   - Don't expose database directly to frontend
   - Use backend API with authentication
   - Validate all user inputs

4. **Row-level security**
   - Use Prisma's where clauses to filter by user
   - Implement authorization checks
   - Consider PostgreSQL RLS policies

5. **Rate limiting**
   - Limit API calls per user
   - Prevent abuse of expensive queries
   - Monitor for unusual patterns

## Cost Management

### Free Tier Limits

Neon free tier includes:
- 0.5 GB storage
- Shared compute
- 1 database branch
- 7-day point-in-time recovery

### Monitoring Usage

Check usage in Neon console:
- Dashboard shows current usage
- Alerts when approaching limits
- Upgrade options available

### Optimization Tips

1. **Auto-suspend**: Enabled by default, saves compute hours
2. **Efficient queries**: Use indexes and select only needed fields
3. **Archive old data**: Move inactive data to cold storage
4. **Database branching**: Use for testing instead of separate instances

## Migration from SQLite

If migrating from the previous SQLite setup:

1. **Export SQLite data**
   ```bash
   sqlite3 prisma/dev.db .dump > backup.sql
   ```

2. **Convert to PostgreSQL format**
   - Remove SQLite-specific syntax
   - Fix date/time formats
   - Update AUTOINCREMENT to SERIAL

3. **Import to Neon**
   ```bash
   psql $DATABASE_URL < backup.sql
   ```

Or use the data export/import functions in `DATABASE_CONFIGURATION.md`.

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Neon Discord Community](https://discord.gg/neon)
- [Prisma with Neon Guide](https://neon.tech/docs/guides/prisma)
- [Neon CLI Documentation](https://neon.tech/docs/reference/neon-cli)
- [Neon Pricing](https://neon.tech/pricing)

## Support

For Neon-specific issues:
- [Neon Support](https://neon.tech/docs/introduction/support)
- [Neon Community Discord](https://discord.gg/neon)
- [Neon GitHub Issues](https://github.com/neondatabase/neon/issues)

For application issues:
- Check project README
- Review DATABASE_CONFIGURATION.md
- Create GitHub issue with details
