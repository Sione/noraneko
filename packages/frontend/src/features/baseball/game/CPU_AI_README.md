# タスク14: CPU戦術AIの実装

## 概要

CPU操作チームが試合状況に応じて適切な戦術判断を行い、プレイヤーと対戦できるようにするAIシステムの実装。

## 実装内容

### 1. CPU AIエンジン (`cpuAI.ts`)

#### 主要クラス
- `CPUAIEngine`: CPU戦術判断エンジン
  - 攻撃指示の決定
  - 守備指示の決定
  - 難易度別の調整
  - 思考時間の演出

#### 戦術判断
- **攻撃戦術**
  - 通常打撃（基本85%）
  - バント（状況により15-25%）
  - 盗塁（Stealing Ability依存）
  - エンドラン（Contact + Speed依存）
  - スクイズ（接戦の7回以降）
  - ダブルスチール（複数ランナー時）

- **守備戦術**
  - 投手交代（投球数・失点状況）
  - 敬遠（強打者・状況判断）
  - 守備シフト（打者特性）

#### 難易度設定
- **初級 (beginner)**: 最適でない判断30-40%、保守的
- **中級 (intermediate)**: 最適でない判断15-20%、標準
- **上級 (expert)**: ミス5%未満、最適判断

### 2. CPU AI統合フック (`useCPUAI.ts`)

- `useCPUAI`: 攻撃側のCPU自動実行
- `useCPUDefense`: 守備側のCPU自動実行
- CPUターン判定ロジック
- 思考時間の待機処理

### 3. 設定システムの拡張 (`settings.ts`)

- 難易度マッピング関数: `mapDifficultyToCPU`
- easy → beginner
- normal → intermediate
- hard → expert

### 4. GameScreen統合

- CPU難易度の状態管理
- useCPUAIフックの統合
- CPU思考中のUI表示

## 使用方法

### CPU AIの初期化

```typescript
import { initializeCPUAI, getCPUAI } from './cpuAI';

// 初期化
initializeCPUAI({ difficulty: 'intermediate', thinkingTimeMs: 1000 });

// インスタンス取得
const cpuAI = getCPUAI();
```

### 攻撃指示の決定

```typescript
const instruction = cpuAI.decideOffensiveInstruction(gameState);
// 'normal_swing' | 'bunt' | 'steal' | 'hit_and_run' | 'squeeze' | 'double_steal'
```

### 守備指示の決定

```typescript
const instruction = cpuAI.decideDefensiveInstruction(gameState);
// 'pitcher_change' | 'intentional_walk' | 'defensive_shift' | null
```

### GameScreenでの使用

```typescript
import { useCPUAI } from './useCPUAI';

function GameScreen() {
  // CPU AIフックの使用
  useCPUAI(
    handleOffensiveInstruction,
    handleDefensiveInstruction,
    cpuDifficulty
  );
  
  // ...
}
```

## 戦術判断のロジック

### 攻撃戦術の判断基準

#### 通常打撃
- 基本選択確率: 85%
- Contact 70以上: 90-95%
- Contact 40未満: 70-80%

#### バント
- ツーアウト: 選択しない
- ランナー一塁 + Sacrifice Bunt 60以上: 15-25%
- 投手（Contact < 30）: 60%
- 接戦の7回以降: +25%

#### 盗塁
- ツーアウト: 選択しない（最優先）
- 点差5点以上: 選択しない（最優先）
- Stealing Ability 70以上: 20-30%
- Hold Runners 80以上: 確率半減
- 接戦の7回以降: 確率1.5倍

#### エンドラン
- Contact 65以上 + Speed 60以上: 10-20%
- カウント打者有利: 確率1.5倍
- カウント投手有利: 選択しない

#### スクイズ
- ツーアウト: 選択しない
- 三塁ランナーなし: 選択しない
- Sacrifice Bunt 60以上 + Speed 60以上
  - 接戦の7回以降: 15-25%
  - ノーアウト/ワンアウト: 5-15%

### 守備戦術の判断基準

#### 投手交代
- 投球数100球超: 80-90%
- 投球数75球超 + 疲労: 40-60%
- 7回以降の接戦 + 投球数80球超: 60%

#### 敬遠
- 点差5点以上: 選択しない
- 満塁になる: 確率80%低下
- 一塁空き + HR Power 80以上: 15-25%
- 8回以降の接戦 + HR Power 70以上: 25-35%

#### 守備シフト
- 得点圏にランナー: 通常守備
- 基本確率: 40-60%
- HR Power 80以上: 確率1.5倍

## テスト

### ユニットテスト

```bash
npm test cpuAI.test.ts
```

テスト項目:
- CPU AIエンジンの作成
- 攻撃指示判断
- 守備指示判断
- 難易度による調整
- 思考時間

### 手動テスト

1. ゲームを開始
2. CPUターンを確認
3. CPU思考中のメッセージ表示
4. CPU指示の自動実行
5. 戦術ログの記録

## 制約事項

1. 打順情報の取得が完全ではない
2. 捕手の能力値がコンテキストに含まれていない
3. 次打者の情報が敬遠判断に使用されていない
4. 投手の失点情報が交代判断に使用されていない
5. 打球傾向データが守備シフト判断に使用されていない

## 今後の改善

1. より詳細な選手情報の取得
2. 試合統計の追跡と活用
3. 機械学習による戦術最適化
4. プレイヤーの戦術パターン認識と対応
5. AI委譲機能の実装

## 関連ファイル

- `cpuAI.ts` - CPU AIエンジン本体
- `useCPUAI.ts` - CPU AI統合フック
- `settings.ts` - 難易度マッピング
- `GameScreen.tsx` - CPU AI統合
- `GameScreen.css` - CPU思考中のスタイル
- `__tests__/cpuAI.test.ts` - ユニットテスト

## Requirement 10 対応状況

- ✅ AC 1-5: 基本動作とランダム性
- ✅ AC 6-10: 通常打撃判断
- ✅ AC 11-15: バント戦術
- ✅ AC 16-22: 盗塁戦術
- ✅ AC 23-26: エンドラン戦術
- ✅ AC 27-31: スクイズ戦術
- ✅ AC 32-34: ダブルスチール戦術
- ✅ AC 35-42: 投手交代判断
- ✅ AC 43-47: 敬遠判断
- ✅ AC 48-50: 守備シフト判断
- ✅ AC 63-67: 難易度別の調整
- ✅ AC 68-72: AI判断の透明性と演出

## 参考

- Requirement 10: CPU操作チームの戦術AI
- Out of the Park Baseball 26の戦術システム
- 確率的意思決定アルゴリズム
