# Agency Manager

Agency Manager is a full-stack, real-time internal dashboard designed for agencies to manage client projects, assign and track tasks, monitor live team activity, and automatically detect overdue work.

---

## Table of Contents

- Overview
- Tech Stack
- Database Schema
- Local Setup Instructions
- Default Seed Credentials
- Architectural Decisions
- Role and Permission Matrix
- Known Limitations

---

## Overview

The platform provides a centralized operational tool for agency personnel:
- Admins oversee all clients, projects, tasks, user assignments, and real-time online presence.
- Project Managers manage their respective client projects, assign tasks, and monitor project-specific activity feeds.
- Developers view and update tasks assigned to them with real-time status transitions.
- Background jobs run periodically to flag overdue tasks without requiring manual interaction or client-side calculation.
- Native WebSockets power real-time updates for task activity, notification badges, and live presence.

---

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite build tooling
- TanStack Query (React Query) for REST data caching and server state synchronization
- Zustand for WebSocket-pushed ephemeral state (presence, notifications, live activity feeds)
- Tailwind CSS with Framer Motion for interface styling and transitions
- React Router DOM for client-side routing

### Backend
- Node.js with Fastify
- TypeScript and TSX runtime
- Prisma ORM with PostgreSQL
- Native WebSockets via `@fastify/websocket`
- JWT authentication (`@fastify/jwt`) with HttpOnly cookie support
- `node-cron` for scheduled background operations
- Zod for runtime schema validation

### Monorepo Tooling
- pnpm Workspaces (`backend`, `frontend`)

---

## Database Schema

```mermaid
erDiagram
    User ||--o{ Client : "creates"
    User ||--o{ Project : "creates (PM/Admin)"
    User ||--o{ Task : "assigned to (Developer)"
    User ||--o{ TaskActivityLog : "performs"
    User ||--o{ Notification : "receives"
    
    Client ||--o{ Project : "has"
    Project ||--o{ Task : "contains"
    Task ||--o{ TaskActivityLog : "records"
    Task ||--o{ Notification : "triggers"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        Role role
        datetime createdAt
    }

    Client {
        string id PK
        string name
        string contactInfo
        string createdBy FK
    }

    Project {
        string id PK
        string name
        string clientId FK
        string createdBy FK
        datetime createdAt
    }

    Task {
        string id PK
        string title
        string description
        string projectId FK
        string assignedTo FK
        TaskStatus status
        TaskPriority priority
        datetime dueDate
        boolean isOverdue
        datetime createdAt
    }

    TaskActivityLog {
        string id PK
        string taskId FK
        string userId FK
        TaskStatus fromStatus
        TaskStatus toStatus
        datetime timestamp
    }

    Notification {
        string id PK
        string userId FK
        NotificationType type
        string message
        string relatedTaskId FK
        boolean isRead
        datetime createdAt
    }
```

### Enums

- **Role**: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`
- **TaskStatus**: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`
- **TaskPriority**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **NotificationType**: `TASK_ASSIGNED`, `TASK_MOVED_TO_REVIEW`, `TASK_OVERDUE`

---

## Local Setup Instructions

### 1. Prerequisites

Ensure you have the following installed on your system:
- Node.js (v18.0.0 or higher)
- pnpm (v9.0.0 or higher)
- Docker and Docker Compose (optional, for running local PostgreSQL)

### 2. Clone and Install Dependencies

Clone the repository and install all workspace dependencies from the root directory:

```bash
git clone https://github.com/Sri-Aryan/agency-manager.git
cd agency-manager
pnpm install
```

### 3. Database Setup

You can use Docker Compose to start a local PostgreSQL instance, or connect to an existing PostgreSQL database (such as Neon or Supabase).

To run PostgreSQL via Docker Compose:

```bash
docker-compose up -d
```

The database container runs on `localhost:5432` with the credentials configured in `docker-compose.yml`:
- User: `johndoe`
- Password: `randompassword`
- Database Name: `mydb`

### 4. Environment Variables Configuration

Create a `.env` file in the `backend/` directory:

```env
# backend/.env
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
JWT_SECRET="development_jwt_secret_key_change_in_production_min_16_chars"
PORT=3000
NODE_ENV=development
```

### 5. Apply Database Migrations and Seed

Run Prisma commands from within the `backend` directory or using root workspace filters:

```bash
# Push schema to database
pnpm --filter backend db:push

# Seed default admin and developer users with sample tasks
pnpm --filter backend exec tsx prisma/seed.ts
```

### 6. Running the Application

Run both backend and frontend services in development mode:

**Start Backend:**
```bash
pnpm dev:backend
# or: cd backend && pnpm dev
```
Backend API and WebSocket server will run at `http://localhost:3000`.

