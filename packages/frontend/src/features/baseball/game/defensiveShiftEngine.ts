/**
 * 守備シフトエンジン
 * Requirement 11: 守備シフトシステム
 */

import { DefensiveShift } from '../types/common';
import { PlayerInGame } from '../types/player';
import { GameState } from './gameSlice';

/**
 * シフト基本補正表
 * AC 1-7: 守備シフトの種類と定義
 */
export interface ShiftModifiers {
  // ゴロ処理
  pullDirectionGroundBall: number; // 引っ張り方向のゴロ補正
  oppositeDirectionGroundBall: number; // 逆方向のゴロ補正
  groundBallSpeed: number; // ゴロ処理速度補正
  deepGroundBallRange: number; // 深い打球の処理範囲補正
  
  // フライ・ライナー
  outfieldRange: number; // 外野守備範囲補正
  infieldFlyRange: number; // 内野フライ範囲補正
  linerCatchDifficulty: number; // ライナー捕球難易度補正
  
  // 長打・進塁
  extraBaseHitRate: number; // 長打発生率補正
  infieldHitRate: number; // 内野安打発生率補正
  advanceRunnerRate: number; // 追加進塁率補正
  
  // 本塁阻止（前進守備専用）
  homeThrowSuccess: number; // 本塁送球成功率補正
}

/**
 * シフトタイプごとの基本補正
 * AC 3-7の基本補正値を定義
 */
export const SHIFT_BASE_MODIFIERS: Record<DefensiveShift, ShiftModifiers> = {
  normal: {
    pullDirectionGroundBall: 0,
    oppositeDirectionGroundBall: 0,
    groundBallSpeed: 0,
    deepGroundBallRange: 0,
    outfieldRange: 0,
    infieldFlyRange: 0,
    linerCatchDifficulty: 0,
    extraBaseHitRate: 0,
    infieldHitRate: 0,
    advanceRunnerRate: 0,
    homeThrowSuccess: 0,
  },
  pull_right: {
    pullDirectionGroundBall: 15, // AC 3: 右方向 +15%
    oppositeDirectionGroundBall: -20, // AC 3: 左方向 -20%
    groundBallSpeed: 0,
    deepGroundBallRange: 0,
    outfieldRange: 0,
    infieldFlyRange: 0,
    linerCatchDifficulty: 0,
    extraBaseHitRate: 0,
    infieldHitRate: 0,
    advanceRunnerRate: 0,
    homeThrowSuccess: 0,
  },
  pull_left: {
    pullDirectionGroundBall: 15, // AC 4: 左方向 +15%
    oppositeDirectionGroundBall: -20, // AC 4: 右方向 -20%
    groundBallSpeed: 0,
    deepGroundBallRange: 0,
    outfieldRange: 0,
    infieldFlyRange: 0,
    linerCatchDifficulty: 0,
    extraBaseHitRate: 0,
    infieldHitRate: 0,
    advanceRunnerRate: 0,
    homeThrowSuccess: 0,
  },
  extreme_shift: {
    pullDirectionGroundBall: 25, // AC 5: 引っ張り方向 +25%
    oppositeDirectionGroundBall: -35, // AC 5: 逆方向 -35%
    groundBallSpeed: 0,
    deepGroundBallRange: 0,
    outfieldRange: 0,
    infieldFlyRange: 0,
    linerCatchDifficulty: 0,
    extraBaseHitRate: 0,
    infieldHitRate: 0,
    advanceRunnerRate: 0,
    homeThrowSuccess: 0,
  },
  infield_in: {
    pullDirectionGroundBall: 0,
    oppositeDirectionGroundBall: 0,
    groundBallSpeed: 20, // AC 6: ゴロ処理速度 +20%
    deepGroundBallRange: -15, // AC 6: 深い打球 -15%
    outfieldRange: -10, // 外野も影響を受ける
    infieldFlyRange: 0,
    linerCatchDifficulty: 0,
    extraBaseHitRate: 10, // 長打が出やすくなる
    infieldHitRate: 0,
    advanceRunnerRate: 0,
    homeThrowSuccess: 40, // AC 22で詳細計算
  },
  infield_back: {
    pullDirectionGroundBall: 0,
    oppositeDirectionGroundBall: 0,
    groundBallSpeed: 0,
    deepGroundBallRange: 0,
    outfieldRange: 15, // AC 7: 長打処理範囲 +15%
    infieldFlyRange: -10, // AC 25で詳細計算
    linerCatchDifficulty: 0,
    extraBaseHitRate: 0,
    infieldHitRate: 20, // AC 7: 内野安打 +20%
    advanceRunnerRate: 0,
    homeThrowSuccess: 0,
  },
};

