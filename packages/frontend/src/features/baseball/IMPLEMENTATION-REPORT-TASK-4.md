# タスク4実装レポート: 守備判定とアウト処理

## 実装日時
2026年2月1日

## 概要
タスク4「守備判定とアウト処理」の実装を完了しました。打球方向に基づく担当選手の特定、ゴロ/フライ/ライナーの守備処理、併殺/タッチアップ/送球選択、守備エラー詳細と実況の全機能を実装しました。

## 実装内容

### 4.1 打球方向に基づく担当選手の特定

#### 実装した機能
- **守備位置マッピング**: 打球方向(left/center_left/center/center_right/right)と打球種類(ゴロ/フライ/ライナー)に応じた担当選手の特定
- **シフト適用**: 守備シフト(normal/pull_right/pull_left/extreme_shift/infield_in/infield_back)に応じた位置調整
- **補助担当の決定**: 併殺や中継プレイで必要となる補助守備選手の自動選定

#### 主要な関数
```typescript
function determineFielder(
  direction: BatDirection,
  batType: BatType,
  defendingTeam: PlayerInGame[],
  shift: DefensiveShift = 'normal'
): { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame } | null
```

**特徴:**
- ゴロは内野手を優先、フライは外野手を優先
- シフト適用時は打球方向を調整して守備範囲を最適化
- 併殺可能時は自動的に二塁ベースカバーを補助担当として設定

### 4.2 ゴロ/フライ/ライナーの守備処理

#### 4.2.1 ゴロの守備処理
```typescript
function processGroundBall(
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame },
  runners: RunnerState,
  outs: number,
  shift: DefensiveShift
): { outcome: DefensiveOutcome; errorType?: ErrorType }
```

**実装した判定:**
- 守備範囲判定: 選手の`infieldRange`能力値と打球の強さで捕球可能性を計算
- エラー判定: `infieldError`能力値に基づく捕球エラーの発生
- 併殺判定: 走者一塁時に`turnDP`能力値で併殺成功率を計算
- シフトボーナス: 前進守備(+15)、深守備(-10)の補正を適用

**打球の強さによる捕球難易度:**
- weak: 90% (基本捕球率)
- medium: 70%
- strong: 45%
- very_strong: 20%

#### 4.2.2 フライの守備処理
```typescript
function processFlyBall(
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame },
  runners: RunnerState,
  outs: number,
  shift: DefensiveShift
): { outcome: DefensiveOutcome; errorType?: ErrorType }
```

**実装した判定:**
- 本塁打判定: 外野で非常に強い打球(extraBasePotential > 80)
- 三塁打判定: 外野深くへの強打球(extraBasePotential > 65)
- 二塁打判定: 外野への強打球(extraBasePotential > 45)
- 内野/外野フライの分岐: `infieldRange`または`outfieldRange`を使用
- 落球エラー: `infieldError`/`outfieldError`能力値で判定
- 犠牲フライ: 走者三塁、アウト0-1個時に自動判定

**打球の強さによる捕球難易度:**
- weak: 95%
- medium: 85%
- strong: 70%
- very_strong: 50%

#### 4.2.3 ライナーの守備処理
```typescript
function processLineDrive(
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame },
  runners: RunnerState,
  outs: number
): { outcome: DefensiveOutcome; errorType?: ErrorType }
```

**ライナー特性:**
- 捕球難易度が通常より低い(フライより難しい)
- 捕れなかった場合は長打になりやすい
- 捕球後の併殺可能性あり(走者が飛び出していた場合)

**打球の強さによる捕球難易度:**
- weak: 70%
- medium: 55%
- strong: 35%
- very_strong: 20%

### 4.3 併殺/タッチアップ/送球選択

#### 4.3.1 併殺判定
```typescript
function calculateDoublePlayChance(
  fielder: PlayerInGame,
  assistFielder: PlayerInGame,
  batStrength: BatStrength
): number
```

**計算ロジック:**
- 基本確率: 35%
- 守備選手と補助選手の`turnDP`能力値の平均で補正
- 打球の強さで調整(weak: x1.5, medium: x1.0, strong: x0.6, very_strong: x0.3)
- 最終確率は10-70%の範囲

#### 4.3.2 タッチアップ判定
```typescript
function evaluateTagUp(
  runner: Runner,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame } | null,
  batBallInfo: BatBallInfo
): boolean
```

**計算ロジック:**
- 基本成功率: 60%
- 外野手の`outfieldArm`能力値で補正(肩が強いほど難しい)
- フライの深さ(打球の強さ)で補正
  - weak: -30 (浅いフライは難しい)
  - strong/very_strong: +15~+25 (深いフライは容易)
- 最終成功率は20-95%の範囲

#### 4.3.3 走者進塁判定
```typescript
function evaluateRunnerAdvancement(
  runner: Runner,
  fromBase: 'first' | 'second' | 'third',
  toBase: 'second' | 'third' | 'home',
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame } | null
): boolean
```

**実装内容:**
- 単打時の二塁走者本塁到達判定
- 二塁打時の一塁走者本塁到達判定
- 外野手の`outfieldArm`能力値と打球の強さで判定
- 進塁難易度: 二塁へ(70%) > 三塁へ(50%) > 本塁へ(30%)

### 4.4 守備エラー詳細と実況

#### エラー種別の定義
```typescript
export type ErrorType =
  | 'fielding'         // 捕球エラー
  | 'throwing'         // 送球エラー
  | 'dropped_fly';     // フライ落球
```

#### 4.4.1 エラー種別に応じた実況文
```typescript
function getErrorDescription(
  errorType: ErrorType | undefined,
  fielderName: string,
  positionLabel: string
): string
```

