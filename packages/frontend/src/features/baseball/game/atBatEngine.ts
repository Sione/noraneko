import { 
  PlayerInGame, 
  Hand, 
  Condition, 
  FatigueLevel,
  RunnerState 
} from '../types';
import { OffensiveInstruction } from '../types/common';
import { PitchOutcome } from '../types/common';
import {
  getAdjustedBattingAbilities,
  getAdjustedPitchingAbilities,
} from './playerAbilityUtils';

/**
 * 打席判定エンジン
 * タスク3: 打席判定と確率計算の基礎
 * タスク5: バント/スクイズ判定（buntEngine.tsと統合）
 */

// 打席結果の種類
export type AtBatOutcome = 
  | 'strikeout'       // 三振
  | 'walk'            // 四球
  | 'in_play';        // インプレー（打球）

// 打球の種類
export type BatType = 
  | 'ground_ball'     // ゴロ
  | 'fly_ball'        // フライ
  | 'line_drive';     // ライナー

// 打球の方向
export type BatDirection = 
  | 'left'            // 左方向
  | 'center_left'     // 中堅やや左
  | 'center'          // 中央
  | 'center_right'    // 中堅やや右
  | 'right';          // 右方向

// 打球の強さ
export type BatStrength = 
  | 'weak'            // 弱い
  | 'medium'          // 普通
  | 'strong'          // 強い
  | 'very_strong';    // 非常に強い

// 打球情報
export interface BatBallInfo {
  type: BatType;
  direction: BatDirection;
  strength: BatStrength;
  extraBasePotential: number; // 長打の可能性 (0-100)
}

// 打席判定結果
export interface AtBatJudgementResult {
  outcome: AtBatOutcome;
  batBallInfo?: BatBallInfo;
  description: string;
}

export interface PitchSimulationResult {
  pitchNumber: number;
  balls: number;
  strikes: number;
  outcome: PitchOutcome;
  description: string;
  batBallInfo?: BatBallInfo;
}

/**
 * 3.1 投手対打者の一次判定
 * 三振/四球/インプレーの判定を能力値で計算
 * 
 * 注: バント/スクイズの場合は別途 buntEngine の judgeBunt() または judgeSqueeze() を使用
 */
export function judgeAtBatOutcome(
  batter: PlayerInGame,
  pitcher: PlayerInGame,
  runners: RunnerState,
  pitchCount: number = 0,
  instruction: OffensiveInstruction = 'normal_swing'
): AtBatJudgementResult {
  // バントとスクイズは別エンジンで処理するため、ここでは通常打撃のみ処理
  if (instruction === 'bunt' || instruction === 'squeeze') {
    // buntEngine.ts の judgeBunt() または judgeSqueeze() を使用すること
    throw new Error('バント/スクイズは buntEngine を使用してください');
  }

  // 補正済みの能力値を取得 (タスク8.2: コンディションと疲労の影響)
  const adjustedBatting = getAdjustedBattingAbilities(
    batter,
    pitcher.pitcherHand || 'right',
    pitchCount
  );
  const adjustedPitching = getAdjustedPitchingAbilities(pitcher, pitchCount);

  // 投手の能力値（制球力・球威・変化球）
  const pitcherStuff = adjustedPitching?.stuff || 50;
  const pitcherControl = adjustedPitching?.control || 50;
  const pitcherMovement = adjustedPitching?.movement || 50;

  // 打者の能力値（選球眼・三振回避・コンタクト）
  const batterEye = adjustedBatting.eye;
  const batterAvoidKs = adjustedBatting.avoidKs;
  const batterContact = adjustedBatting.contact;

  // 三振確率の計算
  const strikeoutChance = calculateStrikeoutChance(
    pitcherStuff,
    pitcherMovement,
    batterAvoidKs,
    batterContact
  );

  // 四球確率の計算
  const walkChance = calculateWalkChance(
    pitcherControl,
    batterEye
  );

  // 乱数で結果を決定
  const roll = Math.random() * 100;

  if (roll < strikeoutChance) {
    return {
      outcome: 'strikeout',
      description: `${batter.name}は三振しました。`
    };
  } else if (roll < strikeoutChance + walkChance) {
    return {
      outcome: 'walk',
      description: `${batter.name}はフォアボールで出塁しました。`
    };
  } else {
    // インプレー（打球が飛んだ）
    const batBallInfo = determineBatBall(batter, pitcher, adjustedBatting, adjustedPitching);
    return {
      outcome: 'in_play',
      batBallInfo,
      description: `${batter.name}が打ちました！`
    };
  }
}

