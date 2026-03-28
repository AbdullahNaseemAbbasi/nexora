# Nexora — AI-Powered Multi-Tenant SaaS Platform

## Complete Project Blueprint

> This document is the single source of truth for the entire Nexora project.
> Any AI assistant or developer reading this should be able to fully understand the architecture, tech stack, features, database design, folder structure, and implementation plan.

---

## 1. Project Overview

**Nexora** is a production-ready, AI-powered, multi-tenant project management SaaS platform. It allows multiple organizations (tenants) to sign up, manage their teams, run projects, assign tasks, and leverage AI features — all from a single deployed application.

### What "Multi-Tenant" Means

One deployed application serves many organizations. Each organization (tenant) has its own isolated data, users, projects, and billing — but they all share the same codebase, database, and infrastructure. Tenant isolation is enforced at the database level using a `tenantId` foreign key on every tenant-scoped table (shared database, shared schema, tenant-scoped rows strategy).

### What "AI-Powered" Means

The platform integrates AI capabilities including:

- **Smart Task Suggestions**: AI generates sub-tasks from a high-level goal.
- **Meeting Notes Summarization**: Paste raw notes → get structured summary.
- **AI Project Assistant (Chat)**: Per-project AI chatbot that understands project context (tasks, deadlines, members) and answers questions.
- **Auto-Categorization**: AI auto-labels and prioritizes tasks.
- **Weekly Digest**: AI-generated summary of what happened in a project that week.

### Real-World Analogy

Imagine Trello/Asana + ChatGPT combined, where multiple companies use the same platform, each with their own private workspace and AI assistant.

---

## 2. Tech Stack (All FREE for Development)

### Frontend

| Technology        | Version  | Purpose                                      |
| ----------------- | -------- | -------------------------------------------- |
| **Next.js**       | 14+      | React framework with App Router (SSR + CSR)  |
| **TypeScript**    | 5+       | Type safety across the entire frontend        |
| **Tailwind CSS**  | 3+       | Utility-first CSS framework                   |
| **shadcn/ui**     | latest   | Pre-built accessible UI components            |
| **Zustand**       | 4+       | Lightweight client-side state management      |
| **TanStack Query**| 5+       | Server state management, caching, API calls   |
| **React Hook Form** | 7+    | Form handling with validation                 |
| **Zod**           | 3+       | Schema validation (shared with backend)       |
| **Framer Motion** | 11+     | Animations and transitions                    |
| **Recharts**      | 2+       | Dashboard charts and analytics visualization  |

### Backend

| Technology       | Version | Purpose                                        |
| ---------------- | ------- | ---------------------------------------------- |
| **NestJS**       | 10+     | Node.js backend framework (modular, scalable)  |
| **TypeScript**   | 5+      | Type safety across the entire backend           |
| **Prisma**       | 5+      | ORM for database access and migrations          |
| **PostgreSQL**   | 15+     | Primary relational database                     |
| **Passport.js**  | 0.7+    | Authentication strategies (JWT, OAuth)          |
| **JWT**          | -       | Access + Refresh token-based authentication     |
| **Bcrypt**       | -       | Password hashing                                |
| **class-validator** | -    | DTO validation in NestJS                        |
| **class-transformer** | -  | DTO transformation in NestJS                    |
| **Swagger**      | -       | Auto-generated API documentation                |
| **Bull/BullMQ**  | -       | Background job queue (emails, AI tasks)         |
| **Nodemailer**   | -       | Email sending (verification, invitations)       |

### AI Integration

| Technology           | Purpose                                  |
| -------------------- | ---------------------------------------- |
| **Ollama**           | Local AI model runner (FREE, no API key) |
| **LLaMA 3 / Mistral** | Open-source AI models via Ollama       |
| **LangChain.js**     | AI orchestration, prompt templates       |
| *Claude API (optional)* | *Can swap in later if user gets API key* |

> **AI Cost: $0** — Ollama runs AI models locally on your machine for free.

### Database

| Technology     | Purpose                                     |
| -------------- | ------------------------------------------- |
| **PostgreSQL** | Primary database (relational, ACID)         |
| **Prisma ORM** | Schema definition, migrations, type-safe queries |
| **Redis**      | Caching, session storage, job queue backend |

### DevOps & Tooling

| Technology       | Purpose                                     |
| ---------------- | ------------------------------------------- |
| **Docker**       | Containerized development & deployment      |
| **Docker Compose** | Multi-container orchestration (app + db + redis) |
| **pnpm**         | Fast, efficient package manager             |
| **Turborepo**    | Monorepo build system                       |
| **ESLint**       | Code linting                                |
| **Prettier**     | Code formatting                             |
| **Husky**        | Git hooks (pre-commit linting)              |
| **GitHub Actions** | CI/CD pipeline                            |

### Deployment (All Free Tier)

| Service        | Purpose                          |
| -------------- | -------------------------------- |
| **Vercel**     | Frontend deployment              |
| **Railway**    | Backend + PostgreSQL + Redis     |
| **Docker Hub** | Container registry               |

---

## 3. Monorepo Folder Structure

