import {
  Player,
  BattingAbilities,
  PitchingAbilities,
  Condition,
  FatigueLevel,
  Hand,
} from '../types';

/**
 * 選手能力システムユーティリティ
 * タスク8.1: 能力値モデルと分類ロジック
 */

// 打者タイプ分類
export type BatterType =
  | 'power' // パワーヒッター
  | 'contact' // コンタクトヒッター
  | 'balanced' // バランス型
  | 'speedster' // 俊足型
  | 'slap'; // スラップヒッター

// 投手タイプ分類
export type PitcherType =
  | 'power' // パワーピッチャー
  | 'control' // コントロールピッチャー
  | 'groundball' // ゴロピッチャー
  | 'balanced'; // バランス型

/**
 * 打者のタイプを判定する
 */
export function classifyBatter(batting: BattingAbilities): BatterType {
  const powerScore = batting.hrPower + batting.gapPower;
  const contactScore = batting.contact + batting.avoidKs;
  const speedScore = batting.babip; // BABIPは走力と相関

  // パワーヒッター: 長打力が高い
  if (powerScore >= 140 && batting.hrPower >= 70) {
    return 'power';
  }

  // 俊足型: BABIPとコンタクトが高い
  if (speedScore >= 70 && contactScore >= 130) {
    return 'speedster';
  }

  // コンタクトヒッター: コンタクト能力が高くパワーは控えめ
  if (contactScore >= 140 && powerScore < 120) {
    return 'contact';
  }

  // スラップヒッター: コンタクトは高いがパワーが低い
  if (batting.contact >= 70 && powerScore < 100) {
    return 'slap';
  }

  // バランス型: 上記に当てはまらない
  return 'balanced';
}

/**
 * 投手のタイプを判定する
 */
export function classifyPitcher(pitching: PitchingAbilities): PitcherType {
  const powerScore = pitching.stuff + pitching.velocity;
  const controlScore = pitching.control;
  const groundBallPct = pitching.groundBallPct;

  // パワーピッチャー: 球威と球速が高い
  if (powerScore >= 150 && pitching.velocity >= 75) {
    return 'power';
  }

  // ゴロピッチャー: ゴロ率が高い
  if (groundBallPct >= 65) {
    return 'groundball';
  }

  // コントロールピッチャー: 制球力が高い
  if (controlScore >= 70 && powerScore < 140) {
    return 'control';
  }

  // バランス型
  return 'balanced';
}

/**
 * コンディションによる能力補正倍率を取得
 */
export function getConditionModifier(condition: Condition): number {
  const modifiers: Record<Condition, number> = {
    excellent: 1.1, // +10%
    good: 1.05, // +5%
    normal: 1.0, // 補正なし
    poor: 0.95, // -5%
    terrible: 0.85, // -15%
  };
  return modifiers[condition];
}

/**
 * 疲労度による能力補正倍率を取得
 */
export function getFatigueModifier(fatigue: FatigueLevel): number {
  const modifiers: Record<FatigueLevel, number> = {
    fresh: 1.0, // 補正なし
    normal: 0.98, // -2%
    tired: 0.92, // -8%
    exhausted: 0.8, // -20%
  };
  return modifiers[fatigue];
}

/**
 * 投球数による疲労補正を計算
 * @param pitchCount 現在の投球数
 * @param stamina スタミナ値 (1-100)
 */
export function getPitchCountFatigueModifier(
  pitchCount: number,
  stamina: number
): number {
  // スタミナに応じた基準投球数を計算
  const baseThreshold = 60 + (stamina - 50) * 0.4; // スタミナ50で60球、100で80球

  if (pitchCount <= baseThreshold) {
    return 1.0; // 補正なし
  }

  // 基準を超えたら徐々に能力が低下
  const excess = pitchCount - baseThreshold;
  const penalty = excess * 0.003; // 1球ごとに0.3%低下
  return Math.max(0.7, 1.0 - penalty); // 最低70%まで
}

/**
 * 左右の組み合わせによる補正倍率を取得
 * @param batterHand 打者の利き手
 * @param pitcherHand 投手の利き手
 */
export function getHandMatchupModifier(
  batterHand: Hand,
  pitcherHand: Hand
): number {
  // スイッチヒッターは有利な方を選択するので補正なし
  if (batterHand === 'switch') {
    return 1.05; // 若干有利
  }

  // 同じ利き手の場合は打者不利
  if (batterHand === pitcherHand) {
    return 0.9; // -10%
  }

  // 逆の利き手の場合は打者有利
  return 1.1; // +10%
}

/**
 * 打者の能力値に左右補正を適用
 * @param batting 打撃能力
 * @param pitcherHand 投手の利き手
 */
export function applyHandMatchupToBatter(
  batting: BattingAbilities,
  pitcherHand: Hand
): BattingAbilities {
  const vsRating = pitcherHand === 'left' ? batting.vsLHP : batting.vsRHP;
  const modifier = vsRating / 65; // 65を基準として補正

  return {
    ...batting,
    contact: Math.min(100, batting.contact * modifier),
    babip: Math.min(100, batting.babip * modifier),
    gapPower: Math.min(100, batting.gapPower * modifier),
    hrPower: Math.min(100, batting.hrPower * modifier),
    eye: Math.min(100, batting.eye * modifier),
    avoidKs: Math.min(100, batting.avoidKs * modifier),
    vsLHP: batting.vsLHP,
    vsRHP: batting.vsRHP,
  };
}

/**
 * 選手の能力値にすべての補正を適用
 */