/**
 * 打球方向タイプ
 */
export type BallDirection = 
  | 'pull' // 引っ張り方向
  | 'center' // 中央方向
  | 'opposite'; // 逆方向

/**
 * 守備選手の平均能力値を計算
 */
export function calculateAverageDefensiveAbility(
  players: PlayerInGame[],
  infield: boolean
): number {
  const relevantPlayers = players.filter(p => {
    if (infield) {
      return ['1B', '2B', '3B', 'SS'].includes(p.position);
    } else {
      return ['LF', 'CF', 'RF'].includes(p.position);
    }
  });

  if (relevantPlayers.length === 0) return 70; // デフォルト値

  const totalRange = relevantPlayers.reduce((sum, p) => {
    const range = infield ? p.fielding.infieldRange : p.fielding.outfieldRange;
    return sum + (range || 70);
  }, 0);

  return totalRange / relevantPlayers.length;
}

/**
 * 打球方向を判定
 * AC 20-22: 打球方向と打者の利き手
 */
export function determineBallDirection(
  batterHand: 'left' | 'right' | 'switch',
  actualDirection: string
): BallDirection {
  // 左打者: 右方向が引っ張り、左方向が逆方向
  if (batterHand === 'left') {
    if (actualDirection.includes('右') || actualDirection.includes('一') || actualDirection.includes('二')) {
      return 'pull';
    } else if (actualDirection.includes('左') || actualDirection.includes('三')) {
      return 'opposite';
    }
  }
  // 右打者: 左方向が引っ張り、右方向が逆方向
  else if (batterHand === 'right') {
    if (actualDirection.includes('左') || actualDirection.includes('三')) {
      return 'pull';
    } else if (actualDirection.includes('右') || actualDirection.includes('一') || actualDirection.includes('二')) {
      return 'opposite';
    }
  }

  return 'center';
}

/**
 * シフト効果を計算（ゴロ打球）
 * AC 16-22: ゴロ打球への効果
 */
export function calculateGroundBallShiftEffect(
  shift: DefensiveShift,
  ballDirection: BallDirection,
  avgInfieldRange: number,
  batterHand: 'left' | 'right' | 'switch'
): {
  infieldHitRateModifier: number;
  outProbabilityModifier: number;
  guaranteedHitBonus: number;
} {
  const baseModifiers = SHIFT_BASE_MODIFIERS[shift];
  
  // AC 16: シフト効果 = シフト基本補正 × (守備選手Infield Range平均 / 70)
  const abilityFactor = avgInfieldRange / 70;

  let infieldHitRateModifier = 0;
  let outProbabilityModifier = 0;
  let guaranteedHitBonus = 0;

  // 通常守備の場合は補正なし
  if (shift === 'normal') {
    return { infieldHitRateModifier: 0, outProbabilityModifier: 0, guaranteedHitBonus: 0 };
  }

  // 前進守備の特殊処理
  if (shift === 'infield_in') {
    // AC 21: ゴロ処理速度補正
    outProbabilityModifier = baseModifiers.groundBallSpeed * abilityFactor;
    return { infieldHitRateModifier, outProbabilityModifier, guaranteedHitBonus };
  }

  // 深守備の特殊処理
  if (shift === 'infield_back') {
    // AC 7: 内野安打発生率 +20%
    infieldHitRateModifier = baseModifiers.infieldHitRate;
    return { infieldHitRateModifier, outProbabilityModifier, guaranteedHitBonus };
  }

  // シフト方向のゴロ（引っ張り方向）
  if (ballDirection === 'pull') {
    if (shift === 'extreme_shift') {
      // AC 19: 極端シフト、引っ張り方向
      infieldHitRateModifier = -50 * abilityFactor;
      outProbabilityModifier = 20 * abilityFactor;
    } else {
      // AC 17: 右打ちシフト/左打ちシフト、シフト方向
      infieldHitRateModifier = -30 * abilityFactor;
    }
  }
  // 逆方向のゴロ
  else if (ballDirection === 'opposite') {
    const oppositeAbilityFactor = 80 / avgInfieldRange;
    
    if (shift === 'extreme_shift') {
      // AC 20: 極端シフト、逆方向
      infieldHitRateModifier = 60 * oppositeAbilityFactor;
      guaranteedHitBonus = 30; // 守備穴が大きいため
    } else {
      // AC 18: 右打ちシフト/左打ちシフト、逆方向
      infieldHitRateModifier = 40 * oppositeAbilityFactor;
    }
  }

  return { infieldHitRateModifier, outProbabilityModifier, guaranteedHitBonus };
}

