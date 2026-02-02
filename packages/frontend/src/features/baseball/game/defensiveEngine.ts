import { 
  PlayerInGame, 
  Position,
  RunnerState,
  Runner,
  DefensiveShift 
} from '../types';
import { BatBallInfo, BatType, BatDirection, BatStrength, DefensivePlayInput } from './atBatEngine';
import {
  evaluateSingleAdvancement,
  evaluateDoubleAdvancement,
  determineBasicAdvancement,
  generateScoringCommentary,
  BaseRunningAdvancement
} from './baseRunningEngine';
import {
  calculateGroundBallShiftEffect,
  calculateFlyBallShiftEffect,
  calculateExtraBaseShiftEffect,
  determineBallDirection,
  calculateAverageDefensiveAbility,
  BallDirection
} from './defensiveShiftEngine';

/**
 * 守備判定エンジン
 * タスク4で本格実装予定（現在は基本構造のみ）
 */

// 守備結果の種類
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

// エラーの種類
export type ErrorType =
  | 'fielding'         // 捕球エラー
  | 'throwing'         // 送球エラー
  | 'dropped_fly';     // フライ落球

// 守備判定結果
export interface DefensiveResult {
  outcome: DefensiveOutcome;
  fielder?: PlayerInGame;
  fielderPosition?: Position;
  assistBy?: PlayerInGame;
  errorType?: ErrorType;
  description: string;
  runnersAdvanced: {
    from: 'first' | 'second' | 'third' | 'batter';
    to: 'first' | 'second' | 'third' | 'home' | 'out';
    isTagUp?: boolean;
  }[];
  runsScored: number;
  outsRecorded: number;
}

/**
 * 4.1 打球方向に基づく担当選手の特定
 * 
 * 守備位置と補助担当のルールを適用し、シフト適用時の処理条件を反映する
 */
function determineFielder(
  direction: BatDirection,
  batType: BatType,
  defendingTeam: PlayerInGame[],
  shift: DefensiveShift = 'normal'
): { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame } | null {
  // シフト適用時の位置調整
  const adjustedPositions = applyShiftAdjustment(direction, batType, shift);
  
  // 打球の種類に応じた担当優先度
  const priorityPositions = determinePriorityPositions(direction, batType, adjustedPositions);

  // 担当選手を探す（優先度順）
  for (const position of priorityPositions) {
    const fielder = defendingTeam.find(p => p.position === position);
    if (fielder) {
      // 補助担当を決定（併殺などで必要）
      const assistBy = determineAssistFielder(position, batType, defendingTeam);
      return { primary: fielder, position, assistBy };
    }
  }

  return null;
}

/**
 * シフト適用時の守備位置調整
 */
function applyShiftAdjustment(
  direction: BatDirection,
  batType: BatType,
  shift: DefensiveShift
): BatDirection {
  // 通常守備の場合は調整なし
  if (shift === 'normal') {
    return direction;
  }

  // プルシフト（右打者対策：右側に寄せる）
  if (shift === 'pull_right') {
    if (direction === 'left') return 'center_left';
    if (direction === 'center_left') return 'center';
    return direction;
  }

  // プルシフト（左打者対策：左側に寄せる）
  if (shift === 'pull_left') {
    if (direction === 'right') return 'center_right';
    if (direction === 'center_right') return 'center';
    return direction;
  }

  // 極端なシフト
  if (shift === 'extreme_shift') {
    // 打球方向によって大きく調整
    if (direction === 'left' || direction === 'center_left') {
      return 'center';
    }
    if (direction === 'right' || direction === 'center_right') {
      return 'center';
    }
    return direction;
  }

  // 前進守備・深守備は位置調整なし（守備範囲補正で対応）
  return direction;
}

/**
 * 打球方向と種類に応じた守備位置の優先度を決定
 */
