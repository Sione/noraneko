# 走塁判定エンジン (baseRunningEngine.ts)

## 概要

タスク6「走塁と進塁判定」の実装です。打球結果に応じた走者の進塁、本塁到達判定、追加進塁の試行などを詳細にシミュレートします。

## 実装内容

### 6.1 基本進塁ルール

- **本塁打**: すべての走者が本塁へ得点
- **三塁打**: 打者が三塁へ、すべての走者が得点
- **二塁打**: 打者が二塁へ、二塁以降の走者が得点、一塁走者は三塁へ
- **単打**: 打者が一塁へ、基本的な進塁処理

```typescript
const result = determineBasicAdvancement('single', runners, batter);
// result.runsScored: 得点数
// result.advancements: 各走者の進塁情報
```

### 6.2 単打時の本塁到達と追加進塁

外野手の送球能力と走者の能力を考慮して、詳細な進塁判定を行います。

#### 二塁走者の本塁到達判定

- 打球の強さ（weak/medium/strong/very_strong）
- 打球の方向（センター方向は遠い）
- 外野手の肩力
- クロスプレーの可能性

```typescript
const result = evaluateSingleAdvancement(
  runners,
  batter,
  batBallInfo,
  outfielderInfo
);
```

#### 一塁走者の追加進塁（三塁へ）

- 打球の強さ
- 前の走者の動き（本塁へ向かったか）
- 外野手の肩力
- 試行率と成功率の計算

#### 打者の追加進塁（二塁へ）

- 非常に強い打球の場合のみ
- 打者の走力と走塁技術
- 外野手の肩力

### 6.3 二塁打時の本塁到達と中継送球

一塁走者の本塁到達を詳細に判定します。

#### 捕球位置に応じた判断

- **浅い位置**: 本塁到達は困難
- **中程度の位置**: 状況次第
- **深い位置**: 本塁到達の可能性が高い

#### 中継送球の段階的評価

- 外野手の肩力（一次送球）
- 中継選手の肩力（二次送球）
- 両方を考慮した総合判定

#### 送球先の選択

```typescript
const target = determineThrowTarget(runners, outs, batBallInfo);
// 'home' | 'third' | 'second' | 'first'
```

### 6.4 得点と実況表示

得点状況に応じた実況を生成します。

```typescript
const commentary = generateScoringCommentary(advancements, runsScored, batter);
// 「タイムリーヒット！」
// 「2点タイムリー！」
// 「満塁ホームラン！グランドスラム！」
```

## データ構造

### BaseRunningAdvancement

```typescript
interface BaseRunningAdvancement {
  from: 'first' | 'second' | 'third' | 'batter';
  to: 'first' | 'second' | 'third' | 'home' | 'out';
  isTagUp?: boolean; // タッチアップかどうか
  isExtraBase?: boolean; // 追加進塁かどうか
  wasThrown?: boolean; // 送球があったかどうか
  description?: string; // 進塁の詳細説明
}
```

### BaseRunningResult

```typescript
interface BaseRunningResult {
  advancements: BaseRunningAdvancement[];
  runsScored: number;
  outsRecorded: number;
  commentary: string; // 総合実況
}
```

## 確率計算のロジック

### 単打時の二塁走者の本塁到達

基本成功率: 50%

補正要素:
- 打球方向: 左右 +10%, センター -10%
- 打球の強さ: 弱い -30%, 中程度 0%, 強い +15%, 非常に強い +25%
- 外野手の肩力: (肩力 - 50) × -0.8%

### 二塁打時の一塁走者の本塁到達

基本成功率: 45%

補正要素:
- 捕球位置: 浅い -40%, 中程度 -10%, 深い +20%
- 打球方向: 左右 +5%, センター -15%
- 外野手の肩力: (肩力 - 50) × -0.4%
- 中継選手の肩力: (肩力 - 50) × -0.3%

### 追加進塁の試行判定

基本試行率: 20%

追加要素:
- 非常に強い打球: +40%
- 強い打球: +20%
- 前の走者が得点: +25%
- 外野手の肩が弱い(60未満): +15%

## テスト

```bash
npm test -- baseRunningEngine
```

全87テストが通過することを確認しています。

## 統合

`defensiveEngine.ts`の`createDefensiveResult`関数内で使用されています。

```typescript
case 'single':
  if (fielderInfo) {
    const singleResult = evaluateSingleAdvancement(
      runners,
      batter,
      batBallInfo,
      {
        fielder: fielderInfo.primary,
        position: fielderInfo.position
      }
    );
    runnersAdvanced.push(...singleResult.advancements);
    runsScored = singleResult.runsScored;
    description = singleResult.commentary;
  }
  break;
```

## 今後の拡張

- 走者の走力・走塁技術の詳細な反映（現在は簡易実装）
- 状況に応じたリスク判断の調整
- 守備側の判断（どの走者を狙うか）の詳細化
- 悪送球の処理