/**
 * 3.1/3.2/3.4 1球ごとの判定
 */
export function simulatePitch(
  batter: PlayerInGame,
  pitcher: PlayerInGame,
  balls: number,
  strikes: number,
  pitchCount: number,
  instruction: OffensiveInstruction = 'normal_swing'
): { outcome: PitchOutcome; description: string; batBallInfo?: BatBallInfo } {
  const adjustedBatting = getAdjustedBattingAbilities(
    batter,
    pitcher.pitcherHand || 'right',
    pitchCount
  );
  const adjustedPitching = getAdjustedPitchingAbilities(pitcher, pitchCount);

  const pitcherControl = adjustedPitching?.control || 50;
  const pitcherStuff = adjustedPitching?.stuff || 50;
  const pitcherMovement = adjustedPitching?.movement || 50;

  const batterEye = adjustedBatting.eye;
  const batterAvoidKs = adjustedBatting.avoidKs;
  const batterContact = adjustedBatting.contact;

  const countAdjust = getCountAdjustments(balls, strikes);

  // ストライクゾーンに投げる確率（Controlに依存）
  let zoneChance = 45 + (pitcherControl - 50) * 0.6;
  zoneChance += countAdjust.zoneDelta;
  zoneChance = clamp(zoneChance, 20, 85);

  const inZone = Math.random() * 100 < zoneChance;

  // 見逃し確率（Eyeが高いほど見逃しが増える）
  let baseTake = 25 + (batterEye - 50) * 0.3;
  if (!inZone) {
    baseTake += 15;
  }

  // 初球は見逃しやすい
  baseTake += countAdjust.takeDelta;

  // 「待て」指示は見逃し率+25%
  if (instruction === 'wait') {
    baseTake += 25;
  }

  const takeChance = clamp(baseTake, 5, 90);
  const isTaking = Math.random() * 100 < takeChance;

  if (isTaking) {
    return {
      outcome: inZone ? 'called_strike' : 'ball',
      description: inZone ? '見逃しストライク' : 'ボール',
    };
  }

  // スイング時のコンタクト確率
  let contactChance = 55 + (batterContact - 50) * 0.4 - (pitcherStuff - 50) * 0.25 - (pitcherMovement - 50) * 0.2;
  if (!inZone) {
    contactChance -= 15;
  }
  contactChance -= countAdjust.swingMissDelta;
  contactChance = clamp(contactChance, 10, 90);

  const makesContact = Math.random() * 100 < contactChance;

  if (!makesContact) {
    return {
      outcome: 'swinging_strike',
      description: '空振り',
    };
  }

  // コンタクト時のインプレー確率
  let inPlayChance = 55 + (batterAvoidKs - 50) * 0.2 + (batterContact - 50) * 0.2;
  if (!inZone) {
    inPlayChance -= 10;
  }
  inPlayChance += countAdjust.inPlayDelta;
  inPlayChance -= countAdjust.foulDelta;
  inPlayChance = clamp(inPlayChance, 10, 85);

  const isInPlay = Math.random() * 100 < inPlayChance;
  if (isInPlay) {
    const batBallInfo = determineBatBall(
      batter,
      pitcher,
      adjustedBatting,
      adjustedPitching,
      countAdjust.extraBaseBonus
    );
    return {
      outcome: 'in_play',
      description: `${batter.name}が打ちました！`,
      batBallInfo,
    };
  }

  return {
    outcome: 'foul',
    description: 'ファウル',
  };
}

/**
 * 3.2 1球判定ループ
 */