function determinePriorityPositions(
  direction: BatDirection,
  batType: BatType,
  adjustedDirection?: BatDirection
): Position[] {
  const effectiveDirection = adjustedDirection || direction;

  // 基本的な守備位置マッピング
  const basePositionMap: Record<BatDirection, Position[]> = {
    'left': ['LF', '3B', 'SS', 'CF'],
    'center_left': ['CF', 'LF', 'SS', '2B'],
    'center': ['CF', '2B', 'SS', 'P'],
    'center_right': ['CF', 'RF', '2B', '1B'],
    'right': ['RF', '1B', '2B', 'CF']
  };

  let positions = basePositionMap[effectiveDirection];

  // ゴロの場合は内野手を最優先
  if (batType === 'ground_ball') {
    const infieldPositions = positions.filter(pos => 
      ['1B', '2B', '3B', 'SS', 'P'].includes(pos)
    );
    const outfieldPositions = positions.filter(pos => 
      ['LF', 'CF', 'RF'].includes(pos)
    );
    positions = [...infieldPositions, ...outfieldPositions];
  }

  // フライの場合は外野手を最優先
  if (batType === 'fly_ball') {
    const outfieldPositions = positions.filter(pos => 
      ['LF', 'CF', 'RF'].includes(pos)
    );
    const infieldPositions = positions.filter(pos => 
      ['1B', '2B', '3B', 'SS'].includes(pos)
    );
    positions = [...outfieldPositions, ...infieldPositions];
  }

  // ライナーは打球方向の選手を優先（内外野問わず）
  // basePositionMapの順序をそのまま使用

  return positions;
}

/**
 * 補助担当選手を決定（併殺や中継プレイで使用）
 */
function determineAssistFielder(
  primaryPosition: Position,
  batType: BatType,
  defendingTeam: PlayerInGame[]
): PlayerInGame | undefined {
  // ゴロで内野手が担当の場合、ベースカバーの選手を補助として設定
  if (batType === 'ground_ball') {
    let assistPosition: Position | undefined;

    switch (primaryPosition) {
      case 'SS':
      case '3B':
        assistPosition = '2B'; // 二塁ベースカバー
        break;
      case '2B':
      case '1B':
        assistPosition = 'SS'; // 二塁ベースカバー
        break;
      case 'P':
        assistPosition = '1B'; // 一塁ベースカバー
        break;
    }

    if (assistPosition) {
      return defendingTeam.find(p => p.position === assistPosition);
    }
  }

  // 外野フライの場合は中継担当（二塁打以上の場合に使用）
  if (batType === 'fly_ball') {
    const outfieldPositions: Position[] = ['LF', 'CF', 'RF'];
    if (outfieldPositions.includes(primaryPosition)) {
      // 外野手が主担当の場合、近い内野手が中継
      const relayPosition = primaryPosition === 'LF' ? 'SS' : 
                            primaryPosition === 'CF' ? '2B' : 
                            '2B'; // RF の場合も 2B
      return defendingTeam.find(p => p.position === relayPosition);
    }
  }

  return undefined;
}

/**
 * 4.2 守備処理（詳細版）
 * ゴロ/フライ/ライナーの守備判定を詳細に実装
 */
export function processDefensivePlay(
  input: DefensivePlayInput,
  defendingTeam: PlayerInGame[],
  shift: DefensiveShift = 'normal'
): DefensiveResult {
  const { batBallInfo, batter, runners, outs } = input;

  // 担当守備選手を特定
  const fielderInfo = determineFielder(batBallInfo.direction, batBallInfo.type, defendingTeam, shift);

  if (!fielderInfo) {
    // 守備選手が見つからない場合（エラー回避）
    return createSimpleHitResult(batBallInfo, batter, runners, outs);
  }

  // 打球の種類に応じた守備判定
  let defensiveResult: DefensiveOutcome | null = null;
  let errorType: ErrorType | undefined;

  if (batBallInfo.type === 'ground_ball') {
    const groundBallResult = processGroundBall(batBallInfo, fielderInfo, runners, outs, shift, defendingTeam);
    defensiveResult = groundBallResult.outcome;
    errorType = groundBallResult.errorType;
  } else if (batBallInfo.type === 'fly_ball') {
    const flyBallResult = processFlyBall(batBallInfo, fielderInfo, runners, outs, shift, defendingTeam);
    defensiveResult = flyBallResult.outcome;
    errorType = flyBallResult.errorType;
  } else if (batBallInfo.type === 'line_drive') {
    const lineDriveResult = processLineDrive(batBallInfo, fielderInfo, runners, outs, shift, defendingTeam);
    defensiveResult = lineDriveResult.outcome;
    errorType = lineDriveResult.errorType;
  }

  if (!defensiveResult) {
    // フォールバック
    defensiveResult = 'single';
  }

  return createDefensiveResult(
    defensiveResult, 
    batBallInfo, 
    fielderInfo, 
    runners, 
    outs, 
    batter,
    errorType
  );
}

