# リサーチ＆設計決定

---
**目的**: 技術設計に影響する発見事項、アーキテクチャ調査、根拠を記録する。
---

## サマリー
- **フィーチャー**: `text-based-baseball-manager`
- **ディスカバリースコープ**: 新規フィーチャー（greenfield）
- **主要な発見事項**:
  - Redux Sagaはゲームロジックの分離と並列処理に最適
  - Dexie.jsによるIndexedDB管理が大規模選手データベースに推奨
  - 状態ベースアーキテクチャが野球シミュレーションに適合
  - 確率エンジンはOOTP26準拠の選手能力値を使用した階層的判定構造

## リサーチログ

### Redux Sagaによるゲーム状態管理
- **コンテキスト**: 野球シミュレーションゲームの複雑な非同期ロジック管理方法
- **参照ソース**: 
  - https://www.sitepen.com/blog/using-redux-saga-to-write-a-game-loop
  - https://redux.js.org/usage/side-effects-approaches
- **発見事項**:
  - Sagaはゲームロジックを機能別に分離できる（例：game saga、turn saga、dealer saga）
  - CSP（Communicating Sequential Processes）パターンで読みやすさと協調性が向上
  - `takeEvery`、`call`、`put`、`takeLatest`で細かい非同期制御が可能
  - Redux Toolkitの`configureStore`でミドルウェアとして登録
- **含意**: ゲームサガを打席処理、走塁判定、守備判定、AI判断に分離して設計する

### 野球シミュレーション確率エンジン設計
- **コンテキスト**: リアルな野球プレイ判定をどのように実装するか
- **参照ソース**:
  - https://tht.fangraphs.com/10-lessons-i-learned-from-creating-a-baseball-simulator/
  - https://chris-french.github.io/BayesBall/
  - https://docs.lib.purdue.edu/open_access_theses/812/
- **発見事項**:
  - 野球は4つの状態変数（イニング、アウト、ランナー、スコア）で完全に記述可能
  - ベイジアンアプローチ: 事前確率をゲームロジックで固定
  - 頻度主義アプローチ: 相対頻度から確率を計算
  - 打席結果は階層的に判定: 打席結果 → 打球種類 → 打球方向 → 守備処理
  - BayesActionクラス: ゲーム状態、環境コンテキスト、アクション入力、結果確率をカプセル化
  - マルコフ連鎖で遷移確率を管理
- **含意**: 
  - 階層的な確率計算エンジンを設計（打席 → 打球 → 守備 → 進塁）
  - 選手能力値を入力とし、確率を出力する純粋関数として実装
  - 状態遷移マトリックスでゲーム進行を管理

### IndexedDBによる大規模データ管理
- **コンテキスト**: 85種類の能力値を持つ100人以上の選手データを効率的に管理する方法
- **参照ソース**:
  - https://dexie.org/docs/Tutorial/React
  - https://dexie.org/docs/Typescript
  - https://dexie.org/docs/dexie-react-hooks/useLiveQuery()
- **発見事項**:
  - Dexie.js v3.2+はTypeScript組み込みサポート
  - `EntityTable<T, K>`で型安全なテーブル定義
  - `useLiveQuery()`フックでリアクティブなデータバインディング
  - バイナリレンジツリーで効率的な変更検出
  - Service Worker、Web Worker、他タブからの変更も検出可能
- **含意**:
  - Dexie.jsを選手・チーム・履歴データの永続化に採用
  - `useLiveQuery()`でコンポーネントのリアクティブ更新を実現
  - データベーススキーマをシングルトンモジュールとして定義

### ターン制ゲームの状態機械パターン
- **コンテキスト**: 野球の複雑なゲームフロー（攻守交代、打席、走塁）を管理する方法
- **参照ソース**:
  - https://mastery.games/post/state-machines-in-react/
  - https://dev.to/ffteamnames/taming-the-state-monster-reactive-ui-vs-finite-state-machines-in-game-dev-372g
  - https://stately.ai/docs/xstate-v4/xstate/packages/xstate-react
- **発見事項**:
  - 状態機械はターン制ゲームに最適（厳格な行動シーケンスを強制）
  - Boolean フラグより明示的な状態定義で「不可能な状態」を排除
  - XStateまたはRedux状態で実装可能
  - 「Brain」（状態機械）と「Body」（UIコンポーネント）の分離が推奨
