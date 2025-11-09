# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fb6223f7-d697-4868-bc5e-8a99345a69e0

## Features

This project includes:
- **AI Companion**: LLM-powered chat with personality simulation
- **Automatic Summaries**: Session summaries every 10 messages
- **Adaptive Personality**: AI adapts based on conversation patterns
- **Proactive Messaging**: Background tasks for intelligent engagement
- **Split Messages**: Multi-message response support
- **Neon Database**: Serverless PostgreSQL integration
- **Personality Settings**: Customize AI behavior and traits

## Database

The application uses **Neon** (serverless PostgreSQL) for data persistence:
- See [NEON_SETUP.md](./NEON_SETUP.md) for setup instructions
- See [DATABASE_CONFIGURATION.md](./DATABASE_CONFIGURATION.md) for detailed configuration
- Currently uses localStorage for frontend-only mode
- Ready for backend integration with Prisma ORM

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fb6223f7-d697-4868-bc5e-8a99345a69e0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: (Optional) Setup Neon database
# Copy .env.example to .env and add your Neon connection string
cp .env.example .env
# Edit .env with your DATABASE_URL

# Step 5: (Optional) Run database migrations
npx prisma migrate dev

# Step 6: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **AI**: OpenAI SDK for LLM integration
- **Database**: Neon (Serverless PostgreSQL) with Prisma ORM
- **Storage**: LocalStorage (frontend), PostgreSQL (backend-ready)

## How can I deploy this project?

### Frontend-only deployment

Simply open [Lovable](https://lovable.dev/projects/fb6223f7-d697-4868-bc5e-8a99345a69e0) and click on Share -> Publish.

### Full-stack deployment (with database)

1. **Setup Neon Database**:
   - Follow [NEON_SETUP.md](./NEON_SETUP.md)
   - Get connection string from Neon console

2. **Deploy to Vercel** (recommended):
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   
   # Add environment variables in Vercel dashboard
   DATABASE_URL=your_neon_connection_string
   DIRECT_URL=your_neon_direct_connection_string
   ```

3. **Or deploy to other platforms**:
   - Netlify
   - Cloudflare Pages
   - Railway
   - Render

See [DATABASE_CONFIGURATION.md](./DATABASE_CONFIGURATION.md) for detailed deployment instructions.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Documentation

- [NEON_SETUP.md](./NEON_SETUP.md) - Neon database setup guide
- [DATABASE_CONFIGURATION.md](./DATABASE_CONFIGURATION.md) - Complete database configuration
- [PRISMA_AI_IMPLEMENTATION.md](./PRISMA_AI_IMPLEMENTATION.md) - AI implementation details
- [ADVANCED_AI_FEATURES.md](./ADVANCED_AI_FEATURES.md) - Advanced features documentation