**生成される実況例:**
- `"田中(SS)の捕球エラー！"`
- `"鈴木(RF)の送球エラー！"`
- `"佐藤(CF)がフライを落球！"`

#### 4.4.2 エラー種別に応じた進塁影響
```typescript
function getErrorAdvancement(
  errorType: ErrorType | undefined,
  runners: RunnerState
): DefensiveResult['runnersAdvanced']
```

**進塁パターン:**
- **捕球エラー/落球**: 打者は一塁へ、走者は1つ進塁
- **送球エラー**: 打者は二塁へ、走者は大きく進塁(一塁→三塁、二塁→本塁)

## 型定義の拡張

### 守備結果の型
```typescript
export type DefensiveOutcome = 
  | 'single'           // 単打
  | 'double'           // 二塁打
  | 'triple'           // 三塁打
  | 'home_run'         // 本塁打
  | 'out'              // アウト
  | 'double_play'      // 併殺
  | 'error'            // エラー
  | 'fielders_choice'  // 野手選択
  | 'sac_fly'          // 犠牲フライ
  | 'tag_up';          // タッチアップ
```

### 守備判定結果
```typescript
export interface DefensiveResult {
  outcome: DefensiveOutcome;
  fielder?: PlayerInGame;
  fielderPosition?: Position;
  assistBy?: PlayerInGame;           // 追加: 補助守備選手
  errorType?: ErrorType;             // 追加: エラー種別
  description: string;
  runnersAdvanced: {
    from: 'first' | 'second' | 'third' | 'batter';
    to: 'first' | 'second' | 'third' | 'home' | 'out';
    isTagUp?: boolean;               // 追加: タッチアップフラグ
  }[];
  runsScored: number;
  outsRecorded: number;
}
```

## テスト実装

### テストケース
`__tests__/defensiveEngine.test.ts`に以下のテストを実装:

1. **4.1のテスト**:
   - 左方向のゴロは三塁手または遊撃手が担当
   - 右方向のフライは右翼手が担当
   - 中央方向のライナーは中堅手が担当

2. **4.2のテスト**:
   - 弱いゴロはアウトになりやすい(70%以上)
   - 非常に強いフライは長打になる
   - 守備範囲の高い選手はアウトにしやすい(80%以上)

3. **4.3のテスト**:
   - 走者一塁で弱いゴロは併殺の可能性(10%以上)
   - 走者三塁で外野フライは犠牲フライになる
   - 二塁打で走者一塁は本塁を狙える場合がある

4. **4.4のテスト**:
   - エラー率の高い選手はエラーしやすい
   - エラー時は走者が進塁する
   - エラーの種類に応じた説明文が生成される

5. **統合テスト**:
   - 様々な打球に対して適切な結果を返す

## 能力値の影響

### 守備に影響する能力値
- `infieldRange`: 内野守備範囲(1-100) - ゴロの捕球率に影響
- `outfieldRange`: 外野守備範囲(1-100) - フライの捕球率に影響
- `infieldError`: 内野エラー率(1-100、高いほど確実) - 内野でのエラー発生率
- `outfieldError`: 外野エラー率(1-100、高いほど確実) - 外野でのエラー発生率
- `outfieldArm`: 外野肩力(1-100) - 走者進塁阻止とタッチアップ阻止
- `turnDP`: 併殺処理能力(1-100) - 併殺成功率

### 確率計算の例
**併殺確率の計算:**
```
基本確率 = 35%
能力補正 = (平均turnDP - 50) * 0.3
強さ補正 = weak: x1.5, medium: x1.0, strong: x0.6, very_strong: x0.3
最終確率 = min(70, max(10, (基本確率 + 能力補正) * 強さ補正))
```

## 今後の拡張ポイント

### タスク5との連携
- バント/スクイズ判定での守備処理の特殊化
- バント時の特別な送球先選択

### タスク6との連携
- より詳細な走者進塁ロジック
- 走者の走力(`speed`)を進塁判定に反映

### タスク7との連携
- 盗塁時の捕手送球判定
- 牽制時の一塁手・三塁手の処理

### タスク15との連携
- 守備シフトの詳細効果の実装
- シフト使用統計の記録

## ファイル構成

### 更新したファイル
- `packages/frontend/src/features/baseball/game/defensiveEngine.ts` (約600行)

### 新規作成したファイル
- `packages/frontend/src/features/baseball/game/__tests__/defensiveEngine.test.ts` (約450行)

## 実装の特徴

### 1. リアルな野球シミュレーション
- 実際の野球の守備戦術を反映
- 能力値による確率的な判定
- 打球の種類と強さに応じた適切な処理

### 2. 拡張性
- シフト対応の基盤実装済み
- エラー種別の詳細化が可能
- 走者進塁ロジックの細分化が容易

### 3. デバッグ性
- 詳細な実況文の生成
- 守備選手情報の記録
- エラー種別の明示

### 4. バランス調整
- 能力値の影響度を適切に設定
- 極端な結果を避けるための min/max 制限
- 打球の強さによる確率補正

## まとめ

タスク4の全サブタスク(4.1~4.4)を完全に実装しました。守備判定システムは以下の特徴を持ちます:

✅ **完全な守備位置マッピング**: 打球方向と種類に応じた適切な担当選手の特定
✅ **リアルな守備処理**: ゴロ/フライ/ライナー各々の特性を反映した判定
✅ **高度な走塁判定**: 併殺/タッチアップ/送球選択の詳細実装
✅ **詳細なエラー処理**: エラー種別と進塁影響の明確化
✅ **能力値の反映**: 選手の守備能力が適切に結果に影響
✅ **拡張性**: 今後のタスクとの連携が容易な設計

次のタスク(タスク5: バント/スクイズ判定)では、この守備判定システムを基盤として、バント特有の処理を追加実装します。