export function getAdjustedBattingAbilities(
  player: Player,
  pitcherHand: Hand,
  pitchCount?: number
): BattingAbilities {
  let abilities = { ...player.batting };

  // 左右補正を適用
  abilities = applyHandMatchupToBatter(abilities, pitcherHand);

  // コンディション補正
  const conditionMod = getConditionModifier(player.condition);

  // 疲労補正
  const fatigueMod = getFatigueModifier(player.fatigue);

  // 総合補正を適用
  const totalMod = conditionMod * fatigueMod;

  return {
    contact: Math.min(100, abilities.contact * totalMod),
    babip: Math.min(100, abilities.babip * totalMod),
    gapPower: Math.min(100, abilities.gapPower * totalMod),
    hrPower: Math.min(100, abilities.hrPower * totalMod),
    eye: Math.min(100, abilities.eye * totalMod),
    avoidKs: Math.min(100, abilities.avoidKs * totalMod),
    vsLHP: abilities.vsLHP,
    vsRHP: abilities.vsRHP,
  };
}

/**
 * 投手の能力値にすべての補正を適用
 */
export function getAdjustedPitchingAbilities(
  player: Player,
  pitchCount: number = 0
): PitchingAbilities | undefined {
  if (!player.pitching) return undefined;

  let abilities = { ...player.pitching };

  // コンディション補正
  const conditionMod = getConditionModifier(player.condition);

  // 疲労補正
  const fatigueMod = getFatigueModifier(player.fatigue);

  // 投球数による疲労補正
  const pitchCountMod = getPitchCountFatigueModifier(
    pitchCount,
    abilities.stamina
  );

  // 総合補正を適用
  const totalMod = conditionMod * fatigueMod * pitchCountMod;

  return {
    stuff: Math.min(100, abilities.stuff * totalMod),
    movement: Math.min(100, abilities.movement * totalMod),
    control: Math.min(100, abilities.control * totalMod),
    stamina: abilities.stamina, // スタミナ自体は変動しない
    groundBallPct: abilities.groundBallPct, // ゴロ率は変動しない
    velocity: Math.min(100, abilities.velocity * totalMod),
    holdRunners: Math.min(100, abilities.holdRunners * totalMod),
  };
}

/**
 * 打者の総合評価を計算 (1-100のスコア)
 */
export function calculateBatterOverall(player: Player): number {
  const b = player.batting;
  const r = player.running;
  const f = player.fielding;

  // 打撃能力スコア (50%)
  const battingScore =
    (b.contact * 0.2 +
      b.babip * 0.15 +
      b.gapPower * 0.15 +
      b.hrPower * 0.15 +
      b.eye * 0.15 +
      b.avoidKs * 0.1 +
      ((b.vsLHP + b.vsRHP) / 2) * 0.1) *
    0.5;

  // 走塁能力スコア (20%)
  const runningScore =
    (r.speed * 0.4 + r.stealingAbility * 0.3 + r.baserunning * 0.3) * 0.2;

  // 守備能力スコア (30%)
  const isInfielder = ['C', '1B', '2B', '3B', 'SS'].includes(player.position);
  const fieldingScore = isInfielder
    ? (f.infieldRange * 0.3 +
        f.infieldError * 0.3 +
        f.infieldArm * 0.2 +
        f.turnDP * 0.2) *
      0.3
    : (f.outfieldRange * 0.4 + f.outfieldError * 0.4 + f.outfieldArm * 0.2) *
      0.3;

  return Math.round(battingScore + runningScore + fieldingScore);
}

/**
 * 投手の総合評価を計算 (1-100のスコア)
 */
export function calculatePitcherOverall(player: Player): number {
  if (!player.pitching) return 0;

  const p = player.pitching;

  // 投手能力スコア (90%)
  const pitchingScore =
    (p.stuff * 0.25 +
      p.movement * 0.2 +
      p.control * 0.25 +
      p.stamina * 0.15 +
      p.velocity * 0.1 +
      p.holdRunners * 0.05) *
    0.9;

  // 守備能力スコア (10%)
  const fieldingScore = player.fielding.infieldRange * 0.1;

  return Math.round(pitchingScore + fieldingScore);
}

/**
 * 選手の総合評価を計算
 */
export function calculateOverallRating(player: Player): number {
  if (player.position === 'P' && player.pitching) {
    return calculatePitcherOverall(player);
  }
  return calculateBatterOverall(player);
}

/**
 * 能力値をS/A/B/C/D/E/Fのグレードに変換
 */
export function getAbilityGrade(value: number): string {
  if (value >= 90) return 'S';
  if (value >= 80) return 'A';
  if (value >= 70) return 'B';
  if (value >= 60) return 'C';
  if (value >= 50) return 'D';
  if (value >= 40) return 'E';
  return 'F';
}

/**
 * 能力値に対応する色を取得（可視化用）
 */
export function getAbilityColor(value: number): string {
  if (value >= 90) return '#ff4444'; // S: 赤
  if (value >= 80) return '#ff8800'; // A: オレンジ
  if (value >= 70) return '#ffcc00'; // B: 黄色
  if (value >= 60) return '#88cc00'; // C: 黄緑
  if (value >= 50) return '#00cc88'; // D: 緑
  if (value >= 40) return '#0088cc'; // E: 青
  return '#888888'; // F: グレー
}

/**
 * コンディションの日本語表記を取得
 */
export function getConditionLabel(condition: Condition): string {
  const labels: Record<Condition, string> = {
    excellent: '絶好調',
    good: '好調',
    normal: '普通',
    poor: '不調',
    terrible: '絶不調',
  };
  return labels[condition];
}

/**
 * 疲労度の日本語表記を取得
 */
export function getFatigueLabel(fatigue: FatigueLevel): string {
  const labels: Record<FatigueLevel, string> = {
    fresh: '万全',
    normal: '普通',
    tired: '疲労',
    exhausted: '消耗',
  };
  return labels[fatigue];
}
