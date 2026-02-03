# リサーチ＆設計決定

---
**目的**: 技術設計に影響する発見事項、アーキテクチャ調査、根拠を記録する。
---

## サマリー
- **フィーチャー**: `text-based-baseball-manager`
- **ディスカバリースコープ**: 既存システム拡張（Extension）
- **主要な発見事項**:
  - 既存実装は`features/baseball`配下のRTK sliceと純粋関数エンジンを中心に構成されている
  - 永続化はlocalStorage主体で、IndexedDB/Dexieの導入は未実装
  - 1球判定・CPU AI・守備シフトは既存エンジンがあるため、統合とUI/状態の拡張が主戦場

## リサーチログ

### 既存コードの拡張ポイント
- **コンテキスト**: 仕様の実装先を特定し、変更範囲を限定するため
- **参照ソース**: リポジトリ内`packages/frontend/src/features/baseball/`の各モジュール
- **発見事項**:
  - `gameSlice.ts`がフェーズ/打席/スコア/ログの中核状態を保持
  - `atBatEngine.ts`に1球判定ループ、`cpuAI.ts`にAI判断ロジックがある
  - `autoSave.ts`と`gameHistoryStorage.ts`がlocalStorageの永続化を担う
- **含意**:
  - 新規実装は既存エンジンと状態管理に接続する構成が最短
  - 自動進行/AI委譲/意思決定ポイントの表示はUIと状態拡張が必要

### Dexie.jsの導入可否（IndexedDB）
- **コンテキスト**: 選手/履歴データの永続化をIndexedDBに移行する設計判断
- **参照ソース**:
  - https://dexie.org/docs/Typescript
  - https://dexie.org/docs/EntityTable
  - https://dexie.org/docs/Tutorial/React
- **発見事項**:
  - `EntityTable<T, 'id'>`で型安全なテーブル定義が可能
  - React統合の基本パターンがドキュメント化されている
- **含意**:
  - IndexedDBの採用はTypeScript適合性が高い
  - localStorageと併用し、設定や一時保存は従来通り維持できる

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク/制限 | 備考 |
|----------|------|------|-----------|------|
| 既存RTK + localStorage維持 | 既存構成を維持し機能追加のみ | 変更範囲が小さい | 大規模データの性能・整合性が弱い | 保守性は高いが要件拡張に弱い |
| RTK + Saga + Dexie導入 | Sagaで非同期を統合しIndexedDBへ移行 | 非同期制御が明確、永続化が強化 | 移行コストが高い | **選択** |
| Hybrid（Sagaのみ導入） | Sagaを追加し永続化はlocalStorage維持 | ゲームフローの制御が明確 | 永続化の拡張性が不足 | 既存実装に近い |

## 設計決定

### 決定1: Sagaによるゲームフロー制御を追加
- **コンテキスト**: 指示待機/AI思考/自動進行/保存のタイミング制御が増える
- **検討した代替案**:
  1. RTKのままUIで制御
  2. Saga導入でフローを一元化
- **選択したアプローチ**: Saga導入
- **根拠**: 複雑な状態遷移と遅延処理を明確化できる
- **トレードオフ**: 新規レイヤー追加の学習コスト
- **フォローアップ**: 既存`gameSlice`の責務分割

### 決定2: 選手・履歴の永続化にDexieを採用
- **コンテキスト**: 選手/履歴が増加する前提でIndexedDBを採用
- **検討した代替案**:
  1. localStorage継続
  2. DexieでIndexedDBを使用
- **選択したアプローチ**: Dexie導入
- **根拠**: 型安全とデータ容量の両立
- **トレードオフ**: 既存データの移行コスト
- **フォローアップ**: 初回起動時の移行フローを定義

## リスクと緩和策
- **リスク1**: Saga導入で既存UIとの役割が重複 → 既存UIは表示に専念し、フロー制御はSagaへ移譲
- **リスク2**: localStorageからIndexedDB移行時のデータ不整合 → 片方向移行と冪等なマイグレーションを設計
- **リスク3**: AI委譲/自動進行の状態競合 → `DecisionPoint`と`AutoModeScope`を明示しガードを追加

## リファレンス
- [Dexie TypeScript](https://dexie.org/docs/Typescript) — TypeScript統合
- [Dexie EntityTable](https://dexie.org/docs/EntityTable) — 型安全なテーブル定義
- [Dexie React Tutorial](https://dexie.org/docs/Tutorial/React) — React統合パターン
