# Technology Stack

## Architecture

**モノレポ + ブラウザベースゲーム開発**  
フロントエンドを中心としたブラウザ完結型の野球シミュレーションゲーム。ゲームロジックとデータ管理をブラウザストレージで実現。

## Core Technologies

- **Language**: TypeScript 5.6+ (strict mode)
- **Runtime**: Node.js 20+ (開発環境のみ)
- **Package Manager**: Yarn 4.x (Workspaces)
- **Frontend Framework**: React 18.3 + Vite 5.4
- **Data Storage**: localStorage + IndexedDB (ブラウザストレージ)
- **Game Engine**: カスタムTypeScriptゲームロジック

## Key Libraries

### Frontend
- **State Management**: Redux Toolkit + Redux Saga
  - Redux Toolkit for reducers and actions
  - Redux Saga for side effects (game logic, data persistence)
- **Router**: React Router 6.28
- **UI Library**: PrimeReact 10.8 (with PrimeFlex, PrimeIcons)
- **Data Persistence**: 
  - localStorage for lightweight data (settings, small game state)
  - IndexedDB for large data (player database, game history)

### Game Logic
- **Probability Engine**: カスタム確率計算エンジン（選手能力値ベース）
- **Baseball Simulation**: OOTP26準拠の野球シミュレーションロジック
- **AI System**: CPU操作チームの戦術判断システム

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
- Currently no test framework configured (planned: Jest/Vitest for game logic testing)

## Development Environment

### Required Tools
- Node.js 20.x or higher
- Yarn 4.12.0 (managed via `packageManager` field)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Common Commands
```bash
# Dev server
yarn dev                # Frontend Vite dev server (5173)
yarn dev:frontend       # Same as yarn dev

# Build
yarn build              # Build frontend for production
yarn build:frontend     # Vite build

# Code quality
yarn lint               # ESLint check
yarn lint:fix           # ESLint auto-fix
yarn format             # Prettier format
yarn format:check       # Prettier validation

# Preview production build
yarn preview            # Serve production build locally
```

## Key Technical Decisions

### Monorepo with Yarn Workspaces
- **Why**: Organize game modules, shared utilities, and configuration
- **Structure**: `packages/frontend` (main game), future: `packages/game-engine` (shared logic)
- **Scripts**: Root-level commands orchestrate workspace tasks

### Redux Saga over Redux Thunk
- **Why**: Better async flow control for complex game logic, testability, and separation of concerns
- **Pattern**: Action → Saga → State update
- **Use Cases**: Game simulation, AI decisions, data persistence

### Browser Storage Strategy
- **localStorage**: Game settings, current game state, user preferences
- **IndexedDB**: Player database (85 attributes per player), game history, team data
- **Why**: No server dependency, instant persistence, offline-capable

### No Backend Required
- **Why**: Browser-complete game experience, simpler deployment, no server costs
- **Tradeoff**: No multiplayer, no cloud saves (can add as future enhancement)
- **Benefit**: Static hosting (Vercel, Netlify, GitHub Pages)

### Vite over Create React App
- **Why**: Faster development server, better build performance, modern tooling

### Game Logic Architecture
- **Deterministic Simulation**: Pseudo-random number generation with seed support
- **Ability-Based Calculation**: 85 OOTP26-compliant player attributes drive all outcomes
- **Event-Driven System**: Redux actions represent game events (pitch, hit, steal, etc.)

---
_created_at: 2026-02-01_  
_updated_at: 2026-02-01_