/**
 * 簡易的な結果判定（タスク4で詳細実装予定）
 */
function determineSimpleOutcome(
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame } | null
): DefensiveOutcome {
  const { type, strength, extraBasePotential } = batBallInfo;

  // 本塁打判定
  if (type === 'fly_ball' && extraBasePotential > 80 && strength === 'very_strong') {
    return 'home_run';
  }

  // 三塁打判定
  if (extraBasePotential > 70 && (strength === 'very_strong' || strength === 'strong')) {
    return 'triple';
  }

  // 二塁打判定
  if (extraBasePotential > 50 && strength !== 'weak') {
    return 'double';
  }

  // ゴロは守備能力で判定
  if (type === 'ground_ball') {
    if (!fielderInfo) return 'single';
    
    const fielder = fielderInfo.primary;
    const fieldingAbility = fielder.fielding.infieldRange;
    const errorRate = 100 - fielder.fielding.infieldError;

    // エラー判定
    if (Math.random() * 100 < errorRate * 0.1) {
      return 'error';
    }

    // 守備範囲判定
    if (strength === 'weak') {
      return Math.random() * 100 < 80 ? 'out' : 'single';
    } else if (strength === 'medium') {
      return Math.random() * 100 < fieldingAbility * 0.7 ? 'out' : 'single';
    } else if (strength === 'strong') {
      return Math.random() * 100 < fieldingAbility * 0.4 ? 'out' : 'single';
    } else {
      return 'single'; // 非常に強い打球は抜けやすい
    }
  }

  // フライ・ライナーの判定
  if (type === 'fly_ball' || type === 'line_drive') {
    if (!fielderInfo) return 'single';

    const fielder = fielderInfo.primary;
    const isInfield = ['1B', '2B', '3B', 'SS'].includes(fielderInfo.position);
    const fieldingRange = isInfield ? fielder.fielding.infieldRange : fielder.fielding.outfieldRange;

    // ライナーは捕球が難しい
    const catchDifficulty = type === 'line_drive' ? 0.7 : 0.9;

    if (strength === 'weak' || strength === 'medium') {
      return Math.random() * 100 < fieldingRange * catchDifficulty ? 'out' : 'single';
    } else {
      return Math.random() * 100 < fieldingRange * 0.5 * catchDifficulty ? 'out' : 'single';
    }
  }

  return 'single';
}

/**
 * 4.2.1 ゴロの守備処理
 * 
 * 守備範囲・エラー・捕球判定を適用
 */