/**
 * シフト効果を計算（フライ・ライナー打球）
 * AC 24-27: フライ・ライナー打球への効果
 */
export function calculateFlyBallShiftEffect(
  shift: DefensiveShift,
  ballType: 'fly' | 'liner',
  isInfield: boolean,
  avgDefensiveRange: number,
  ballDirection: BallDirection
): {
  rangeModifier: number;
  catchDifficultyModifier: number;
  extraBaseModifier: number;
} {
  const baseModifiers = SHIFT_BASE_MODIFIERS[shift];
  let rangeModifier = 0;
  let catchDifficultyModifier = 0;
  let extraBaseModifier = 0;

  // 通常守備の場合は補正なし
  if (shift === 'normal') {
    return { rangeModifier: 0, catchDifficultyModifier: 0, extraBaseModifier: 0 };
  }

  // 深守備
  if (shift === 'infield_back') {
    if (!isInfield) {
      // AC 24: 外野フライ、深守備
      const abilityFactor = avgDefensiveRange / 70;
      rangeModifier = 20 * abilityFactor;
      catchDifficultyModifier = 15 * abilityFactor;
    } else {
      // AC 25: 内野フライ、深守備
      const oppositeAbilityFactor = 80 / avgDefensiveRange;
      rangeModifier = -10 * oppositeAbilityFactor;
      extraBaseModifier = 15 * oppositeAbilityFactor; // ポテンヒット発生率
    }
  }

  // 前進守備
  if (shift === 'infield_in') {
    if (!isInfield) {
      // AC 26: 外野フライ、前進守備
      const oppositeAbilityFactor = 80 / avgDefensiveRange;
      rangeModifier = -10 * oppositeAbilityFactor;
      extraBaseModifier = 10 * oppositeAbilityFactor;
    }
  }

  // ライナーの場合のシフト効果
  if (ballType === 'liner') {
    // AC 27: ライナー打球のシフト効果
    const abilityFactor = avgDefensiveRange / 70;
    const oppositeAbilityFactor = 70 / avgDefensiveRange;

    if (shift === 'extreme_shift') {
      if (ballDirection === 'pull') {
        catchDifficultyModifier = 25 * abilityFactor;
      } else if (ballDirection === 'opposite') {
        catchDifficultyModifier = -40 * oppositeAbilityFactor;
      }
    } else if (shift === 'pull_right' || shift === 'pull_left') {
      if (ballDirection === 'pull') {
        catchDifficultyModifier = 15 * abilityFactor;
      } else if (ballDirection === 'opposite') {
        catchDifficultyModifier = -20 * oppositeAbilityFactor;
      }
    }
  }

  return { rangeModifier, catchDifficultyModifier, extraBaseModifier };
}

/**
 * シフト効果を計算（長打・進塁）
 * AC 29-34: 長打と進塁への効果
 */
