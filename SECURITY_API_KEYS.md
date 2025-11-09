# Security Considerations for API Key Storage

## Current Implementation

The application stores user AI API keys in the database (and localStorage as fallback) in plain text. This is necessary because:

1. **User-provided keys**: Users configure their own OpenAI API keys
2. **Runtime usage**: The application needs to retrieve and use these keys to make API calls
3. **Browser environment**: The application runs in the browser with limited secure storage options

## Known Security Issues

CodeQL has identified the following security concerns:

- **js/clear-text-storage-of-sensitive-data**: API keys are stored in clear text in both localStorage and database

## Mitigation Strategies

For production deployments, consider implementing one or more of these security measures:

### 1. Client-Side Encryption (Partial Protection)
```typescript
// Encrypt API key before storage
const encryptedKey = await encryptWithUserPassword(apiKey, userPassword);
await db.updateUserSettings(userId, { apiKey: encryptedKey });

// Decrypt when needed
const decryptedKey = await decryptWithUserPassword(encryptedKey, userPassword);
```

**Limitation**: The encryption key would still be accessible in browser memory.

### 2. Backend Proxy (Recommended)
Instead of storing API keys in the frontend:
- Store encrypted keys in the backend database
- Use server-side encryption with secure key management (e.g., AWS KMS, HashiCorp Vault)
- Create a proxy endpoint that handles OpenAI API calls
- Frontend sends requests to your backend, which uses the decrypted key

```typescript
// Frontend: No API key storage
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${userToken}` },
  body: JSON.stringify({ messages })
});

// Backend: Secure key retrieval and usage
app.post('/api/ai/chat', authenticate, async (req, res) => {
  const encryptedKey = await db.getUserSettings(req.user.id);
  const apiKey = decrypt(encryptedKey.apiKey);
  const response = await openai.chat(apiKey, req.body.messages);
  res.json(response);
});
```

### 3. Environment Variable Configuration (Admin Mode)
For shared deployments, use the admin configuration to provide a single API key:
- Set API key via environment variable
- Enable "Force API" mode in admin settings
- Users don't need to provide their own keys

### 4. Database-Level Encryption
Enable encryption at rest for the database:
- PostgreSQL: Transparent Data Encryption (TDE)
- Neon: Encryption enabled by default
- This protects against database file theft but doesn't prevent access by the application

## Current Status

✅ **Acknowledged**: We are aware that API keys are stored in plain text  
✅ **Acceptable for**: Development, personal use, trusted environments  
⚠️ **Not recommended for**: Production with multiple users, shared hosting, untrusted environments  
🔒 **Recommended**: Implement backend proxy pattern for production deployments

## Implementation Checklist for Production

If you're deploying this for production use:

- [ ] Review and accept the security trade-offs
- [ ] Implement backend proxy pattern (recommended)
- [ ] Or implement client-side encryption with user awareness
- [ ] Enable database encryption at rest
- [ ] Use HTTPS for all communications
- [ ] Implement rate limiting on API endpoints
- [ ] Add audit logging for API key access
- [ ] Consider key rotation policies
- [ ] Add security warnings in the UI when users enter API keys

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OpenAI API Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [PostgreSQL Encryption](https://www.postgresql.org/docs/current/encryption-options.html)