function processGroundBall(
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame },
  runners: RunnerState,
  outs: number,
  shift: DefensiveShift,
  defendingTeam?: PlayerInGame[]
): { outcome: DefensiveOutcome; errorType?: ErrorType } {
  const { strength, direction } = batBallInfo;
  const fielder = fielderInfo.primary;

  // シフト効果を計算（タスク15: Requirement 11）
  let shiftBonus = 0;
  let infieldHitRateModifier = 0;
  let outProbabilityModifier = 0;
  let guaranteedHitBonus = 0;

  if (defendingTeam) {
    // 内野手の平均守備能力を計算
    const avgInfieldRange = calculateAverageDefensiveAbility(defendingTeam, true);
    
    // 打球方向を判定（打者の利き手は batBallInfo に含まれていないため、方向文字列で判定）
    const ballDirection = determineBallDirection('right', direction);
    
    // シフト効果を計算
    const shiftEffect = calculateGroundBallShiftEffect(
      shift,
      ballDirection,
      avgInfieldRange,
      'right' // 簡略化: 実際は打者情報から取得
    );
    
    infieldHitRateModifier = shiftEffect.infieldHitRateModifier;
    outProbabilityModifier = shiftEffect.outProbabilityModifier;
    guaranteedHitBonus = shiftEffect.guaranteedHitBonus;
  } else {
    // 従来のシンプルなシフトボーナス
    shiftBonus = shift === 'infield_in' ? 15 : shift === 'infield_back' ? -10 : 0;
  }

  // 守備範囲判定
  const fieldingRange = fielder.fielding.infieldRange + shiftBonus;
  const errorResistance = fielder.fielding.infieldError;

  // 打球の強さによる捕球難易度
  const catchDifficulty: Record<BatStrength, number> = {
    'weak': 90,
    'medium': 70,
    'strong': 45,
    'very_strong': 20
  };

  const baseCatchChance = catchDifficulty[strength];
  let actualCatchChance = (baseCatchChance * fieldingRange) / 100;
  
  // アウト確率補正を適用
  actualCatchChance += outProbabilityModifier;

  const roll = Math.random() * 100;

  // 確実安打ボーナスがある場合（シフト逆方向の極端シフト）
  if (guaranteedHitBonus > 0 && Math.random() * 100 < guaranteedHitBonus) {
    return { outcome: 'single' };
  }

  // 捕球失敗（打球が抜ける）
  const infieldHitChance = 100 - actualCatchChance + infieldHitRateModifier;
  if (roll > actualCatchChance || Math.random() * 100 < Math.max(0, infieldHitRateModifier)) {
    // 強い打球は長打になる可能性
    if (strength === 'very_strong') {
      return { outcome: Math.random() > 0.7 ? 'double' : 'single' };
    }
    return { outcome: 'single' };
  }

  // 捕球成功 - エラー判定
  const errorChance = (100 - errorResistance) * 0.15; // エラー率は低めに設定
  if (Math.random() * 100 < errorChance) {
    return { outcome: 'error', errorType: 'fielding' };
  }

  // アウトにできるか判定
  // 併殺の可能性がある場合（走者一塁、アウト0-1個）
  if (runners.first && outs < 2 && fielderInfo.assistBy) {
    const dpChance = calculateDoublePlayChance(fielder, fielderInfo.assistBy, strength);
    if (Math.random() * 100 < dpChance) {
      return { outcome: 'double_play' };
    }
  }

  return { outcome: 'out' };
}

/**
 * 4.2.2 フライの守備処理
 * 
 * 内野/外野フライの分岐と結果処理
 */
function processFlyBall(
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame },
  runners: RunnerState,
  outs: number,
  shift: DefensiveShift,
  defendingTeam?: PlayerInGame[]
): { outcome: DefensiveOutcome; errorType?: ErrorType } {
  const { strength, extraBasePotential, direction } = batBallInfo;
  const fielder = fielderInfo.primary;
  const isInfield = ['1B', '2B', '3B', 'SS', 'P'].includes(fielderInfo.position);

  // 本塁打判定（外野フライで非常に強い打球）
  if (!isInfield && strength === 'very_strong' && extraBasePotential > 80) {
    return { outcome: 'home_run' };
  }

  // 三塁打判定（外野深くへの強い打球）
  if (!isInfield && strength === 'very_strong' && extraBasePotential > 65) {
    return { outcome: 'triple' };
  }

  // 二塁打判定（外野への強い打球）
  if (!isInfield && (strength === 'strong' || strength === 'very_strong') && extraBasePotential > 45) {
    return { outcome: 'double' };
  }

  // 捕球判定
  const fieldingRange = isInfield ? fielder.fielding.infieldRange : fielder.fielding.outfieldRange;
  const errorResistance = isInfield ? fielder.fielding.infieldError : fielder.fielding.outfieldError;

  // シフト効果を計算（タスク15: Requirement 11）
  let shiftBonus = 0;
  let rangeModifier = 0;
  let catchDifficultyModifier = 0;
  let extraBaseModifier = 0;

  if (defendingTeam) {
    const avgDefensiveRange = calculateAverageDefensiveAbility(defendingTeam, !isInfield);
    const ballDirection = determineBallDirection('right', direction);
    
    const shiftEffect = calculateFlyBallShiftEffect(
      shift,
      'fly',
      isInfield,
      avgDefensiveRange,
      ballDirection
    );
    
    rangeModifier = shiftEffect.rangeModifier;
    catchDifficultyModifier = shiftEffect.catchDifficultyModifier;
    extraBaseModifier = shiftEffect.extraBaseModifier;
  } else {
    // 従来のシンプルなシフトボーナス
    if (shift === 'infield_in' && strength === 'weak') {
      shiftBonus = 20;
    } else if (shift === 'infield_back' && strength === 'strong') {
      shiftBonus = 10;
    }
  }

  // 打球の強さによる捕球難易度
  const catchDifficulty: Record<BatStrength, number> = {
    'weak': 95,
    'medium': 85,
    'strong': 70,
    'very_strong': 50
  };

  const baseCatchChance = catchDifficulty[strength];
  let actualCatchChance = Math.min(99, (baseCatchChance * (fieldingRange + shiftBonus + rangeModifier)) / 100);
  actualCatchChance += catchDifficultyModifier;

  const roll = Math.random() * 100;

  // 捕球失敗（打球が落ちる）
  if (roll > actualCatchChance) {
    // 外野への打球は長打になりやすい
    if (!isInfield) {
      // 長打率補正を適用
      const extraBaseRoll = Math.random() * 100 + extraBaseModifier;
      if (strength === 'very_strong' || extraBaseRoll > 70) {
        return { outcome: 'triple' };
      } else if (strength === 'strong' || extraBaseRoll > 40) {
        return { outcome: 'double' };
      }
    }
    return { outcome: 'single' };
  }

  // 捕球成功 - エラー判定（落球）
  const errorChance = (100 - errorResistance) * 0.08; // フライのエラーは少なめ
  if (Math.random() * 100 < errorChance) {
    return { outcome: 'error', errorType: 'dropped_fly' };
  }

  // タッチアップの可能性（走者三塁、アウト0-1個）
  if (runners.third && outs < 2 && !isInfield) {
    // タッチアップは別途処理（4.3で実装）
    return { outcome: 'sac_fly' };
  }

  return { outcome: 'out' };
}

