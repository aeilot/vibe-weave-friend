# Group Chat with Multiple AI Members - Implementation Guide

## Overview

This implementation adds support for multiple AI members in group chats, allowing users to create rich, interactive conversations with different AI personalities and roles.

## Key Features

### 1. Multiple AI Members per Group
- Each group can have multiple AI members with distinct personalities
- AI members have configurable roles: Moderator, Guide, or Entertainer
- Each AI can have custom personality prompts

### 2. AI Member Management
- Add/remove AI members from group chat
- Configure AI personality and role
- Toggle AI active status

### 3. @mention System
- `@AIName` - Mention specific AI member
- `@ai` - Invoke all active AI members
- Multiple AI members can respond to the same message

### 4. Database Persistence
- All group messages saved to database
- AI member configurations persisted
- Message history tracked with sender type

## Database Schema

### AIGroupMember Table
```sql
CREATE TABLE "AIGroupMember" (
    "id" TEXT PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,         -- "moderator" | "guide" | "entertainer"
    "personality" TEXT,            -- Custom personality prompt
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    FOREIGN KEY ("groupId") REFERENCES "Group"("id")
);
```

### Enhanced GroupMessage Table
```sql
ALTER TABLE "GroupMessage" ADD COLUMN "aiMemberId" TEXT;
ALTER TABLE "GroupMessage" ADD COLUMN "senderType" TEXT DEFAULT 'user';
ALTER TABLE "GroupMessage" ALTER COLUMN "userId" DROP NOT NULL;
```

## API Functions

### AI Member Management

```typescript
// Create AI member
await db.createAIGroupMember({
  groupId: string,
  name: string,
  role: "moderator" | "guide" | "entertainer",
  personality?: string
});

// Get all AI members in group
const aiMembers = await db.getGroupAIMembers(groupId);

// Update AI member
await db.updateAIGroupMember(aiMemberId, { isActive: false });

// Remove AI member
await db.removeAIGroupMember(aiMemberId);
```

### Message Creation

```typescript
// Create user message
await db.createGroupMessage({
  groupId: string,
  userId: string,
  content: string,
  senderType: "user"
});

// Create AI message
await db.createGroupMessage({
  groupId: string,
  aiMemberId: string,
  content: string,
  senderType: "ai"
});
```

### AI Response Generation

```typescript
// Generate response from specific AI member
const response = await generateAIMemberResponse(
  userMessage: string,
  groupHistory: Array<{ sender: string; content: string; senderType?: string }>,
  aiMember: {
    name: string,
    role: string,
    personality?: string
  }
);
```

## Usage Guide

### For Users

#### Creating a Group with AI
1. Navigate to Group page
2. Click "+" to create new group
3. Enter group name and description
4. A default AI assistant (Soul) will be automatically added

#### Adding AI Members
1. Open group chat
2. Click the Bot icon in header
3. Click "Add" button
4. Configure:
   - AI Name
   - Role (Moderator/Guide/Entertainer)
   - Custom Personality (optional)
5. Click "Add AI"

#### Interacting with AI
- Type `@AIName message` to mention specific AI
- Type `@ai message` to invoke all active AI members
- Use quick mention buttons below input field

### For Developers

#### Extending AI Roles

Add new roles in `src/pages/GroupChatEnhanced.tsx`:

```typescript
const aiRoles = [
  // ... existing roles
  {
    id: "expert",
    name: "领域专家",
    icon: BookOpen,
    color: "text-blue-500",
    description: "提供专业知识和深度见解",
    greeting: "我可以为大家提供专业的知识分享",
  },
];
```

Update personality templates in `src/ai.ts`:

```typescript
const rolePersonalities: Record<string, string> = {
  // ... existing roles
  expert: `你是一个领域专家...`,
};
```

#### Customizing AI Behavior

Modify `generateAIMemberResponse()` in `src/ai.ts` to add:
- Context awareness
- Emotion detection
- Topic tracking
- Proactive interventions

## Multi-device Sync

### Current Implementation
- Messages stored in localStorage (guest mode)
- Messages stored in PostgreSQL via Prisma (authenticated users)
- Real-time sync not yet implemented

### Future Enhancements
1. **WebSocket Integration**
   - Real-time message delivery
   - Online presence indicators
   - Typing indicators

2. **Polling Mechanism**
   - Short polling for message updates
   - Incremental sync based on last message ID
   - Conflict resolution strategy

3. **Optimistic Updates**
   - Instant UI updates
   - Background sync
   - Rollback on failure

## Security Considerations

### API Key Storage
- User API keys stored in database (see SECURITY_API_KEYS.md)
- AI responses generated using user's API credentials
- Consider backend proxy for production

### Data Privacy
- Group messages visible to all members
- AI member configurations visible to group admins
- User data isolated per account

## Testing

### Manual Testing Checklist
- [ ] Create group with default AI
- [ ] Add multiple AI members
- [ ] Remove AI member
- [ ] Mention specific AI with @Name
- [ ] Invoke all AIs with @ai
- [ ] Test different AI roles
- [ ] Verify message persistence
- [ ] Check multi-device sync (when implemented)

### Automated Tests (To Be Added)
- Unit tests for AI response generation
- Integration tests for database operations
- E2E tests for group chat flow

## Migration Guide

### For Existing Users

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Data Migration (if needed)**
   - Existing groups will work without AI members
   - Add AI members manually to existing groups
   - No data loss or breaking changes

3. **Configuration**
   - No additional configuration required
   - AI API settings inherited from user profile

## Troubleshooting

### AI Not Responding
1. Check API configuration in Profile
2. Verify AI member is active
3. Ensure proper @mention format
4. Check browser console for errors

### Messages Not Persisting
1. Verify user is logged in
2. Check database connection
3. Review browser console for errors
4. Clear localStorage and retry

### Multiple AIs Responding Twice
1. Check for duplicate @mentions
2. Verify AI member list loaded correctly
3. Clear cache and refresh

## Future Roadmap

### Phase 1 (Current)
- [x] Multiple AI members support
- [x] @mention system
- [x] Custom AI personalities
- [x] Database persistence

### Phase 2 (Next)
- [ ] Real-time sync with WebSocket
- [ ] Proactive AI interventions
- [ ] Sentiment analysis
- [ ] Topic suggestions

### Phase 3 (Future)
- [ ] AI member templates library
- [ ] Voice/video chat integration
- [ ] Advanced AI coordination
- [ ] Analytics dashboard

## Contributing

When adding new features:
1. Update schema.prisma if database changes needed
2. Create migration file
3. Update db.ts with new operations
4. Add AI functions to ai.ts if needed
5. Update UI components
6. Document changes in this file
7. Add tests

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Clerk Authentication](https://clerk.com/docs)