export function calculateExtraBaseShiftEffect(
  shift: DefensiveShift,
  hitType: 'single' | 'double' | 'triple',
  ballDirection: BallDirection
): {
  extraBaseRateModifier: number;
  advanceRunnerModifier: number;
} {
  let extraBaseRateModifier = 0;
  let advanceRunnerModifier = 0;

  if (shift === 'normal') {
    return { extraBaseRateModifier: 0, advanceRunnerModifier: 0 };
  }

  // AC 29-31: シフト逆方向への長打発生率上昇
  if (ballDirection === 'opposite') {
    if (shift === 'extreme_shift') {
      if (hitType === 'double') {
        extraBaseRateModifier = 35; // AC 30
      } else if (hitType === 'triple') {
        extraBaseRateModifier = 50; // AC 31
      }
    } else if (shift === 'pull_right' || shift === 'pull_left') {
      if (hitType === 'double') {
        extraBaseRateModifier = 20; // AC 29
      }
    }
  }

  // AC 32-33: 守備シフトと進塁
  if (shift === 'infield_back') {
    if (hitType === 'triple') {
      // 三塁打発生率を下げ、二塁打に変換
      extraBaseRateModifier = -20;
    }
  }

  if (shift === 'infield_in') {
    if (hitType === 'double') {
      // 二塁打発生率を上昇
      extraBaseRateModifier = 10;
      // 一塁ランナーの本塁到達確率を上昇
      advanceRunnerModifier = 15;
    }
  }

  // AC 34: シフト逆方向のヒットでランナー追加進塁
  if (ballDirection === 'opposite') {
    advanceRunnerModifier += 20;
  }

  return { extraBaseRateModifier, advanceRunnerModifier };
}

/**
 * シフト効果を計算（特殊状況）
 * AC 35-40: 特殊状況への効果
 */
export function calculateSpecialShiftEffect(
  shift: DefensiveShift,
  batter: PlayerInGame,
  situation: 'contact_high' | 'bunt_high' | 'power_swing' | 'infield_hit_attempt' | 'opposite_field_attempt' | 'double_play'
): {
  situationModifier: number;
  abilityPenalty: number;
} {
  let situationModifier = 0;
  let abilityPenalty = 0;

  // AC 35: 極端シフト + Contact能力70以上 → 逆方向狙いの確率上昇
  if (shift === 'extreme_shift' && situation === 'contact_high') {
    const contact = batter.batting.contact || 50;
    if (contact >= 70) {
      situationModifier = 30; // 逆方向を狙う確率 +30%
    }
  }

  // AC 36: 極端シフト + Bunt for Hit 60以上 → バントヒット確率上昇
  if (shift === 'extreme_shift' && situation === 'bunt_high') {
    const buntForHit = batter.fielding.buntForHit || 0;
    if (buntForHit >= 60) {
      situationModifier = 40; // バントヒット試行確率 +40%
    }
  }

  // AC 37: 前進守備 + 強振 → 長打発生率上昇
  if (shift === 'infield_in' && situation === 'power_swing') {
    situationModifier = 15;
  }

  // AC 38: 深守備 + 内野安打狙い → 成功率上昇
  if (shift === 'infield_back' && situation === 'infield_hit_attempt') {
    situationModifier = 25;
  }

  // AC 39: シフト適用 + 逆方向狙い → Contact能力低下
  if (situation === 'opposite_field_attempt' && shift !== 'normal') {
    abilityPenalty = -10; // Contact能力 -10%
  }

  // AC 40: ダブルプレー機会でのシフト効果
  if (situation === 'double_play') {
    if (shift === 'pull_right' || shift === 'pull_left' || shift === 'extreme_shift') {
      // シフト方向のゴロでDP成功率上昇
      situationModifier = 15;
    }
  }

  return { situationModifier, abilityPenalty };
}

/**
 * シフト推奨を判定
 * AC 8-15: 守備シフトの選択条件と制約
 */
export interface ShiftRecommendation {
  recommendedShift: DefensiveShift;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  warning?: string;
}