```
nexora/
├── apps/
│   ├── web/                          # Next.js 14 Frontend
│   │   ├── public/
│   │   │   ├── images/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── (auth)/           # Auth route group (no layout nesting)
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── verify-email/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (dashboard)/      # Dashboard route group
│   │   │   │   │   ├── layout.tsx    # Dashboard layout (sidebar + topbar)
│   │   │   │   │   ├── page.tsx      # Dashboard home / overview
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   ├── page.tsx              # All projects list
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx          # Create new project
│   │   │   │   │   │   └── [projectId]/
│   │   │   │   │   │       ├── page.tsx          # Project board view
│   │   │   │   │   │       ├── tasks/
│   │   │   │   │   │       │   └── [taskId]/
│   │   │   │   │   │       │       └── page.tsx  # Task detail
│   │   │   │   │   │       ├── ai-chat/
│   │   │   │   │   │       │   └── page.tsx      # AI project assistant
│   │   │   │   │   │       └── settings/
│   │   │   │   │   │           └── page.tsx      # Project settings
│   │   │   │   │   ├── team/
│   │   │   │   │   │   ├── page.tsx              # Team members list
│   │   │   │   │   │   └── invite/
│   │   │   │   │   │       └── page.tsx          # Invite members
│   │   │   │   │   ├── ai/
│   │   │   │   │   │   ├── page.tsx              # AI features hub
│   │   │   │   │   │   ├── summarize/
│   │   │   │   │   │   │   └── page.tsx          # Summarize notes
│   │   │   │   │   │   └── suggest-tasks/
│   │   │   │   │   │       └── page.tsx          # AI task generation
│   │   │   │   │   ├── billing/
│   │   │   │   │   │   └── page.tsx              # Plans & subscription
│   │   │   │   │   ├── analytics/
│   │   │   │   │   │   └── page.tsx              # Charts & reports
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx              # Org settings
│   │   │   │   ├── (marketing)/      # Public marketing pages
│   │   │   │   │   ├── page.tsx      # Landing page
│   │   │   │   │   ├── pricing/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── about/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── admin/            # Super admin panel
│   │   │   │   │   ├── page.tsx      # Admin dashboard
│   │   │   │   │   ├── tenants/
│   │   │   │   │   │   └── page.tsx  # Manage all tenants
│   │   │   │   │   └── users/
│   │   │   │   │       └── page.tsx  # Manage all users
│   │   │   │   ├── layout.tsx        # Root layout
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── layout/           # Sidebar, Topbar, Footer
│   │   │   │   ├── forms/            # Login, Register, Task forms
│   │   │   │   ├── dashboard/        # Dashboard widgets
│   │   │   │   ├── projects/         # Project cards, boards
│   │   │   │   ├── tasks/            # Task cards, modals
│   │   │   │   ├── ai/               # AI chat, suggestion components
│   │   │   │   └── shared/           # Buttons, Modals, Loaders
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   │   ├── use-auth.ts
│   │   │   │   ├── use-tenant.ts
│   │   │   │   └── use-ai.ts
│   │   │   ├── lib/                  # Utility functions
│   │   │   │   ├── api-client.ts     # Axios/fetch wrapper
│   │   │   │   ├── auth.ts           # Token management
│   │   │   │   └── utils.ts
│   │   │   ├── providers/            # Context providers
│   │   │   │   ├── auth-provider.tsx
│   │   │   │   ├── tenant-provider.tsx
│   │   │   │   └── query-provider.tsx
│   │   │   ├── stores/               # Zustand stores
│   │   │   │   ├── auth-store.ts
│   │   │   │   └── ui-store.ts
│   │   │   └── types/                # TypeScript type definitions
│   │   │       ├── auth.ts
│   │   │       ├── project.ts
│   │   │       ├── task.ts
│   │   │       └── tenant.ts
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── main.ts               # App entry point
│       │   ├── app.module.ts         # Root module
│       │   ├── common/               # Shared utilities
│       │   │   ├── decorators/
│       │   │   │   ├── current-user.decorator.ts
│       │   │   │   ├── current-tenant.decorator.ts
│       │   │   │   └── roles.decorator.ts
│       │   │   ├── guards/
│       │   │   │   ├── jwt-auth.guard.ts
│       │   │   │   ├── roles.guard.ts
│       │   │   │   └── tenant.guard.ts
│       │   │   ├── interceptors/
│       │   │   │   ├── tenant.interceptor.ts     # Auto-injects tenantId
│       │   │   │   └── transform.interceptor.ts
│       │   │   ├── filters/
│       │   │   │   └── http-exception.filter.ts
│       │   │   ├── pipes/
│       │   │   │   └── validation.pipe.ts
│       │   │   └── dto/
│       │   │       └── pagination.dto.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── strategies/
│       │   │   │   │   ├── jwt.strategy.ts
│       │   │   │   │   ├── jwt-refresh.strategy.ts
│       │   │   │   │   └── google.strategy.ts
│       │   │   │   └── dto/
│       │   │   │       ├── register.dto.ts
│       │   │   │       ├── login.dto.ts
│       │   │   │       └── reset-password.dto.ts
│       │   │   ├── users/
│       │   │   │   ├── users.module.ts
│       │   │   │   ├── users.controller.ts
│       │   │   │   ├── users.service.ts
│       │   │   │   └── dto/
│       │   │   │       └── update-user.dto.ts
│       │   │   ├── tenants/
│       │   │   │   ├── tenants.module.ts
│       │   │   │   ├── tenants.controller.ts
│       │   │   │   ├── tenants.service.ts
│       │   │   │   └── dto/
│       │   │   │       ├── create-tenant.dto.ts
│       │   │   │       └── update-tenant.dto.ts
│       │   │   ├── projects/
│       │   │   │   ├── projects.module.ts
│       │   │   │   ├── projects.controller.ts
│       │   │   │   ├── projects.service.ts
│       │   │   │   └── dto/
│       │   │   │       ├── create-project.dto.ts
│       │   │   │       └── update-project.dto.ts
│       │   │   ├── tasks/
│       │   │   │   ├── tasks.module.ts
│       │   │   │   ├── tasks.controller.ts
│       │   │   │   ├── tasks.service.ts
│       │   │   │   └── dto/
│       │   │   │       ├── create-task.dto.ts
│       │   │   │       └── update-task.dto.ts
│       │   │   ├── ai/
│       │   │   │   ├── ai.module.ts
│       │   │   │   ├── ai.controller.ts
│       │   │   │   ├── ai.service.ts
│       │   │   │   ├── prompts/
│       │   │   │   │   ├── task-suggestion.prompt.ts
│       │   │   │   │   ├── summarize.prompt.ts
│       │   │   │   │   └── chat-assistant.prompt.ts
│       │   │   │   └── dto/
│       │   │   │       ├── suggest-tasks.dto.ts
│       │   │   │       ├── summarize.dto.ts
│       │   │   │       └── chat.dto.ts
│       │   │   ├── billing/
│       │   │   │   ├── billing.module.ts
│       │   │   │   ├── billing.controller.ts
│       │   │   │   ├── billing.service.ts
│       │   │   │   └── dto/
│       │   │   │       └── create-subscription.dto.ts
│       │   │   ├── notifications/
│       │   │   │   ├── notifications.module.ts
│       │   │   │   ├── notifications.controller.ts
│       │   │   │   ├── notifications.service.ts
│       │   │   │   └── notifications.gateway.ts  # WebSocket for real-time
│       │   │   ├── analytics/
│       │   │   │   ├── analytics.module.ts
│       │   │   │   ├── analytics.controller.ts
│       │   │   │   └── analytics.service.ts
│       │   │   └── admin/
│       │   │       ├── admin.module.ts
│       │   │       ├── admin.controller.ts
│       │   │       └── admin.service.ts
│       │   └── prisma/
│       │       ├── prisma.module.ts
│       │       └── prisma.service.ts
│       ├── prisma/
│       │   ├── schema.prisma             # Database schema
│       │   ├── migrations/               # Auto-generated migrations
│       │   └── seed.ts                   # Database seeding
│       ├── test/
│       │   └── app.e2e-spec.ts
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared code between frontend & backend
│       ├── src/
│       │   ├── types/                # Shared TypeScript interfaces
│       │   │   ├── auth.types.ts
│       │   │   ├── tenant.types.ts
│       │   │   ├── project.types.ts
│       │   │   ├── task.types.ts
│       │   │   └── api-response.types.ts
│       │   ├── constants/
│       │   │   ├── roles.ts          # ADMIN, MANAGER, MEMBER
│       │   │   ├── plans.ts          # FREE, PRO, ENTERPRISE
│       │   │   └── task-status.ts    # TODO, IN_PROGRESS, REVIEW, DONE
│       │   ├── validation/
│       │   │   └── schemas.ts        # Zod schemas (shared validation)
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docker/
│   ├── Dockerfile.web                # Frontend Dockerfile
│   ├── Dockerfile.api                # Backend Dockerfile
│   └── nginx.conf                    # Reverse proxy config
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + Test on PR
│       └── deploy.yml                # Auto deploy on merge to main
│
├── docker-compose.yml                # Local dev: app + postgres + redis
├── docker-compose.prod.yml           # Production compose
├── turbo.json                        # Turborepo config
├── pnpm-workspace.yaml               # pnpm monorepo workspace
├── package.json                      # Root package.json
├── .env.example                      # Environment variables template
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── PROJECT_BLUEPRINT.md              # This file
└── README.md
```