/**
 * 4.2.3 ライナーの守備処理
 * 
 * ライナー特性の補正を適用
 */
function processLineDrive(
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame },
  runners: RunnerState,
  outs: number,
  shift: DefensiveShift = 'normal',
  defendingTeam?: PlayerInGame[]
): { outcome: DefensiveOutcome; errorType?: ErrorType } {
  const { strength, extraBasePotential, direction } = batBallInfo;
  const fielder = fielderInfo.primary;
  const isInfield = ['1B', '2B', '3B', 'SS', 'P'].includes(fielderInfo.position);

  // ライナーは捕球が難しいが、捕れればアウト
  // 捕れなければ長打になりやすい
  const fieldingRange = isInfield ? fielder.fielding.infieldRange : fielder.fielding.outfieldRange;
  const errorResistance = isInfield ? fielder.fielding.infieldError : fielder.fielding.outfieldError;

  // シフト効果を計算（タスク15: Requirement 11）
  let catchDifficultyModifier = 0;
  let extraBaseModifier = 0;

  if (defendingTeam) {
    const avgDefensiveRange = calculateAverageDefensiveAbility(defendingTeam, !isInfield);
    const ballDirection = determineBallDirection('right', direction);
    
    const shiftEffect = calculateFlyBallShiftEffect(
      shift,
      'liner',
      isInfield,
      avgDefensiveRange,
      ballDirection
    );
    
    catchDifficultyModifier = shiftEffect.catchDifficultyModifier;
    extraBaseModifier = shiftEffect.extraBaseModifier;
  }

  // ライナーの捕球難易度（通常より低い）
  const catchDifficulty: Record<BatStrength, number> = {
    'weak': 75,
    'medium': 60,
    'strong': 45,
    'very_strong': 30
  };

  const baseCatchChance = catchDifficulty[strength];
  let actualCatchChance = (baseCatchChance * fieldingRange) / 100;
  actualCatchChance += catchDifficultyModifier;

  const roll = Math.random() * 100;

  // 捕球失敗（打球が抜ける）
  if (roll > actualCatchChance) {
    // ライナーは抜けると長打になりやすい
    const extraBaseRoll = Math.random() * 100 + extraBaseModifier;
    
    if (!isInfield) {
      // 外野ライナー
      if (strength === 'very_strong' && extraBasePotential > 70) {
        return { outcome: 'triple' };
      } else if ((strength === 'strong' || strength === 'very_strong') && extraBasePotential > 50) {
        return { outcome: 'double' };
      }
    } else {
      // 内野ライナー - 抜ければ単打か二塁打
      if (strength === 'very_strong' && extraBaseRoll > 70) {
        return { outcome: 'double' };
      }
    }
    return { outcome: 'single' };
  }

  // 捕球成功 - エラー判定は極めて低い（ライナーは捕れれば確実）
  const errorChance = (100 - errorResistance) * 0.02;
  if (Math.random() * 100 < errorChance) {
    return { outcome: 'error', errorType: 'fielding' };
  }

  // ライナー捕球後の併殺の可能性（走者が帰塁できない場合）
  // これは別途実装（4.3）

  return { outcome: 'out' };
}

