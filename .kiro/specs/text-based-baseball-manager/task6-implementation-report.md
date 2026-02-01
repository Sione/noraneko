# タスク6: 走塁と進塁判定 - 実装完了報告

## 実装日時
2026年2月1日

## 実装内容

### 新規作成ファイル

1. **baseRunningEngine.ts** (495行)
   - 走塁判定の中核エンジン
   - 6.1〜6.4のすべてのサブタスクを実装

2. **baseRunningEngine.test.ts** (478行)
   - 17個のテストケースを含む包括的なテストスイート
   - すべてのテストが通過

3. **baseRunningEngine.md**
   - 実装の詳細なドキュメント
   - API使用例とロジックの説明

### 更新ファイル

1. **defensiveEngine.ts**
   - `createDefensiveResult`関数を更新
   - 単打、二塁打、三塁打、本塁打のケースで新しい走塁エンジンを使用
   - 既存の13テストすべてが通過

2. **tasks.md**
   - タスク6とサブタスク6.1〜6.4を完了としてマーク

## 実装された機能

### 6.1 基本進塁ルール ✅

- **本塁打**: すべての走者が得点
- **三塁打**: 打者が三塁、全走者が得点
- **二塁打**: 打者が二塁、二塁以降の走者が得点
- **単打**: 基本的な進塁処理

```typescript
function determineBasicAdvancement(
  hitType: HitType,
  runners: RunnerState,
  batter: PlayerInGame
): BaseRunningResult
```

### 6.2 単打時の本塁到達と追加進塁 ✅

#### 二塁走者の本塁到達判定
- 打球の強さ、方向、外野手の肩力を考慮
- クロスプレーの再現
- 基本成功率50%に各種補正を適用

#### 一塁走者の追加進塁（三塁へ）
- 打球の強さと前の走者の動きを考慮
- 試行率20%〜80%（状況による）
- 成功率40%〜70%（状況による）

#### 打者の追加進塁（二塁へ）
- 非常に強い打球の場合のみ
- 走力と走塁技術を反映

```typescript
function evaluateSingleAdvancement(
  runners: RunnerState,
  batter: PlayerInGame,
  batBallInfo: BatBallInfo,
  outfielderInfo: OutfielderInfo
): BaseRunningResult
```

### 6.3 二塁打時の本塁到達と中継送球 ✅

#### 捕球位置による判定
- **浅い位置**: -40%ペナルティ
- **中程度**: -10%ペナルティ
- **深い位置**: +20%ボーナス

#### 中継送球の評価
- 外野手の肩力: -0.4%/pt
- 中継選手の肩力: -0.3%/pt
- 二段階の送球プロセスを再現

#### 送球先の選択
- 走者状況とアウトカウントに応じて最適な送球先を判断

```typescript
function evaluateDoubleAdvancement(
  runners: RunnerState,
  batter: PlayerInGame,
  batBallInfo: BatBallInfo,
  outfielderInfo: OutfielderInfo
): BaseRunningResult

function determineThrowTarget(
  runners: RunnerState,
  outs: number,
  batBallInfo: BatBallInfo
): 'home' | 'third' | 'second' | 'first'
```

### 6.4 得点と実況表示 ✅

- 得点数に応じた実況生成
  - 1点: "タイムリーヒット！"
  - 2点: "2点タイムリー！"
  - 3点以上: "大量○点！"
- ホームランの種類別実況
  - ソロ、2ラン、3ラン、満塁ホームラン
- クロスプレーやタッチアウトの詳細説明

```typescript
function generateScoringCommentary(
  advancements: BaseRunningAdvancement[],
  runsScored: number,
  batter: PlayerInGame
): string
```

## テスト結果

### 新規テスト: baseRunningEngine.test.ts
- ✅ 17テストすべて通過

### 既存テストへの影響
- ✅ defensiveEngine.test.ts: 13テスト通過
- ✅ atBatEngine.test.ts: 12テスト通過
- ✅ buntEngine.test.ts: 17テスト通過
- ✅ gameSlice.test.ts: 18テスト通過
- ✅ instructionMenu.test.tsx: 10テスト通過

**合計: 87テストすべて通過** ✨

## 確率計算の詳細

### 単打時の二塁走者の本塁到達

```
基本成功率: 50%
+ 打球方向補正: 左右 +10%, センター -10%
+ 打球の強さ補正: 弱い -30%, 強い +15%, 非常に強い +25%
- 外野手の肩力補正: (肩力 - 50) × 0.8%
```

### 二塁打時の一塁走者の本塁到達

```
基本成功率: 45%
+ 捕球位置補正: 浅い -40%, 中程度 -10%, 深い +20%
+ 打球方向補正: 左右 +5%, センター -15%
- 外野手の肩力補正: (肩力 - 50) × 0.4%
- 中継選手の肩力補正: (肩力 - 50) × 0.3%
```

## データ構造

### BaseRunningAdvancement

```typescript
interface BaseRunningAdvancement {
  from: 'first' | 'second' | 'third' | 'batter';
  to: 'first' | 'second' | 'third' | 'home' | 'out';
  isTagUp?: boolean;
  isExtraBase?: boolean;
  wasThrown?: boolean;
  description?: string;
}
```

### BaseRunningResult

```typescript
interface BaseRunningResult {
  advancements: BaseRunningAdvancement[];
  runsScored: number;
  outsRecorded: number;
  commentary: string;
}
```

## 統合状況

走塁エンジンは`defensiveEngine.ts`の`createDefensiveResult`関数内で統合されており、以下の流れで使用されます：

1. 打球判定（atBatEngine.ts）
2. 守備判定（defensiveEngine.ts）
3. **走塁判定（baseRunningEngine.ts）** ← 今回実装
4. ゲーム状態更新（GameScreen.tsx）

## リアリズムの向上

以下の要素により、よりリアルな走塁シミュレーションを実現：

1. **打球の特性を反映**
   - 強い打球は外野が深い位置で取るため、走者が進塁しやすい
   - センター方向は本塁まで最も遠い

2. **守備能力の影響**
   - 外野手の肩力が強いと走者の追加進塁を抑制
   - 中継プレイの精度も考慮

3. **状況判断**
   - 前の走者が本塁へ向かった場合、守備の混乱を突いて追加進塁を試みる
   - アウトカウントに応じた送球先の選択

4. **リスク・リワードのバランス**
   - 追加進塁は成功すればアドバンテージ、失敗すればアウトのリスク
   - 状況に応じた試行確率の変動

## 今後の拡張可能性

現在の実装はタスク6の要件をすべて満たしていますが、以下の拡張が可能です：

1. **走者個別の能力反映**
   - 現在は簡易実装。走者IDから能力値を取得して反映する余地あり

2. **悪送球の詳細処理**
   - 送球エラーによる追加進塁の詳細化

3. **監督の指示**
   - ストップサインや特攻指示などの戦術的要素

4. **統計情報**
   - 追加進塁の成功率などの記録

## まとめ

タスク6「走塁と進塁判定」は完全に実装され、以下を達成しました：

✅ 6.1 基本進塁ルール  
✅ 6.2 単打時の本塁到達と追加進塁  
✅ 6.3 二塁打時の本塁到達と中継送球  
✅ 6.4 得点と実況表示  

- 新規ファイル3つを作成
- 既存ファイル2つを更新
- 87個のテストすべてが通過
- リンターエラーなし
- 詳細なドキュメント完備

野球ゲームとしてのリアリズムが大幅に向上し、プレイヤーは打球の質や守備の能力が走塁結果に与える影響を体感できるようになりました。