---

## 4. Database Schema (PostgreSQL + Prisma)

### Entity Relationship Overview

```
User ──────────┐
               │ (many-to-many via TenantMember)
               ▼
Tenant ────── TenantMember (role: ADMIN | MANAGER | MEMBER)
  │
  ├── Project
  │     ├── Task
  │     │     ├── TaskComment
  │     │     └── TaskAssignment
  │     └── AiConversation
  │           └── AiMessage
  │
  ├── Invitation
  ├── Subscription
  └── Notification
```

### Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USER ====================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String?                          // null if OAuth-only user
  firstName         String
  lastName          String
  avatarUrl         String?
  emailVerified     Boolean   @default(false)
  emailVerifyToken  String?
  resetPasswordToken String?
  resetPasswordExpiry DateTime?
  isSuperAdmin      Boolean   @default(false)        // Platform-level super admin
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  tenantMemberships TenantMember[]
  taskAssignments   TaskAssignment[]
  taskComments      TaskComment[]
  notifications     Notification[]
  aiConversations   AiConversation[]

  @@map("users")
}

// ==================== TENANT (Organization) ====================

model Tenant {
  id          String   @id @default(cuid())
  name        String                                  // "Ahmed Clothing Brand"
  slug        String   @unique                        // "ahmed-clothing" (URL-friendly)
  logoUrl     String?
  plan        Plan     @default(FREE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     TenantMember[]
  projects    Project[]
  invitations Invitation[]
  subscription Subscription?
  notifications Notification[]

  @@map("tenants")
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

// ==================== TENANT MEMBERSHIP ====================

model TenantMember {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  role      Role     @default(MEMBER)
  joinedAt  DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([userId, tenantId])                        // One membership per user per tenant
  @@map("tenant_members")
}

enum Role {
  ADMIN       // Can manage everything in the tenant
  MANAGER     // Can manage projects and members
  MEMBER      // Can work on assigned tasks
}

// ==================== PROJECT ====================

model Project {
  id          String        @id @default(cuid())
  tenantId    String
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  tasks       Task[]
  aiConversations AiConversation[]

  @@map("projects")
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}

// ==================== TASK ====================

model Task {
  id          String     @id @default(cuid())
  projectId   String
  tenantId    String                                  // Denormalized for faster tenant-scoped queries
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?
  position    Int        @default(0)                  // For drag-and-drop ordering
  aiGenerated Boolean    @default(false)              // Was this task created by AI?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignments TaskAssignment[]
  comments    TaskComment[]

  @@index([tenantId])
  @@index([projectId, status])
  @@map("tasks")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

// ==================== TASK ASSIGNMENT ====================

model TaskAssignment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  assignedAt DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([taskId, userId])
  @@map("task_assignments")
}

// ==================== TASK COMMENT ====================

model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("task_comments")
}

// ==================== AI CONVERSATION ====================

model AiConversation {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  title     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  AiMessage[]

  @@map("ai_conversations")
}

model AiMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           AiRole                               // USER or ASSISTANT
  content        String
  tokenCount     Int?
  createdAt      DateTime @default(now())

  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("ai_messages")
}