/**
 * 併殺の成功確率を計算
 */
function calculateDoublePlayChance(
  fielder: PlayerInGame,
  assistFielder: PlayerInGame,
  batStrength: BatStrength
): number {
  // 併殺処理能力
  const fielderDpAbility = fielder.fielding.turnDP;
  const assistDpAbility = assistFielder.fielding.turnDP;
  const avgDpAbility = (fielderDpAbility + assistDpAbility) / 2;

  // 打球の強さで補正（弱い打球ほど併殺しやすい）
  const strengthModifier: Record<BatStrength, number> = {
    'weak': 1.5,
    'medium': 1.0,
    'strong': 0.6,
    'very_strong': 0.3
  };

  const baseChance = 35; // 基本確率35%
  const abilityBonus = (avgDpAbility - 50) * 0.3;
  const finalChance = baseChance + abilityBonus;

  return Math.min(70, Math.max(10, finalChance * strengthModifier[batStrength]));
}

/**
 * 簡易ヒット結果を生成（守備選手が見つからない場合のフォールバック）
 */
function createSimpleHitResult(
  batBallInfo: BatBallInfo,
  batter: PlayerInGame,
  runners: RunnerState,
  outs: number
): DefensiveResult {
  // 打球の強さと長打可能性で判定
  let outcome: DefensiveOutcome = 'single';
  
  if (batBallInfo.extraBasePotential > 70 && batBallInfo.strength !== 'weak') {
    outcome = 'triple';
  } else if (batBallInfo.extraBasePotential > 50) {
    outcome = 'double';
  }

  return createDefensiveResult(outcome, batBallInfo, null, runners, outs, batter);
}

/**
 * 守備結果オブジェクトを生成
 * 
 * 4.3: 併殺/タッチアップ/送球選択の処理
 * 4.4: 守備エラー詳細と実況
 */
