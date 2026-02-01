# Project Structure

## Organization Philosophy

**Monorepo with Feature-First Frontend**  
Yarn Workspacesでフロントエンドとバックエンドを分離し、フロントエンドは機能別にモジュール化。バックエンドはシンプルなルートベース構成。

## Directory Patterns

### Root Level
**Location**: `/`  
**Purpose**: モノレポ管理とグローバル設定  
**Contains**:
- `packages/` - ワークスペースパッケージ (frontend, backend)
- `docker-compose.yml` - PostgreSQL環境
- Global configs: ESLint, Prettier, TypeScript base

### Frontend Package
**Location**: `/packages/frontend/`  
**Purpose**: React SPAアプリケーション  
**Structure**:
```
src/
  features/        # 機能別モジュール (todos, etc.)
    {feature}/
      components/  # Feature-specific React components
      types.ts     # Type definitions
      {feature}Slice.ts   # Redux slice (state + reducers)
      {feature}Saga.ts    # Redux saga (side effects)
      index.ts     # Public exports
  store/           # Redux store configuration
    index.ts       # Store setup with middleware
    rootSaga.ts    # Combined sagas
    hooks.ts       # Typed useDispatch/useSelector
  router/          # React Router configuration
  main.tsx         # Application entry point
  App.tsx          # Root component
```

### Backend Package
**Location**: `/packages/backend/`  
**Purpose**: Express REST APIサーバー  
**Structure**:
```
src/
  routes/          # API route handlers
    {resource}.ts  # CRUD endpoints per resource
  index.ts         # Server setup and middleware
prisma/
  schema.prisma    # Database schema
  migrations/      # Prisma migrations
```

## Naming Conventions

- **Files (Frontend)**: PascalCase for components (`TodoList.tsx`), camelCase for modules (`todosSlice.ts`)
- **Files (Backend)**: camelCase for all files (`todos.ts`)
- **Components**: PascalCase, match filename
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Redux**:
  - Slices: `{feature}Slice.ts`
  - Sagas: `{feature}Saga.ts`
  - Actions: `{verb}{Resource}{Status}` (e.g., `fetchTodosRequest`)

## Import Organization

### Frontend (Vite + Path Alias)
```typescript
// External dependencies first
import React from 'react';
import { useDispatch } from 'react-redux';

// Path alias (@/ maps to src/)
import { useAppDispatch } from '@/store/hooks';

// Relative imports
import { TodoList } from './components/TodoList';
import { Todo } from './types';
```

**Path Aliases**:
- `@/` → `packages/frontend/src/`

### Backend (Node.js ESM)
```typescript
// External dependencies
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Relative imports (require .js extension)
import todosRouter from './routes/todos.js';
```

**Key Rule**: Node.js ESM requires `.js` extensions even for `.ts` source files.

## Code Organization Principles

### Feature-First (Frontend)
- Each feature is self-contained: components, state, types, side effects
- Export public API through `index.ts`
- Keep feature-specific logic isolated

### Layered Architecture (Backend)
- Routes handle HTTP layer (validation, response formatting)
- Prisma Client for data access (no repository layer yet)
- Error handling via Express middleware

### State Management Pattern (Redux Saga)
- **Slice**: State + synchronous reducers
- **Saga**: Asynchronous side effects (API calls)
- **Actions**: Request → Success/Failure pattern
- **No thunks**: Saga handles all async logic

### Dependency Flow
- Frontend → Backend: HTTP API calls (`/api/*`)
- Backend → Database: Prisma Client
- No direct database access from frontend

## Configuration Files

### TypeScript
- **Root**: Base config with strict mode
- **Frontend**: Extends base, React-specific settings
- **Backend**: Extends base, Node.js-specific settings

### Workspaces
- Packages named with `@noraneko/` scope
- Private packages (not published)
- Shared dependencies hoisted to root

---
_created_at: 2026-02-01_