**Start Frontend:**
```bash
pnpm dev:frontend
# or: cd frontend && pnpm dev
```
Frontend client will run at `http://localhost:5173` (or next available port).

---

## Default Seed Credentials

After running the seed script, the following accounts are available for testing:

| Role | Email | Password | Scope / Permissions |
|---|---|---|---|
| Admin | `admin@agency.local` | `admin123` | Full access across all clients, projects, tasks, user lists, and global presence metrics |
| Developer | `dev@agency.local` | `dev123` | Access restricted strictly to own assigned tasks, personal notifications, and status updates |

---

## Architectural Decisions

### 1. Fastify over Express
- High-performance asynchronous request pipeline with minimal overhead.
- Built-in schema validation support and optimized JSON serialization.
- First-party `@fastify/websocket` integration allowing HTTP and WebSocket handling on the same port without extra proxy configurations.

### 2. Native WebSockets over Socket.io
- Avoids the overhead of long-polling fallbacks and heavy client-side libraries.
- Implements direct role-based and project-based room subscriptions (`GLOBAL`, `PROJECT_{id}`, and direct user channels).
- Eliminates abstraction mismatch between generic pub/sub and custom authorization scoping.

### 3. State Management Split (React Query + Zustand)
- **TanStack Query (React Query)**: Handles all REST-based server state (fetching projects, tasks, clients, and activity history). Manages caching, query invalidation, and URL filter parameter synchronization.
- **Zustand**: Manages lightweight, high-frequency ephemeral data pushed via WebSocket (live presence counter, unread notification counter, instant activity feed appends).
- When a task update arrives via WebSocket, the corresponding React Query cache is selectively invalidated to maintain data consistency.

### 4. Server-Side Role and Ownership Enforcement
- All authorization checks are executed at the Fastify API route layer via custom pre-handler middleware.
- Verifies both the user's role and resource ownership (e.g., Project Managers can only modify projects they created; Developers can only update tasks assigned to them).
- Client UI role checks serve purely as presentation logic, preventing unauthorized access regardless of direct API manipulation.

### 5. Scheduled Background Jobs (`node-cron`)
- Overdue task detection runs as a background cron worker (`*/15 * * * *`).
- The job queries non-completed tasks where `dueDate < now()`, updates `isOverdue = true`, and dispatches notification records to the project creators.
- Chosen over distributed queue systems (like BullMQ) to avoid additional Redis infrastructure dependencies for single-instance operations.

### 6. Database Indexing Strategy
- `Task(projectId)`: Optimizes project detail views querying all project-related tasks.
- `Task(assignedTo)`: Accelerates developer dashboard queries filtered by assignee.
- `Task(dueDate)`: Supports high-performance overdue checks in background sweeps.
- `TaskActivityLog(taskId, timestamp)`: Composite lookup for chronologically ordered task audit logs.
- `Notification(userId, isRead)`: Optimizes unread badge count queries.

---

## Role and Permission Matrix

| Capability | Admin | Project Manager | Developer |
|---|---|---|---|
| Manage Clients (Create / Edit / Delete) | Yes | No | No |
| Create and Manage Projects | Yes (All) | Yes (Own Only) | No |
| Assign Tasks to Developers | Yes (All) | Yes (Own Projects) | No |
| View Task List | All Projects | Own Projects | Assigned Tasks Only |
| Update Task Status | Yes (All) | Yes (Own Projects) | Assigned Tasks Only |
| View Activity Feed | Global (All) | Own Projects | Assigned Tasks Only |
| View Real-time Online Presence | Global Count | Project Scope | No |
| User Administration | Yes | No | No |

---

## Known Limitations

1. **Single-Instance In-Memory WebSocket State**
   The WebSocket connection registry and active room subscriptions are maintained in server memory. Horizontal scaling across multiple backend nodes requires introducing a distributed message broker (such as Redis Pub/Sub).

2. **In-Process Cron Job Execution**
   The `node-cron` overdue scanner runs inside the Fastify application process. Running multiple application replicas without a centralized lock would lead to duplicate task checks and duplicate notifications.

3. **Stateless JWT Revocation**
   Access tokens are stateless and valid until expiration. Immediate token revocation requires implementing a token blocklist (via Redis or database lookup) rather than relying strictly on expiration lifespans.

4. **Internal Use Only**
   The application is designed for internal agency workflows and does not provide public client access portals, multi-tenant workspace isolation, or client billing modules.

5. **Local Catch-Up Feed Boundary**
   On WebSocket reconnection, client feeds fetch up to the last 20 persisted activity items from the database. Full historic timelines require standard paginated REST queries.