export function simulateAtBatWithPitchLoop(
  batter: PlayerInGame,
  pitcher: PlayerInGame,
  runners: RunnerState,
  pitchCount: number,
  instruction: OffensiveInstruction = 'normal_swing'
): { outcome: AtBatOutcome; batBallInfo?: BatBallInfo; pitches: PitchSimulationResult[] } {
  const pitches: PitchSimulationResult[] = [];
  let balls = 0;
  let strikes = 0;
  let pitchNumber = 0;

  while (pitchNumber < 15) {
    pitchNumber += 1;
    const result = simulatePitch(
      batter,
      pitcher,
      balls,
      strikes,
      pitchCount + pitchNumber - 1,
      instruction
    );

    if (result.outcome === 'ball') {
      balls = Math.min(4, balls + 1);
    } else if (result.outcome === 'called_strike' || result.outcome === 'swinging_strike') {
      strikes = Math.min(3, strikes + 1);
    } else if (result.outcome === 'foul') {
      if (strikes < 2) {
        strikes += 1;
      }
    }

    pitches.push({
      pitchNumber,
      balls,
      strikes,
      outcome: result.outcome,
      description: result.description,
      batBallInfo: result.batBallInfo,
    });

    if (result.outcome === 'in_play') {
      return { outcome: 'in_play', batBallInfo: result.batBallInfo, pitches };
    }

    if (strikes >= 3) {
      return { outcome: 'strikeout', pitches };
    }

    if (balls >= 4) {
      return { outcome: 'walk', pitches };
    }
  }

  // セーフティ：長すぎる打席はインプレー扱い
  const fallbackBatBall = determineBatBall(
    batter,
    pitcher,
    getAdjustedBattingAbilities(batter, pitcher.pitcherHand || 'right', pitchCount),
    getAdjustedPitchingAbilities(pitcher, pitchCount)
  );
  return { outcome: 'in_play', batBallInfo: fallbackBatBall, pitches };
}

/**
 * 3.2 打球種類/方向/強さの決定
 */
function determineBatBall(
  batter: PlayerInGame,
  pitcher: PlayerInGame,
  adjustedBatting: any,
  adjustedPitching: any,
  extraBaseBonus: number = 0
): BatBallInfo {
  // 打球の種類を決定
  const batType = determineBatType(batter, pitcher, adjustedPitching);
  
  // 打球の方向を決定（利き手と打球傾向で調整）
  const direction = determineBatDirection(batter.batterHand);
  
  // 打球の強さを決定
  const strength = determineBatStrength(
    adjustedBatting.contact,
    adjustedBatting.babip
  );
  
  // 長打の可能性を計算（3.2の長打補正）
  const extraBasePotential = calculateExtraBasePotential(
    adjustedBatting.gapPower,
    adjustedBatting.hrPower,
    batType,
    strength
  );

  return {
    type: batType,
    direction,
    strength,
    extraBasePotential: Math.min(100, extraBasePotential + extraBaseBonus)
  };
}

/**
 * ゴロ/フライ/ライナーの分布を計算
 */
function determineBatType(
  batter: PlayerInGame,
  pitcher: PlayerInGame,
  adjustedPitching: any
): BatType {
  // 投手のゴロ率
  const pitcherGroundBallPct = adjustedPitching?.groundBallPct || 50;
  
  // 打者のBABIPが高いほどライナー性の当たりが多い
  const batterLineDriveTendency = batter.batting.babip;

  // 確率分布を計算
  const groundBallChance = pitcherGroundBallPct * 0.5; // 投手の影響
  const lineDriveChance = batterLineDriveTendency * 0.25; // ライナーは全体の20-25%程度
  const flyBallChance = 100 - groundBallChance - lineDriveChance;

  const roll = Math.random() * 100;

  if (roll < groundBallChance) {
    return 'ground_ball';
  } else if (roll < groundBallChance + lineDriveChance) {
    return 'line_drive';
  } else {
    return 'fly_ball';
  }
}

/**
 * 打球方向の決定（利き手と打球傾向で調整）
 */
function determineBatDirection(batterHand: Hand): BatDirection {
  const roll = Math.random() * 100;
  
  // 右打者は右方向（pull）に打ちやすい
  // 左打者は左方向（pull）に打ちやすい
  if (batterHand === 'right') {
    if (roll < 35) return 'right'; // プル
    if (roll < 55) return 'center_right';
    if (roll < 75) return 'center';
    if (roll < 90) return 'center_left';
    return 'left'; // 逆方向
  } else if (batterHand === 'left') {
    if (roll < 35) return 'left'; // プル
    if (roll < 55) return 'center_left';
    if (roll < 75) return 'center';
    if (roll < 90) return 'center_right';
    return 'right'; // 逆方向
  } else {
    // スイッチヒッター（均等分布）
    if (roll < 20) return 'left';
    if (roll < 40) return 'center_left';
    if (roll < 60) return 'center';
    if (roll < 80) return 'center_right';
    return 'right';
  }
}

/**
 * 打球の強さを決定
 */
function determineBatStrength(contact: number, babip: number): BatStrength {
  // コンタクト能力とBABIPで強さを決定
  const strengthScore = (contact + babip) / 2;
  const roll = Math.random() * 100;

  // 能力値が高いほど強い打球が出やすい
  const strongThreshold = Math.max(20, 100 - strengthScore * 0.5);
  const mediumThreshold = Math.max(50, 100 - strengthScore * 0.3);

  if (roll < strongThreshold * 0.3) {
    return 'very_strong';
  } else if (roll < strongThreshold) {
    return 'strong';
  } else if (roll < mediumThreshold) {
    return 'medium';
  } else {
    return 'weak';
  }
}

