# Technology Stack

## Architecture

**モノレポ + フルスタックTypeScript**  
フロントエンドとバックエンドを単一リポジトリで管理し、型定義を共有可能な構成。

## Core Technologies

- **Language**: TypeScript 5.6+ (strict mode)
- **Runtime**: Node.js 20+
- **Package Manager**: Yarn 4.x (Workspaces)
- **Frontend Framework**: React 18.3 + Vite 5.4
- **Backend Framework**: Express 4.21
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma 5.22

## Key Libraries

### Frontend
- **State Management**: Redux Toolkit + Redux Saga
  - Redux Toolkit for reducers and actions
  - Redux Saga for side effects (API calls)
- **Router**: React Router 6.28
- **UI Library**: PrimeReact 10.8 (with PrimeFlex, PrimeIcons)

### Backend
- **API**: Express with TypeScript
- **CORS**: `cors` middleware for cross-origin requests
- **Environment**: `dotenv` for configuration

## Development Standards

### Type Safety
- TypeScript strict mode enabled
- `@typescript-eslint` for linting
- Avoid `any` type (warn level)
- Unused parameters prefixed with `_`

### Code Quality
- **ESLint**: Flat config with TypeScript, React, React Hooks plugins
- **Prettier**: Single quotes, 2-space tabs, 100 print width, trailing commas
- **Pre-formatted**: ESLint + Prettier integration via `eslint-config-prettier`

### Module System
- ES Modules (`"type": "module"`)
- `.js` extensions in imports (Node.js ESM requirement)
- `bundler` module resolution for frontend
- Path alias `@/` maps to `frontend/src/`

### Testing
- Currently no test framework configured (planned: Jest/Vitest)

## Development Environment

### Required Tools
- Node.js 20.x or higher
- Yarn 4.12.0 (managed via `packageManager` field)
- Docker & Docker Compose (for PostgreSQL)

### Common Commands
```bash
# Dev servers (concurrent)
yarn dev                # Frontend (5173) + Backend (3001)
yarn dev:frontend       # Vite dev server only
yarn dev:backend        # Express + tsx watch mode only

# Build
yarn build              # Build all workspaces
yarn build:frontend     # Vite build
yarn build:backend      # tsc compile

# Code quality
yarn lint               # ESLint check
yarn lint:fix           # ESLint auto-fix
yarn format             # Prettier format
yarn format:check       # Prettier validation

# Database
yarn db:up              # Start PostgreSQL container
yarn db:down            # Stop container
yarn db:migrate         # Run Prisma migrations
yarn db:generate        # Generate Prisma Client
yarn db:studio          # Open Prisma Studio
```

## Key Technical Decisions

### Monorepo with Yarn Workspaces
- **Why**: Share configurations, dependencies, and type definitions
- **Structure**: `packages/frontend` and `packages/backend`
- **Scripts**: Root-level commands orchestrate workspace tasks

### Redux Saga over Redux Thunk
- **Why**: Better async flow control, testability, and separation of concerns
- **Pattern**: Request/Success/Failure actions for API calls

### Prisma ORM
- **Why**: Type-safe database access, auto-generated client, migration management
- **Schema**: Single `Todo` model with timestamps

### ESM Everywhere
- **Why**: Modern standard, better tree-shaking, future-proof
- **Tradeoff**: Requires `.js` extensions in imports for Node.js

### Vite over Create React App
- **Why**: Faster development server, better build performance, modern tooling

---
_created_at: 2026-02-01_
