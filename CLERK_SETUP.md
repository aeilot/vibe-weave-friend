# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for the SoulLink application.

## What is Clerk?

Clerk is a complete user management and authentication solution that provides:
- Easy-to-use authentication components
- User management
- Session management
- Social login providers
- Security features

## Prerequisites

- A Clerk account (sign up at https://clerk.com)
- Node.js and npm installed
- Access to the project repository

## Setup Steps

### 1. Create a Clerk Application

1. Go to https://dashboard.clerk.com
2. Sign up or log in to your account
3. Click "Create Application"
4. Choose a name for your application (e.g., "SoulLink")
5. Select authentication providers you want to enable:
   - Email & Password (recommended)
   - Social providers (Google, GitHub, etc.) - optional

### 2. Get Your API Keys

1. In the Clerk Dashboard, go to "API Keys"
2. Copy your **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
3. You'll need this for the frontend configuration

### 3. Configure Environment Variables

1. Create a `.env` file in the root of your project (or copy from `.env.example`)
2. Add your Clerk publishable key:

```bash
# Clerk Authentication Configuration
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

**Important:** Never commit your `.env` file to version control!

### 4. Update Clerk Dashboard Settings

In the Clerk Dashboard:

1. Go to "Sessions" settings
2. Configure session lifetime as needed
3. Go to "Paths" settings and configure:
   - Sign-in URL: `/` (will use modal)
   - Sign-up URL: `/` (will use modal)
   - After sign-in URL: `/`
   - After sign-up URL: `/`

### 5. Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Test the authentication flow:
   - Open the app in your browser
   - Try to interact with a feature (e.g., send a message)
   - You should see the login dialog
   - Sign up or sign in with your test account
   - Verify that you can now use all features

## Features Implemented

### Authentication Flow

1. **Guest Mode**: Users can view static data without logging in
2. **Login Prompt**: When users try to interact, they're prompted to log in
3. **Authenticated Mode**: After logging in, users see their personal data

### Protected Features

The following features require authentication:
- Sending messages to the AI companion
- Creating and joining group chats
- Saving diary entries
- Viewing conversation history
- Tracking conversation counts

### User Profile

After logging in, users can:
- View their profile information
- See conversation and group counts
- Configure AI personality settings
- Sign out

## Architecture

### Components

- **`App.tsx`**: Wraps the app with `ClerkProvider`
- **`use-auth.tsx`**: Custom hook for authentication state
- **`LoginDialog.tsx`**: Modal dialog for sign-in/sign-up
- **`db.ts`**: Syncs Clerk users with local database

### Authentication Flow

```
User Action → Check Auth → Not Signed In → Show Login Dialog
                      ↓
                  Signed In → Sync with Local DB → Allow Action
```

## Troubleshooting

### "Invalid publishable key" error

- Verify your key is correctly set in `.env`
- Make sure the key starts with `pk_test_` or `pk_live_`
- Restart your development server after changing `.env`

### Login dialog not showing

- Check that `ClerkProvider` is properly wrapping your app
- Verify the `publishableKey` prop is set correctly
- Check browser console for errors

### User data not syncing

- Check that `AuthProvider` is rendering
- Verify the `useAuth` hook is being used correctly
- Check the browser console for database errors

## Security Best Practices

1. **Never commit API keys**: Keep `.env` files out of version control
2. **Use test keys in development**: Only use live keys in production
3. **Configure allowed domains**: Set up domain restrictions in Clerk Dashboard
4. **Enable MFA**: Consider enabling multi-factor authentication
5. **Monitor sessions**: Regularly check active sessions in Clerk Dashboard

## Production Deployment

When deploying to production:

1. Create a production Clerk application (or upgrade your test app)
2. Get production API keys
3. Set environment variables in your hosting platform:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   ```
4. Update Clerk Dashboard URLs to match your production domain
5. Test the authentication flow on production

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React SDK](https://clerk.com/docs/references/react/overview)
- [Clerk Dashboard](https://dashboard.clerk.com)

## Support

If you encounter issues:
1. Check the [Clerk Documentation](https://clerk.com/docs)
2. Visit [Clerk Support](https://clerk.com/support)
3. Review this project's issue tracker