function createDefensiveResult(
  outcome: DefensiveOutcome,
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame } | null,
  runners: RunnerState,
  outs: number,
  batter: PlayerInGame,
  errorType?: ErrorType
): DefensiveResult {
  let description = '';
  let runsScored = 0;
  let outsRecorded = 0;
  const runnersAdvanced: DefensiveResult['runnersAdvanced'] = [];

  const fielderName = fielderInfo?.primary.name || '守備';
  const positionLabel = fielderInfo?.position ? `(${fielderInfo.position})` : '';

  switch (outcome) {
    case 'home_run':
      // タスク6.1: 本塁打時の基本進塁ルール
      {
        const homeRunResult = determineBasicAdvancement('home_run', runners, batter);
        runnersAdvanced.push(...homeRunResult.advancements);
        runsScored = homeRunResult.runsScored;
        description = homeRunResult.commentary;
      }
      break;

    case 'triple':
      // タスク6.1: 三塁打の基本進塁ルール
      {
        const tripleResult = determineBasicAdvancement('triple', runners, batter);
        runnersAdvanced.push(...tripleResult.advancements);
        runsScored = tripleResult.runsScored;
        description = tripleResult.commentary;
      }
      break;

    case 'double':
      // タスク6.3: 二塁打時の本塁到達と中継送球を使用
      if (fielderInfo) {
        const doubleResult = evaluateDoubleAdvancement(
          runners,
          batter,
          batBallInfo,
          {
            fielder: fielderInfo.primary,
            position: fielderInfo.position,
            relayFielder: fielderInfo.assistBy
          }
        );
        
        runnersAdvanced.push(...doubleResult.advancements);
        runsScored = doubleResult.runsScored;
        outsRecorded = doubleResult.outsRecorded;
        description = doubleResult.commentary;
      } else {
        // フォールバック: 基本進塁ルール
        const basicResult = determineBasicAdvancement('double', runners, batter);
        runnersAdvanced.push(...basicResult.advancements);
        runsScored = basicResult.runsScored;
        description = basicResult.commentary;
      }
      break;

    case 'single':
      // タスク6.2: 単打時の本塁到達と追加進塁を使用
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
      } else {
        // フォールバック: 基本進塁ルール
        const basicResult = determineBasicAdvancement('single', runners, batter);
        runnersAdvanced.push(...basicResult.advancements);
        runsScored = basicResult.runsScored;
        description = basicResult.commentary;
      }
      break;

    case 'out':
      description = `${fielderName}${positionLabel}がアウトにしました。`;
      runnersAdvanced.push({ from: 'batter', to: 'out' });
      outsRecorded = 1;
      
      // 走者は進塁しない（タッチアップを除く）
      break;

    case 'double_play':
      if (fielderInfo?.assistBy) {
        description = `${fielderName}${positionLabel}から${fielderInfo.assistBy.name}へ！併殺！`;
      } else {
        description = `${fielderName}${positionLabel}が併殺打！`;
      }
      
      // 打者アウト
      runnersAdvanced.push({ from: 'batter', to: 'out' });
      outsRecorded = 2;
      
      // 一塁走者もアウト
      if (runners.first) {
        runnersAdvanced.push({ from: 'first', to: 'out' });
      }
      
      // 他の走者は進塁
      if (runners.second) {
        runnersAdvanced.push({ from: 'second', to: 'third' });
      }
      if (runners.third && outs === 0) {
        // ツーアウトでなければ得点
        runnersAdvanced.push({ from: 'third', to: 'home' });
        runsScored++;
      }
      break;

    case 'sac_fly':
      // 4.3: タッチアップ判定
      description = `${fielderName}${positionLabel}がキャッチ。犠牲フライ！`;
      runnersAdvanced.push({ from: 'batter', to: 'out' });
      outsRecorded = 1;
      
      // 三塁走者がタッチアップ
      if (runners.third) {
        const tagUpSuccess = evaluateTagUp(
          runners.third,
          fielderInfo,
          batBallInfo
        );
        
        if (tagUpSuccess) {
          runnersAdvanced.push({ from: 'third', to: 'home', isTagUp: true });
          runsScored++;
        }
      }
      
      // 他の走者は基本進塁しない（一部例外あり）
      break;

    case 'error':
      // 4.4: 守備エラー詳細と実況
      const errorDescription = getErrorDescription(errorType, fielderName, positionLabel);
      description = errorDescription;
      
      // エラー時の進塁（種類によって異なる）
      const errorAdvancement = getErrorAdvancement(errorType, runners);
      runnersAdvanced.push(...errorAdvancement);
      
      // エラーによる得点
      runsScored = errorAdvancement.filter(adv => adv.to === 'home').length;
      break;

    case 'fielders_choice':
      description = `野手選択で${batter.name}は出塁。`;
      runnersAdvanced.push({ from: 'batter', to: 'first' });
      
      // 前の走者をアウトにする判定（簡易実装）
      if (runners.first) {
        runnersAdvanced.push({ from: 'first', to: 'out' });
        outsRecorded = 1;
      }
      break;

    default:
      description = `${batter.name}の打球`;
      break;
  }

  return {
    outcome,
    fielder: fielderInfo?.primary,
    fielderPosition: fielderInfo?.position,
    assistBy: fielderInfo?.assistBy,
    errorType,
    description,
    runnersAdvanced,
    runsScored,
    outsRecorded
  };
}

/**
 * 4.3.1 走者の進塁可能性を評価
 * 
 * 外野手の肩力と走者の走力を比較
 */