export function getShiftRecommendation(
  batter: PlayerInGame,
  gameState: GameState
): ShiftRecommendation {
  const { runners, outs } = gameState;
  const batterHand = batter.batterHand || 'right';
  const hrPower = batter.batting.hrPower || 50;
  const contact = batter.batting.contact || 50;

  // AC 12-13: ランナーが得点圏にいる場合は極端シフトにリスク警告
  const hasRunnerInScoringPosition = runners.second !== null || runners.third !== null;
  
  // AC 12: ランナーが三塁にいてワンアウト以下 → 前進守備を推奨
  if (runners.third !== null && outs <= 1) {
    return {
      recommendedShift: 'infield_in',
      confidence: 'high',
      reason: '三塁ランナーを本塁で刺すチャンスです',
      warning: undefined,
    };
  }

  // AC 11: HR Power 80以上 → 極端シフトを推奨
  if (hrPower >= 80) {
    const shift = batterHand === 'left' ? 'pull_right' : 'pull_left';
    return {
      recommendedShift: 'extreme_shift',
      confidence: 'high',
      reason: '強打者のため極端シフトが有効です',
      warning: hasRunnerInScoringPosition ? 'リスク警告: 進塁を許しやすくなります' : undefined,
    };
  }

  // AC 9-10: 打者の利き手に応じた推奨
  if (hrPower >= 60) {
    const shift = batterHand === 'left' ? 'pull_right' : 'pull_left';
    return {
      recommendedShift: shift,
      confidence: 'medium',
      reason: `${batterHand === 'left' ? '左' : '右'}打者の引っ張り方向をカバーします`,
      warning: hasRunnerInScoringPosition ? 'リスク警告: 進塁を許しやすくなります' : undefined,
    };
  }

  // AC 14: Contact能力が40未満の場合は効果限定的
  if (contact < 40) {
    return {
      recommendedShift: 'normal',
      confidence: 'low',
      reason: '打者が空振りしやすいため効果は限定的です',
      warning: undefined,
    };
  }

  return {
    recommendedShift: 'normal',
    confidence: 'medium',
    reason: '通常守備が適切です',
    warning: undefined,
  };
}

/**
 * シフト統計を記録
 */
export interface ShiftStatistics {
  shiftType: DefensiveShift;
  usageCount: number;
  successCount: number; // アウト
  failureCount: number; // 安打
  extraBaseHits: number; // 長打
}

export class ShiftStatisticsTracker {
  private stats: Map<DefensiveShift, ShiftStatistics> = new Map();

  constructor() {
    // 初期化
    const shifts: DefensiveShift[] = ['normal', 'pull_right', 'pull_left', 'extreme_shift', 'infield_in', 'infield_back'];
    shifts.forEach(shift => {
      this.stats.set(shift, {
        shiftType: shift,
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        extraBaseHits: 0,
      });
    });
  }

  /**
   * シフト使用を記録
   */
  recordUsage(shift: DefensiveShift): void {
    const stat = this.stats.get(shift);
    if (stat) {
      stat.usageCount++;
    }
  }

  /**
   * シフト成功を記録
   */
  recordSuccess(shift: DefensiveShift): void {
    const stat = this.stats.get(shift);
    if (stat) {
      stat.successCount++;
    }
  }

  /**
   * シフト失敗を記録
   */
  recordFailure(shift: DefensiveShift, isExtraBase: boolean = false): void {
    const stat = this.stats.get(shift);
    if (stat) {
      stat.failureCount++;
      if (isExtraBase) {
        stat.extraBaseHits++;
      }
    }
  }

  /**
   * 統計を取得
   */
  getStatistics(shift: DefensiveShift): ShiftStatistics | undefined {
    return this.stats.get(shift);
  }

  /**
   * 全統計を取得
   */
  getAllStatistics(): ShiftStatistics[] {
    return Array.from(this.stats.values());
  }

  /**
   * 成功率を計算
   */
  getSuccessRate(shift: DefensiveShift): number {
    const stat = this.stats.get(shift);
    if (!stat || stat.usageCount === 0) return 0;
    return (stat.successCount / stat.usageCount) * 100;
  }
}
