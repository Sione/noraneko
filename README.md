# Noraneko

モノレポ構造のWebアプリケーション - TODOリスト管理システム

## 技術スタック

### フロントエンド
- **Vite** - ビルドツール
- **React** - UIライブラリ
- **Redux + Redux Saga** - 状態管理
- **React Router** - ルーティング
- **PrimeReact** - UIコンポーネントライブラリ
- **TypeScript** - 型安全な開発

### バックエンド
- **Node.js + Express** - APIサーバー
- **Prisma** - ORM
- **PostgreSQL** - データベース
- **TypeScript** - 型安全な開発

### 開発ツール
- **Yarn Workspaces** - モノレポ管理
- **ESLint + Prettier** - コード品質
- **Docker** - PostgreSQL環境

## プロジェクト構造

```
noraneko/
├── packages/
│   ├── frontend/          # フロントエンドアプリケーション
│   │   ├── src/
│   │   │   ├── features/  # 機能別モジュール
│   │   │   ├── store/     # Redux store
│   │   │   └── router/    # ルーティング設定
│   │   └── ...
│   └── backend/           # バックエンドAPI
│       ├── src/
│       │   └── routes/    # APIルート
│       └── prisma/        # Prismaスキーマ
├── docker-compose.yml     # PostgreSQL設定
└── ...
```

## セットアップ

### 前提条件

- Node.js 20.x 以上
- Yarn 4.x
- Docker & Docker Compose

### インストール

```bash
# 依存関係のインストール
yarn install

# 環境変数の設定
cp .env.example .env
```

### データベースの起動

```bash
# PostgreSQLコンテナを起動
yarn db:up

# マイグレーションの実行
yarn db:migrate

# Prisma Clientの生成
yarn db:generate
```

### 開発サーバーの起動

```bash
# フロントエンドとバックエンドを同時起動
yarn dev

# 個別に起動する場合
yarn dev:frontend  # http://localhost:5173
yarn dev:backend   # http://localhost:3001
```

## 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `yarn dev` | フロントエンドとバックエンドを同時起動 |
| `yarn dev:frontend` | フロントエンドのみ起動 |
| `yarn dev:backend` | バックエンドのみ起動 |
| `yarn build` | 全パッケージをビルド |
| `yarn lint` | ESLintでコードをチェック |
| `yarn lint:fix` | ESLintで自動修正 |
| `yarn format` | Prettierでフォーマット |
| `yarn db:up` | PostgreSQLを起動 |
| `yarn db:down` | PostgreSQLを停止 |
| `yarn db:migrate` | マイグレーションを実行 |
| `yarn db:studio` | Prisma Studioを起動 |

## API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/todos` | 全TODOを取得 |
| GET | `/api/todos/:id` | 特定のTODOを取得 |
| POST | `/api/todos` | TODOを作成 |
| PUT | `/api/todos/:id` | TODOを更新 |
| DELETE | `/api/todos/:id` | TODOを削除 |
| PATCH | `/api/todos/:id/toggle` | 完了状態を切り替え |
| GET | `/api/health` | ヘルスチェック |

## ライセンス

MIT