function evaluateRunnerAdvancement(
  runner: Runner,
  fromBase: 'first' | 'second' | 'third',
  toBase: 'second' | 'third' | 'home',
  batBallInfo: BatBallInfo,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame } | null
): boolean {
  if (!fielderInfo) return true; // 守備選手がいない場合は進塁可能

  const fielder = fielderInfo.primary;
  const isOutfielder = ['LF', 'CF', 'RF'].includes(fielderInfo.position);

  // 内野手の場合は進塁しにくい
  if (!isOutfielder) {
    return false;
  }

  // 外野手の肩力
  const throwingArm = fielder.fielding.outfieldArm;

  // 打球の強さ（弱い打球は守備が早く処理できる）
  const strengthPenalty: Record<BatStrength, number> = {
    'weak': -20,
    'medium': -10,
    'strong': 0,
    'very_strong': 10
  };

  // 進塁の難易度（本塁へは難しい）
  const advancementDifficulty: Record<typeof toBase, number> = {
    'second': 70,
    'third': 50,
    'home': 30
  };

  const baseChance = advancementDifficulty[toBase];
  const armPenalty = (throwingArm - 50) * -0.5; // 肩が強いほどペナルティ
  const finalChance = baseChance + armPenalty + strengthPenalty[batBallInfo.strength];

  return Math.random() * 100 < finalChance;
}

/**
 * 4.3.2 タッチアップの成功判定
 * 
 * 走者の走力と外野手の肩力で評価
 */
function evaluateTagUp(
  runner: Runner,
  fielderInfo: { primary: PlayerInGame; position: Position; assistBy?: PlayerInGame } | null,
  batBallInfo: BatBallInfo
): boolean {
  if (!fielderInfo) return true;

  const fielder = fielderInfo.primary;
  const throwingArm = fielder.fielding.outfieldArm;

  // フライの深さ（打球の強さで判定）
  const depthBonus: Record<BatStrength, number> = {
    'weak': -30, // 浅いフライはタッチアップしにくい
    'medium': 0,
    'strong': 15,
    'very_strong': 25
  };

  const baseChance = 60; // 基本成功率
  const armPenalty = (throwingArm - 50) * -0.6;
  const finalChance = baseChance + armPenalty + depthBonus[batBallInfo.strength];

  return Math.random() * 100 < Math.max(20, Math.min(95, finalChance));
}

/**
 * 4.4.1 エラー種別に応じた実況文を生成
 */
function getErrorDescription(
  errorType: ErrorType | undefined,
  fielderName: string,
  positionLabel: string
): string {
  switch (errorType) {
    case 'fielding':
      return `${fielderName}${positionLabel}の捕球エラー！`;
    case 'throwing':
      return `${fielderName}${positionLabel}の送球エラー！`;
    case 'dropped_fly':
      return `${fielderName}${positionLabel}がフライを落球！`;
    default:
      return `${fielderName}${positionLabel}のエラー！`;
  }
}

/**
 * 4.4.2 エラー種別に応じた走者進塁を決定
 */
function getErrorAdvancement(
  errorType: ErrorType | undefined,
  runners: RunnerState
): DefensiveResult['runnersAdvanced'] {
  const advancements: DefensiveResult['runnersAdvanced'] = [];

  switch (errorType) {
    case 'fielding':
    case 'dropped_fly':
      // 捕球エラー・落球：打者は出塁、走者は1つ進塁
      advancements.push({ from: 'batter', to: 'first' });
      
      if (runners.first) {
        advancements.push({ from: 'first', to: 'second' });
      }
      if (runners.second) {
        advancements.push({ from: 'second', to: 'third' });
      }
      if (runners.third) {
        advancements.push({ from: 'third', to: 'home' });
      }
      break;

    case 'throwing':
      // 送球エラー：走者は大きく進塁する可能性
      advancements.push({ from: 'batter', to: 'second' }); // 打者は二塁へ
      
      if (runners.first) {
        advancements.push({ from: 'first', to: 'third' });
      }
      if (runners.second) {
        advancements.push({ from: 'second', to: 'home' });
      }
      if (runners.third) {
        advancements.push({ from: 'third', to: 'home' });
      }
      break;

    default:
      // デフォルト：打者出塁、走者は1つ進塁
      advancements.push({ from: 'batter', to: 'first' });
      
      if (runners.first) {
        advancements.push({ from: 'first', to: 'second' });
      }
      if (runners.second) {
        advancements.push({ from: 'second', to: 'third' });
      }
      if (runners.third) {
        advancements.push({ from: 'third', to: 'home' });
      }
      break;
  }

  return advancements;
}
