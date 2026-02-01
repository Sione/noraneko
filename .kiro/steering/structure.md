# Project Structure

## Organization Philosophy

**Monorepo with Game-Feature-First Frontend**  
Yarn Workspacesでゲーム機能を整理し、フロントエンドは野球ゲームの機能別にモジュール化。ブラウザストレージでデータ管理を実現。

## Directory Patterns

### Root Level
**Location**: `/`  
**Purpose**: モノレポ管理とグローバル設定  
**Contains**:
- `packages/` - ワークスペースパッケージ (frontend, future: game-engine)
- Global configs: ESLint, Prettier, TypeScript base

### Frontend Package
**Location**: `/packages/frontend/`  
**Purpose**: React SPAベースの野球シミュレーションゲーム  
**Structure**:
```
src/
  features/             # ゲーム機能別モジュール
    game/               # 試合進行システム
      components/       # 試合画面コンポーネント
      gameSlice.ts      # 試合状態管理
      gameSaga.ts       # 試合シミュレーションロジック
      types.ts          # 試合関連型定義
    players/            # 選手管理システム
      components/       # 選手一覧・編集コンポーネント
      playersSlice.ts   # 選手データ状態管理
      playersSaga.ts    # 選手CRUD操作
      types.ts          # 選手能力値型定義（OOTP26準拠）
    teams/              # チーム管理システム
      components/       # チーム編集コンポーネント
      teamsSlice.ts     # チーム状態管理
      teamsSaga.ts      # チーム操作ロジック
    history/            # 試合履歴・戦績管理
      components/       # 履歴表示コンポーネント
      historySlice.ts   # 履歴状態管理
      historySaga.ts    # 履歴データ永続化
    settings/           # 設定管理
      components/       # 設定画面コンポーネント
      settingsSlice.ts  # 設定状態管理
  store/                # Redux store configuration
    index.ts            # Store setup with middleware
    rootSaga.ts         # Combined sagas
    hooks.ts            # Typed useDispatch/useSelector
  router/               # React Router configuration
  services/             # ブラウザストレージサービス
    localStorage.ts     # localStorage操作ラッパー
    indexedDB.ts        # IndexedDB操作ラッパー
  engine/               # ゲームエンジン（将来的に分離予定）
    simulation/         # 野球シミュレーションロジック
    probability/        # 確率計算エンジン
    ai/                 # CPU戦術AIシステム
  main.tsx              # Application entry point
  App.tsx               # Root component
```

## Naming Conventions

- **Files (Frontend)**: PascalCase for components (`GameBoard.tsx`), camelCase for modules (`gameSlice.ts`)
- **Components**: PascalCase, match filename
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Redux**:
  - Slices: `{feature}Slice.ts`
  - Sagas: `{feature}Saga.ts`
  - Actions: `{verb}{Resource}{Status}` (e.g., `simulatePitchRequest`, `updatePlayerSuccess`)
- **Game Engine**: camelCase for functions, PascalCase for classes

## Import Organization

### Frontend (Vite + Path Alias)
```typescript
// External dependencies first
import React from 'react';
import { useDispatch } from 'react-redux';

// Path alias (@/ maps to src/)
import { useAppDispatch } from '@/store/hooks';
import { simulatePitch } from '@/features/game';

// Relative imports
import { GameBoard } from './components/GameBoard';
import { PlayerAbilities } from './types';
```

**Path Aliases**:
- `@/` → `packages/frontend/src/`

## Code Organization Principles

### Game-Feature-First (Frontend)
- Each game feature is self-contained: UI components, state, game logic, data persistence
- Export public API through `index.ts`
- Keep feature-specific logic isolated
- Game engine logic separated from UI logic

### Game Engine Architecture
- **Simulation Layer**: 野球プレイの判定ロジック（打撃、投球、走塁、守備）
- **Probability Layer**: 選手能力値に基づく確率計算
- **AI Layer**: CPU操作チームの戦術判断
- **Data Layer**: ブラウザストレージへのデータ永続化

### State Management Pattern (Redux Saga)
- **Slice**: Game state + synchronous reducers
- **Saga**: Asynchronous game logic (simulation, AI decisions, data persistence)
- **Actions**: Request → Success/Failure pattern
- **No API calls**: All data stored in browser storage

### Data Persistence Strategy
- **localStorage**: 
  - Game settings (difficulty, display options)
  - Current game state (for resume)
  - User preferences
- **IndexedDB**:
  - Player database (85 attributes × 100+ players)
  - Team rosters
  - Game history (detailed play-by-play logs)
  - Statistics and records

### Dependency Flow
- Frontend → Browser Storage: localStorage/IndexedDB
- Game Logic → Probability Engine → Player Abilities
- UI Components → Redux State → Game Sagas → Game Engine

## Configuration Files

### TypeScript
- **Root**: Base config with strict mode
- **Frontend**: Extends base, React-specific settings

### Workspaces
- Packages named with `@noraneko/` scope
- Private packages (not published)
- Shared dependencies hoisted to root

---
_created_at: 2026-02-01_  
_updated_at: 2026-02-01_