/**
 * 長打の可能性を計算（3.2の長打補正）
 */
function calculateExtraBasePotential(
  gapPower: number,
  hrPower: number,
  batType: BatType,
  strength: BatStrength
): number {
  let basePotential = (gapPower + hrPower) / 2;

  // 打球の種類による補正
  if (batType === 'line_drive') {
    basePotential *= 1.3; // ライナーは長打になりやすい
  } else if (batType === 'fly_ball') {
    basePotential *= 1.5; // フライは長打になりやすい
  } else {
    basePotential *= 0.3; // ゴロは長打になりにくい
  }

  // 強さによる補正
  const strengthMultiplier = {
    'weak': 0.3,
    'medium': 0.7,
    'strong': 1.2,
    'very_strong': 1.8
  }[strength];

  basePotential *= strengthMultiplier;

  return Math.min(100, Math.max(0, basePotential));
}

/**
 * 三振確率の計算
 */
function calculateStrikeoutChance(
  pitcherStuff: number,
  pitcherMovement: number,
  batterAvoidKs: number,
  batterContact: number
): number {
  // 投手の三振能力
  const pitcherKAbility = (pitcherStuff + pitcherMovement) / 2;
  
  // 打者の三振回避能力
  const batterKResistance = (batterAvoidKs + batterContact) / 2;

  // 基本三振率: 15-30%
  const baseKRate = 22;
  const differential = (pitcherKAbility - batterKResistance) * 0.15;

  return Math.min(40, Math.max(5, baseKRate + differential));
}

/**
 * 四球確率の計算
 */
function calculateWalkChance(
  pitcherControl: number,
  batterEye: number
): number {
  // 投手の制球力が低いほど、打者の選球眼が高いほど四球が多い
  const controlFactor = (100 - pitcherControl) * 0.5;
  const eyeFactor = batterEye * 0.5;

  // 基本四球率: 5-12%
  const baseWalkRate = 8;
  const differential = (controlFactor + eyeFactor) / 2 - 50;

  return Math.min(20, Math.max(2, baseWalkRate + differential * 0.1));
}

function getCountAdjustments(balls: number, strikes: number): {
  zoneDelta: number;
  inPlayDelta: number;
  takeDelta: number;
  swingMissDelta: number;
  foulDelta: number;
  extraBaseBonus: number;
} {
  const key = `${balls}-${strikes}`;
  const isBatterFavorable = key === '2-0' || key === '3-0' || key === '3-1';
  const isPitcherFavorable = key === '0-2' || key === '1-2';
  const isFullCount = key === '3-2';
  const isFirstPitch = key === '0-0';

  return {
    zoneDelta: isBatterFavorable ? 10 : isPitcherFavorable ? -15 : isFullCount ? 5 : 0,
    inPlayDelta: isBatterFavorable ? 15 : isFullCount ? 10 : 0,
    takeDelta: isFirstPitch ? 10 : 0,
    swingMissDelta: isPitcherFavorable ? 10 : 0,
    foulDelta: isPitcherFavorable ? 10 : 0,
    extraBaseBonus: isBatterFavorable ? 20 : 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 3.3 守備判定への接続
 * ヒット種類を判定するための打球情報を整理
 */
export interface DefensivePlayInput {
  batBallInfo: BatBallInfo;
  batter: PlayerInGame;
  runners: RunnerState;
  outs: number;
}

/**
 * デバッグ用: 打球情報を文字列化
 */
export function describeBatBall(batBallInfo: BatBallInfo): string {
  const typeLabels: Record<BatType, string> = {
    'ground_ball': 'ゴロ',
    'fly_ball': 'フライ',
    'line_drive': 'ライナー'
  };

  const directionLabels: Record<BatDirection, string> = {
    'left': '左方向',
    'center_left': 'レフト前',
    'center': 'センター方向',
    'center_right': 'ライト前',
    'right': '右方向'
  };

  const strengthLabels: Record<BatStrength, string> = {
    'weak': '弱い',
    'medium': '中程度',
    'strong': '強い',
    'very_strong': '非常に強い'
  };

  return `${directionLabels[batBallInfo.direction]}への${strengthLabels[batBallInfo.strength]}${typeLabels[batBallInfo.type]}`;
}
