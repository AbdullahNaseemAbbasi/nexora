# Nexora

**AI-Powered Multi-Tenant SaaS Platform for Project Management**

A production-ready, full-stack SaaS application where multiple organizations manage teams, projects, and tasks — powered by AI.

## Tech Stack

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui

**Backend:** NestJS 10, TypeScript, Prisma ORM, PostgreSQL, JWT Auth

**AI:** Ollama (local, free), LangChain.js

**Infrastructure:** Docker, Turborepo, pnpm, Redis

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker Desktop

### Setup

```bash
# Clone the repo
git clone https://github.com/Jackabbasi/nexora.git
cd nexora

# Install dependencies
pnpm install

# Start PostgreSQL & Redis
docker-compose up -d

# Copy environment variables
cp .env.example .env

# Run database migrations
pnpm --filter @nexora/api prisma migrate dev

# Start development
pnpm dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Project Structure

```
nexora/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types & constants
├── docker-compose.yml
└── turbo.json
```

## Features

- Multi-tenant architecture (isolated organizations)
- JWT authentication with refresh tokens
- Role-based access control (Admin, Manager, Member)
- Project & task management with Kanban board
- AI-powered task suggestions & summarization
- AI project chat assistant
- Stripe subscription billing
- Real-time notifications (WebSocket)
- Analytics dashboard
- Super admin panel

## License

MIT