- **含意**:
  - ゲームフェーズ（試合開始 → 打席 → プレイ実行 → 結果表示 → 次打席）を状態機械で定義
  - Redux Sliceで状態遷移を管理（XStateの追加依存を避ける）
  - 無効な遷移はReducerでガード

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク/制限 | 備考 |
|----------|------|------|-----------|------|
| Redux Saga + Feature Slices | 機能別にSlice/Sagaを分離し、ゲームエンジンを独立モジュール化 | steeringと整合、既存パターンに準拠、テスト容易 | Sagaの学習コスト | **選択** |
| XState + Redux | XStateで状態機械、Reduxでデータ管理 | 状態遷移の可視化、形式的検証 | 追加依存、複雑性増加 | 将来の拡張オプション |
| Pure Redux Toolkit | RTK Listenerで非同期処理 | 公式推奨、シンプル | ゲームロジックの複雑さに対応困難 | ゲームには不向き |

## 設計決定

### 決定1: Redux Sagaによるゲームロジック分離
- **コンテキスト**: 野球シミュレーションには複雑な非同期フロー（打席判定、AI思考、アニメーション待機）が必要
- **検討した代替案**:
  1. RTK Listener - 公式推奨だがゲームには単純すぎる
  2. XState - 強力だが追加依存と学習コスト
  3. Redux Saga - ゲームロジックに実績あり
- **選択したアプローチ**: Redux Saga
- **根拠**: 既存コードベースがSagaを使用、ゲームループの実績事例あり、並列処理とキャンセルサポート
- **トレードオフ**: ジェネレータ構文の学習曲線 vs 強力な非同期制御
- **フォローアップ**: Saga間の依存関係を明確に定義

### 決定2: Dexie.jsによるIndexedDB管理
- **コンテキスト**: 大量の選手データ（85属性×100人以上）と試合履歴を永続化
- **検討した代替案**:
  1. 素のIndexedDB API - 複雑で冗長
  2. use-indexeddb - 軽量だが機能限定
  3. Dexie.js - 豊富な機能とReactフック対応
- **選択したアプローチ**: Dexie.js v3.2+
- **根拠**: TypeScript組み込みサポート、useLiveQueryでリアクティブUI、大企業での実績
- **トレードオフ**: バンドルサイズ増加 vs 開発効率向上
- **フォローアップ**: スキーマバージョン管理戦略を定義

### 決定3: 状態ベース野球シミュレーション
- **コンテキスト**: 野球ゲームの状態管理とプレイ判定の設計
- **検討した代替案**:
  1. イベント駆動型 - 複雑な状態追跡が困難
  2. 状態ベース + 確率エンジン - シンプルで拡張可能
- **選択したアプローチ**: 状態ベース（4変数: イニング、アウト、ランナー、スコア）+ 階層的確率エンジン
- **根拠**: 野球シミュレータの標準パターン、テスト容易、直感的
- **トレードオフ**: 状態管理のオーバーヘッド vs 明確なゲーム進行追跡
- **フォローアップ**: 確率計算のユニットテストを優先的に実装

### 決定4: 階層的確率計算エンジン
- **コンテキスト**: OOTP26準拠の選手能力値を使用したリアルなプレイ判定
- **選択したアプローチ**: 多段階の判定フロー
  1. 打席結果判定（三振/四球/インプレー）
  2. 打球種類判定（ゴロ/フライ/ライナー）
  3. 打球方向・強さ判定
  4. 守備処理判定
  5. 進塁判定
- **根拠**: 要件定義の構造に準拠、各段階を独立してテスト可能
- **トレードオフ**: 判定ステップ数の多さ vs 精密なシミュレーション
- **フォローアップ**: 能力値の補正係数をチューニング可能にする

## リスクと緩和策
- **リスク1**: 確率計算の複雑性によるパフォーマンス低下 → 純粋関数で実装し、メモ化で最適化
- **リスク2**: IndexedDBのブラウザ互換性 → Dexie.jsのpolyfillサポートを活用
- **リスク3**: ゲームロジックの肥大化 → 機能別Sagaへの分離を徹底
- **リスク4**: 状態同期の複雑性 → Reduxの単一ストアで一貫性を保証

## リファレンス
- [Using Redux-Saga for Game Loop](https://www.sitepen.com/blog/using-redux-saga-to-write-a-game-loop) - Sagaによるゲーム開発事例
- [10 Lessons from Baseball Simulator](https://tht.fangraphs.com/10-lessons-i-learned-from-creating-a-baseball-simulator/) - 野球シミュレータ設計の教訓
- [Dexie.js React Tutorial](https://dexie.org/docs/Tutorial/React) - Dexie.jsとReactの統合ガイド
- [State Machines in React](https://mastery.games/post/state-machines-in-react/) - Reactでの状態機械パターン
- [BayesBall](https://chris-french.github.io/BayesBall/) - ベイジアン野球シミュレーション