enum AiRole {
  USER
  ASSISTANT
}

// ==================== INVITATION ====================

model Invitation {
  id        String           @id @default(cuid())
  tenantId  String
  email     String
  role      Role             @default(MEMBER)
  status    InvitationStatus @default(PENDING)
  token     String           @unique
  expiresAt DateTime
  createdAt DateTime         @default(now())

  tenant    Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("invitations")
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
}

// ==================== SUBSCRIPTION / BILLING ====================

model Subscription {
  id                  String             @id @default(cuid())
  tenantId            String             @unique
  stripeCustomerId    String?
  stripeSubscriptionId String?
  plan                Plan               @default(FREE)
  status              SubscriptionStatus @default(ACTIVE)
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  tenant              Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

// ==================== NOTIFICATION ====================

model Notification {
  id        String           @id @default(cuid())
  userId    String
  tenantId  String
  type      NotificationType
  title     String
  message   String
  read      Boolean          @default(false)
  metadata  Json?                                     // Flexible data (taskId, projectId, etc.)
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant    Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@map("notifications")
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_COMPLETED
  TASK_COMMENT
  INVITATION
  PROJECT_UPDATE
  AI_SUGGESTION
  BILLING
}
```

---

## 5. API Architecture (REST)

### Base URL: `/api/v1`

### Authentication Endpoints

| Method | Endpoint                    | Description            | Auth Required |
| ------ | --------------------------- | ---------------------- | ------------- |
| POST   | `/auth/register`            | Register new user      | No            |
| POST   | `/auth/login`               | Login, get JWT tokens  | No            |
| POST   | `/auth/refresh`             | Refresh access token   | Refresh Token |
| POST   | `/auth/forgot-password`     | Send reset email       | No            |
| POST   | `/auth/reset-password`      | Reset password         | No            |
| GET    | `/auth/verify-email/:token` | Verify email           | No            |
| GET    | `/auth/google`              | Google OAuth           | No            |
| GET    | `/auth/google/callback`     | Google OAuth callback  | No            |
| GET    | `/auth/me`                  | Get current user       | Yes           |

### Tenant Endpoints

| Method | Endpoint                        | Description              | Auth / Role   |
| ------ | ------------------------------- | ------------------------ | ------------- |
| POST   | `/tenants`                      | Create new organization  | Yes           |
| GET    | `/tenants`                      | List user's tenants      | Yes           |
| GET    | `/tenants/:id`                  | Get tenant details       | MEMBER+       |
| PATCH  | `/tenants/:id`                  | Update tenant            | ADMIN         |
| DELETE | `/tenants/:id`                  | Delete tenant            | ADMIN         |
| GET    | `/tenants/:id/members`          | List tenant members      | MEMBER+       |
| PATCH  | `/tenants/:id/members/:userId`  | Update member role       | ADMIN         |
| DELETE | `/tenants/:id/members/:userId`  | Remove member            | ADMIN         |
| POST   | `/tenants/:id/invitations`      | Invite member by email   | ADMIN/MANAGER |
| POST   | `/tenants/join/:token`          | Accept invitation        | Yes           |

### Project Endpoints

| Method | Endpoint                      | Description          | Auth / Role    |
| ------ | ----------------------------- | -------------------- | -------------- |
| POST   | `/projects`                   | Create project       | ADMIN/MANAGER  |
| GET    | `/projects`                   | List tenant projects | MEMBER+        |
| GET    | `/projects/:id`               | Get project details  | MEMBER+        |
| PATCH  | `/projects/:id`               | Update project       | ADMIN/MANAGER  |
| DELETE | `/projects/:id`               | Delete project       | ADMIN          |

### Task Endpoints

| Method | Endpoint                           | Description            | Auth / Role   |
| ------ | ---------------------------------- | ---------------------- | ------------- |
| POST   | `/projects/:projectId/tasks`       | Create task            | MANAGER+      |
| GET    | `/projects/:projectId/tasks`       | List project tasks     | MEMBER+       |
| GET    | `/tasks/:id`                       | Get task details       | MEMBER+       |
| PATCH  | `/tasks/:id`                       | Update task            | MEMBER+       |
| DELETE | `/tasks/:id`                       | Delete task            | MANAGER+      |
| POST   | `/tasks/:id/assign`                | Assign user to task    | MANAGER+      |
| DELETE | `/tasks/:id/assign/:userId`        | Unassign user          | MANAGER+      |
| POST   | `/tasks/:id/comments`              | Add comment            | MEMBER+       |
| PATCH  | `/tasks/:id/status`                | Update task status     | MEMBER+       |

### AI Endpoints

| Method | Endpoint                                    | Description                 | Auth / Role |
| ------ | ------------------------------------------- | --------------------------- | ----------- |
| POST   | `/ai/suggest-tasks`                         | AI generates sub-tasks      | MEMBER+     |
| POST   | `/ai/summarize`                             | AI summarizes text          | MEMBER+     |
| POST   | `/ai/categorize-task`                       | AI categorizes/prioritizes  | MEMBER+     |
| POST   | `/projects/:projectId/ai-chat`              | Send message to AI assistant| MEMBER+     |
| GET    | `/projects/:projectId/ai-chat/conversations`| List AI conversations       | MEMBER+     |
| GET    | `/ai-chat/conversations/:id/messages`       | Get conversation messages   | MEMBER+     |

### Billing Endpoints

| Method | Endpoint                          | Description                    | Auth / Role |
| ------ | --------------------------------- | ------------------------------ | ----------- |
| GET    | `/billing/plans`                  | List available plans           | Yes         |
| GET    | `/billing/subscription`           | Get current subscription       | ADMIN       |
| POST   | `/billing/checkout`               | Create Stripe checkout session | ADMIN       |
| POST   | `/billing/portal`                 | Create Stripe billing portal   | ADMIN       |
| POST   | `/billing/webhook`                | Stripe webhook handler         | No (Stripe) |

### Notification Endpoints

| Method | Endpoint                         | Description             | Auth |
| ------ | -------------------------------- | ----------------------- | ---- |
| GET    | `/notifications`                 | List user notifications | Yes  |
| PATCH  | `/notifications/:id/read`        | Mark as read            | Yes  |
| PATCH  | `/notifications/read-all`        | Mark all as read        | Yes  |

### Analytics Endpoints

| Method | Endpoint                     | Description                    | Auth / Role    |
| ------ | ---------------------------- | ------------------------------ | -------------- |
| GET    | `/analytics/overview`        | Tenant-level stats             | ADMIN/MANAGER  |
| GET    | `/analytics/projects/:id`    | Project-level stats            | MEMBER+        |
| GET    | `/analytics/tasks`           | Task completion analytics      | ADMIN/MANAGER  |

### Admin Endpoints (Super Admin Only)

| Method | Endpoint                    | Description            | Auth         |
| ------ | --------------------------- | ---------------------- | ------------ |
| GET    | `/admin/tenants`            | List all tenants       | Super Admin  |
| GET    | `/admin/users`              | List all users         | Super Admin  |
| GET    | `/admin/stats`              | Platform-wide stats    | Super Admin  |
| PATCH  | `/admin/tenants/:id`        | Update any tenant      | Super Admin  |
| DELETE | `/admin/tenants/:id`        | Delete any tenant      | Super Admin  |

---

## 6. Authentication & Authorization Flow

### JWT Token Strategy

```
1. User logs in → Server returns:
   - Access Token (short-lived: 15 minutes)
   - Refresh Token (long-lived: 7 days, stored in httpOnly cookie)

2. Every API request includes: Authorization: Bearer <accessToken>

3. When access token expires → Frontend automatically calls /auth/refresh
   → Gets new access token using refresh token cookie

4. When refresh token expires → User must log in again
```

### Multi-Tenant Authorization Flow

```
1. User logs in → Gets JWT with { userId, email }
2. User selects a tenant (organization) → tenantId stored in frontend state
3. Every API request includes: x-tenant-id header
4. Backend TenantGuard:
   a. Extracts tenantId from header
   b. Checks if user is a member of that tenant (via TenantMember table)
   c. Checks if user's role in that tenant has permission for the action
   d. Injects tenantId into the request for query scoping
5. All database queries are automatically scoped: WHERE tenantId = :tenantId
```

### Role-Based Access Control (RBAC)

```
ADMIN:
  - Full control over tenant settings, billing, members
  - Can create/delete projects
  - Can manage all tasks
  - Can invite/remove members

MANAGER:
  - Can create/edit projects
  - Can create/assign/delete tasks
  - Can invite members
  - Cannot change billing or delete tenant

MEMBER:
  - Can view projects they have access to
  - Can update task status (move cards)
  - Can comment on tasks
  - Can use AI features
  - Cannot create projects or manage members
```

---

## 7. Multi-Tenant Architecture Details

### Strategy: Shared Database, Shared Schema, Tenant-Scoped Rows

All tenants share the same PostgreSQL database and tables. Tenant isolation is enforced by:

1. **Every tenant-scoped table has a `tenantId` column** — Projects, Tasks, Notifications, etc.
2. **TenantInterceptor** — NestJS interceptor that automatically injects `tenantId` into every request after the TenantGuard validates membership.
3. **All queries include `WHERE tenantId = ?`** — Prisma queries always filter by tenantId.
4. **Database indexes on tenantId** — For query performance.

### Why This Strategy?

- **Simplicity**: One database, one schema, one deployment.
- **Cost-effective**: Free tier databases work fine.
- **Good enough**: For a portfolio project and small-to-medium SaaS, this is the industry-standard approach. Companies like Notion, Linear, and Slack use variations of this.
- **Alternatives exist** (separate databases per tenant, separate schemas per tenant) but are overkill for this project.

---

## 8. AI Integration Architecture

### Ollama (Local AI - FREE)

```
┌──────────────┐     HTTP API      ┌──────────────┐
│  NestJS API  │ ──────────────►   │  Ollama      │
│  (AI Module) │   localhost:11434 │  (LLaMA 3)   │
└──────────────┘                   └──────────────┘
```

- **Ollama** runs on the developer's machine (or server).
- NestJS AI service sends HTTP requests to Ollama's local API.
- **No API key needed. No cost. Fully offline.**
- Models: LLaMA 3.1 8B (good balance of speed + quality) or Mistral 7B.

### LangChain.js Integration

```typescript
// Simplified example of how AI service works

import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatOllama({
  model: "llama3.1",
  baseUrl: "http://localhost:11434",
});

// Task Suggestion Prompt
const taskSuggestionPrompt = PromptTemplate.fromTemplate(`
  You are a project management AI assistant.
  The user wants to achieve the following goal:
  "{goal}"

  The project context is:
  Project Name: {projectName}
  Existing Tasks: {existingTasks}

  Generate 5-8 actionable sub-tasks. Return as JSON array:
  [{{ "title": "...", "priority": "HIGH|MEDIUM|LOW", "description": "..." }}]
`);
```

### AI Features Implementation Plan

| Feature              | Input                        | AI Does                              | Output                    |
| -------------------- | ---------------------------- | ------------------------------------ | ------------------------- |
| Task Suggestion      | Goal string + project context | Breaks goal into sub-tasks          | Array of task objects      |
| Summarize            | Raw text (meeting notes)     | Extracts key points, decisions       | Structured summary         |
| Auto-Categorize      | Task title + description     | Assigns priority + category          | Priority + labels          |
| Project Chat         | User question + project data | Answers using project context        | Chat response              |
| Weekly Digest        | Week's activity data         | Summarizes progress + blockers       | Digest text                |

---

## 9. Real-Time Features (WebSocket)

### Using NestJS Gateway (Socket.io)

Real-time updates for:
- **Task status changes** — When someone moves a task, everyone sees it live.
- **New notifications** — Instant notification popup.
- **AI response streaming** — AI chat responses stream token by token.

```
Frontend (Next.js) ◄──── WebSocket ────► Backend (NestJS Gateway)
     Socket.io client                      Socket.io server
```

---

## 10. Key Environment Variables

```env
# .env.example

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/nexora?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_ACCESS_SECRET="your-access-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Ollama AI
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1"

# Stripe (Test Mode - Free)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."

# Email (Development: use Ethereal free fake SMTP)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your-ethereal-user"
SMTP_PASS="your-ethereal-pass"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/google/callback"

# App
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
NODE_ENV="development"
```

---

## 11. Subscription Plans & Limits

| Feature                   | FREE        | PRO ($29/mo)    | ENTERPRISE ($99/mo) |
| ------------------------- | ----------- | --------------- | -------------------- |
| Team Members              | 3           | 20              | Unlimited            |
| Projects                  | 2           | Unlimited       | Unlimited            |
| Tasks per Project         | 50          | Unlimited       | Unlimited            |
| AI Requests per Day       | 10          | 100             | Unlimited            |
| File Storage              | 500 MB      | 10 GB           | 50 GB                |
| AI Chat History           | 7 days      | 90 days         | Unlimited            |
| Priority Support          | No          | Email           | Dedicated            |
| Custom Branding           | No          | No              | Yes                  |
| API Access                | No          | No              | Yes                  |
| Analytics                 | Basic       | Advanced        | Advanced + Export    |

---

## 12. Linear.app Comparison — What Nexora Has vs What's Missing

> This section tracks Nexora's feature parity with Linear.app (the gold standard for project management SaaS).

### ✅ Already Built (Phases 1–7)

| Feature | Linear Equivalent | Status |
| ------- | ----------------- | ------ |
| Multi-tenant workspaces | Workspaces | ✅ Done |
| Invite members by email | Invite team | ✅ Done |
| Role-based access (Admin/Manager/Member) | Admin/Member roles | ✅ Done |
| Project CRUD | Teams + Projects | ✅ Done |
| Task CRUD with priorities | Issues | ✅ Done |
| Kanban board (drag-and-drop) | Board view | ✅ Done |
| Task detail panel (description, assign, due date, labels) | Issue detail | ✅ Done |
| Task comments | Issue comments | ✅ Done |
| Task labels/tags | Labels | ✅ Done |
| Task title inline edit | Inline edit | ✅ Done |
| Task search + priority filter | Filters | ✅ Done |
| Real-time updates (WebSocket) | Live sync | ✅ Done |
| In-app notifications (bell + badge) | Notification inbox | ✅ Done |
| AI task suggestions | Linear AI | ✅ Done |
| AI summarize | Linear AI | ✅ Done |
| AI chat assistant | Linear AI | ✅ Done |
| Analytics dashboard | Insights | ✅ Done |
| Stripe billing (Free/Pro/Enterprise) | Linear billing | ✅ Done |
| Profile edit + password change | Profile settings | ✅ Done |
| Global search | Command + search | ✅ Done |

### ❌ Missing — Planned in New Phases Below

| Missing Feature | Linear Equivalent | Priority | Phase |
| --------------- | ----------------- | -------- | ----- |
| Forgot password + reset email | Account recovery | 🔴 High | 8 |
| Email verification on register | Email verify | 🔴 High | 8 |
| Google OAuth | Google login | 🟡 Medium | 8 |
| "My Tasks" personal view | My Issues | 🔴 High | 9 |
| Activity feed UI (already logged in DB) | Activity log | 🟡 Medium | 9 |
| Toast/Command palette (⌘K) | Command menu | 🟡 Medium | 9 |
| Keyboard shortcuts | Keyboard shortcuts | 🟢 Low | 9 |
| Task list view (table layout) | List view | 🟡 Medium | 10 |
| Sub-tasks (nested tasks) | Sub-issues | 🟡 Medium | 10 |
| Task relations (blocks / related to) | Issue relations | 🟢 Low | 10 |
| Task templates | Templates | 🟢 Low | 10 |
| File attachments on tasks | Attachments | 🟡 Medium | 11 |
| @mentions in comments | Mentions | 🟡 Medium | 11 |
| Emoji reactions on comments | Reactions | 🟢 Low | 11 |
| Sprint / Cycle planning | Cycles | 🟡 Medium | 12 |
| Project milestones | Milestones | 🟢 Low | 12 |
| Timeline / Gantt view | Timeline view | 🟢 Low | 12 |
| Custom workflow statuses per project | Custom states | 🟢 Low | 12 |
| Super admin panel | N/A (internal) | 🟡 Medium | 13 |
| Marketing landing page | Linear.app home | 🔴 High | 13 |
| Light/dark theme toggle | System/manual | 🟡 Medium | 13 |
| Email notifications (Nodemailer) | Email notifs | 🟡 Medium | 8 |
| Plan limits enforcement in API | Quota checks | 🔴 High | 9 |
| Project archive UI | Archive project | 🟢 Low | 9 |
| CSV data export | Export | 🟢 Low | 13 |
| Mobile responsive improvements | Mobile app | 🟡 Medium | 14 |
| Deploy (Vercel + Railway) | Hosted SaaS | 🔴 High | 14 |

---

## 13. Implementation Phases

### Phase 1: Foundation (Setup + Auth) ✅ COMPLETE
- Monorepo setup (Turborepo + pnpm)
- Docker Compose (PostgreSQL + Redis)
- NestJS project scaffolding
- Next.js project scaffolding
- Prisma schema + initial migration
- Authentication (register, login, JWT, refresh tokens)
- Basic frontend pages (login, register)

### Phase 2: Multi-Tenant Core ✅ COMPLETE
- Tenant (organization) CRUD
- Tenant membership system
- Invitation system (invite by email, token-based join)
- Role-based access control (guards + decorators)
- Tenant switching on frontend
- Workspace settings (edit name, upload logo)

### Phase 3: Project Management ✅ COMPLETE
- Project CRUD
- Task CRUD with full detail panel
- Task assignment + unassign
- Task comments
- Task labels (create, assign, color-coded)
- Drag-and-drop Kanban board (dnd-kit)
- Task search + priority filter
- Inline task title editing

### Phase 4: AI Features ✅ COMPLETE
- Groq API integration (LLaMA 3.3-70b, free tier)
- AI task suggestion from goal + context
- AI text summarization
- AI chat assistant with quick prompts

### Phase 5: Billing & Subscriptions ✅ COMPLETE
- Stripe integration (test mode)
- Free / Pro ($12) / Enterprise ($49) plans
- Checkout session flow → Stripe hosted page
- Customer billing portal
- Settings page with plan cards

### Phase 6: Real-Time (WebSockets) ✅ COMPLETE
- Socket.io NestJS Gateway
- Tenant + Project + User rooms
- Live task:created / task:updated / task:deleted events
- notification:new event with UI bell update

### Phase 7: Analytics Dashboard ✅ COMPLETE
- 4 stat cards (total, completed, in-progress, completion rate)
- Tasks by Status donut chart (Recharts PieChart)
- Tasks by Priority bar chart
- 7-Day Task Trend line chart
- Top Assignees horizontal bar chart
- Project Progress bars

### Phase 8: Auth Completion + Email System
- Forgot password flow (request reset → email link → reset form)
- Email verification on registration (Nodemailer + Ethereal for dev)
- Resend verification email button in settings
- Google OAuth (Passport.js google strategy)
- Email notifications for: task assigned, task commented, invitation received
- Notification preference toggles (in-app vs email per type)

### Phase 9: Power User Features + UX Gaps
- "My Tasks" page — personal view showing all tasks assigned to logged-in user across projects
- Activity feed page — UI for the activity_log already stored in DB
- Plan limits enforcement — API guards for member/project/task counts per plan
- Project archive/unarchive with archived projects section
- Copy link to task (clipboard)
- Duplicate task feature
- Keyboard shortcut: `N` = new task, `Escape` = close panel, `C` = comment focus

### Phase 10: List View + Sub-tasks + Relations
- Task list view (table layout alongside existing Kanban board — toggle switch)
- Sub-tasks — nested tasks under a parent task (parent_task_id FK in DB)
- Sub-task progress indicator on parent card
- Task relations: "blocks" / "is blocked by" / "related to"
- Task templates — save a task configuration as reusable template
- Bulk task actions (select multiple → change status/priority)

### Phase 11: Attachments + Rich Comments
- File attachments on tasks (upload to local storage or S3-compatible)
- Image preview in task detail panel
- @mention system in comments (type @ to get member autocomplete)
- Notification triggered when @mentioned
- Emoji reactions on comments (👍 ✅ 🔥 etc.)
- Rich text editor for task descriptions (markdown or tiptap)

### Phase 12: Sprints + Milestones + Custom Workflow
- Sprint/Cycle planning — define start/end dates, add tasks to a sprint
- Sprint velocity chart in analytics
- Project milestones — named checkpoints with due dates
- Custom workflow statuses per project (rename/add columns)
- Timeline view (horizontal Gantt chart for tasks with due dates)
- Project-level AI chat with full project context (tasks + activity)

### Phase 13: Super Admin + Landing Page + Polish
- Super admin panel (separate route, isSuperAdmin guard)
  - View all tenants, users, platform stats
  - Manually change tenant plan
  - Impersonate / suspend account
- Marketing landing page (/, /pricing, /features)
  - Hero section, feature highlights, pricing table
  - CTA → Register
- Light/dark theme toggle (stored in user preferences + localStorage)
- CSV export for tasks and analytics data
- Improved mobile responsive layout (sidebar collapses, bottom nav on mobile)
- Empty states and improved error handling across all pages

### Phase 14: Deploy & Production Readiness
- Environment variable audit + secrets management
- Stripe webhook wiring with deployed URL
- Docker production Dockerfiles (multi-stage builds)
- CI/CD pipeline (GitHub Actions: lint + test on PR, deploy on merge to main)
- Deploy backend → Railway (with PostgreSQL add-on)
- Deploy frontend → Vercel
- Custom domain setup
- README.md + documentation update

---

## 14. What You Will Learn (Learning Outcomes)

| Phase | Skills Gained |
| ----- | ------------- |
| Phase 1 | Monorepo management, NestJS fundamentals, Prisma ORM, JWT auth |
| Phase 2 | Multi-tenant architecture, RBAC, middleware/guards pattern |
| Phase 3 | CRUD patterns, relational data modeling, Kanban UI, dnd-kit drag-and-drop |
| Phase 4 | AI API integration, prompt engineering, Groq/LLM usage, free AI APIs |
| Phase 5 | Payment integration, Stripe checkout/portal, subscription logic |
| Phase 6 | WebSockets, Socket.io, real-time architecture, event-driven patterns |
| Phase 7 | Data aggregation queries, Recharts, analytics UX design |
| Phase 8 | Nodemailer, OAuth (Passport.js), email flows, token expiry patterns |
| Phase 9 | Feature flags, plan limit enforcement, UX polish, keyboard accessibility |
| Phase 10 | Recursive data structures (sub-tasks), graph relations, table UI |
| Phase 11 | File upload (multipart/S3), rich text editors, mention parsing |
| Phase 12 | Sprint/iteration planning UX, Gantt chart, custom workflow design |
| Phase 13 | Admin panel architecture, landing page conversion design, theming |
| Phase 14 | Docker multi-stage builds, CI/CD, cloud deployment, production config |

---

## 15. Commands Quick Reference

```bash
# Install dependencies
pnpm install

# Start all services (database + redis + app)
docker-compose up -d

# Run database migrations
pnpm --filter api prisma migrate dev

# Seed database
pnpm --filter api prisma db seed

# Start development (both frontend + backend)
pnpm dev

# Start only frontend
pnpm --filter web dev

# Start only backend
pnpm --filter api start:dev

# Generate Prisma client
pnpm --filter api prisma generate

# Open Prisma Studio (visual database browser)
pnpm --filter api prisma studio

# Run tests
pnpm test

# Lint
pnpm lint

# Build for production
pnpm build
```

---

*This blueprint was created as the foundation for the Nexora project. Every implementation decision should refer back to this document for consistency.*
