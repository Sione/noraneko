import { 
  PlayerInGame, 
  Hand, 
  Position,
  RunnerState,
  Runner
} from '../types';
import { BatDirection } from './atBatEngine';

/**
 * バント/スクイズ判定エンジン
 * タスク5: バント/スクイズ判定
 */

// バントの種類
export type BuntType = 
  | 'sacrifice'     // 犠打バント
  | 'safety';       // セーフティバント

// バント打球の方向
export type BuntDirection = 
  | 'third_base_line'   // 三塁線沿い
  | 'pitcher_front'     // 投手正面
  | 'first_base_line';  // 一塁線沿い

// バント打球の強さ
export type BuntStrength = 
  | 'very_weak'     // 非常に弱い（捕手が処理可能）
  | 'weak'          // 弱い
  | 'medium';       // 普通

// バント打球情報
export interface BuntBallInfo {
  direction: BuntDirection;
  strength: BuntStrength;
  buntType: BuntType;
}

// バント判定結果
export interface BuntJudgementResult {
  success: boolean;
  buntBallInfo?: BuntBallInfo;
  description: string;
  isFoul?: boolean;
  isStrikeout?: boolean;
  isPopup?: boolean;
}

// スクイズ判定結果
export interface SqueezeJudgementResult extends BuntJudgementResult {
  runnerSafe: boolean;  // 三塁走者が本塁でセーフかどうか
}

/**
 * 5.1 バント打球の方向と処理
 * バント種類ごとの成功率を計算し、打球方向と担当守備選手を決定
 */
export function judgeBunt(
  batter: PlayerInGame,
  pitcher: PlayerInGame,
  buntType: BuntType,
  runners: RunnerState,
  balls: number = 0,
  strikes: number = 0
): BuntJudgementResult {
  // バント能力を取得
  const buntAbility = buntType === 'sacrifice' 
    ? batter.fielding.sacrificeBunt 
    : batter.fielding.buntForHit;

  // 投手の能力（制球力と球威）
  const pitcherAbility = ((pitcher.pitching?.control || 50) + (pitcher.pitching?.stuff || 50)) / 2;

  // 2ストライク時の成功率低下
  const strikesPenalty = strikes === 2 ? -20 : 0;

  // 基本成功率の計算
  const baseSuccessRate = calculateBuntSuccessRate(buntAbility, pitcherAbility) + strikesPenalty;

  // バント失敗判定
  const roll = Math.random() * 100;
  
  if (roll > baseSuccessRate) {
    return handleBuntFailure(batter, buntType, strikes);
  }

  // バント成功 - 打球方向を決定
  const direction = determineBuntDirection(batter.batterHand, buntType, batter.fielding.buntForHit);
  
  // 打球の強さを決定
  const strength = determineBuntStrength(buntAbility);

  const buntBallInfo: BuntBallInfo = {
    direction,
    strength,
    buntType
  };

  return {
    success: true,
    buntBallInfo,
    description: `${batter.name}がバント！`
  };
}

/**
 * 5.3 スクイズの判定
 * 打者/走者能力で成功率を計算し、本塁送球の可否と結果を評価
 */
export function judgeSqueeze(
  batter: PlayerInGame,
  pitcher: PlayerInGame,
  thirdRunner: Runner,
  runnerPlayer: PlayerInGame,
  balls: number = 0,
  strikes: number = 0
): SqueezeJudgementResult {
  // まずバント判定を実行
  const buntResult = judgeBunt(batter, pitcher, 'sacrifice', { first: null, second: null, third: thirdRunner }, balls, strikes);

  // バント失敗時
  if (!buntResult.success || !buntResult.buntBallInfo) {
    return {
      ...buntResult,
      runnerSafe: false
    };
  }

  // バント成功時 - 走者の本塁到達判定
  const runnerSpeed = runnerPlayer.running.speed;
  const runnerBaserunning = runnerPlayer.running.baserunning;

  // スクイズ成功率の計算（走者の走力と走塁技術）
  const squeezeSuccessRate = calculateSqueezeSuccessRate(
    runnerSpeed,
    runnerBaserunning,
    buntResult.buntBallInfo.strength
  );

  const runnerSafe = Math.random() * 100 < squeezeSuccessRate;

  return {
    ...buntResult,
    runnerSafe,
    description: runnerSafe 
      ? `${batter.name}がスクイズ成功！${runnerPlayer.name}が生還しました！`
      : `${batter.name}がバント。しかし${runnerPlayer.name}は本塁でアウトになりました。`
  };
}

/**
 * バント成功率の計算
 */
function calculateBuntSuccessRate(buntAbility: number, pitcherAbility: number): number {
  // 基本成功率: 70%
  const baseRate = 70;
  
  // バント能力による補正
  const abilityBonus = (buntAbility - 50) * 0.4; // より大きな影響
  
  // 投手能力による補正（投手が優秀だとバントしにくい）
  const pitcherPenalty = (pitcherAbility - 50) * -0.2;

  const finalRate = baseRate + abilityBonus + pitcherPenalty;

  return Math.min(95, Math.max(30, finalRate));
}

/**
 * 5.1 バント打球の方向決定
 * 打者の利き手とバント能力に応じて打球方向を決定
 */
function determineBuntDirection(
  batterHand: Hand,
  buntType: BuntType,
  buntForHitAbility: number
): BuntDirection {
  const roll = Math.random() * 100;

  // セーフティバントの場合、buntForHit能力に応じて逆方向の確率が上昇
  const safetyBuntModifier = buntType === 'safety' 
    ? (buntForHitAbility - 50) * 0.2 
    : 0;

  if (batterHand === 'left') {
    // 左打者: 一塁線沿いが多い（一塁に近いため）
    const firstBaseLine = 50 + safetyBuntModifier; // セーフティ時は三塁線方向へ
    const pitcherFront = 30;
    const thirdBaseLine = 20 + safetyBuntModifier;

    if (roll < firstBaseLine) {
      return 'first_base_line';
    } else if (roll < firstBaseLine + pitcherFront) {
      return 'pitcher_front';
    } else {
      return 'third_base_line';
    }
  } else if (batterHand === 'right') {
    // 右打者: 三塁線沿いが多い
    const thirdBaseLine = 40;
    const pitcherFront = 35;
    const firstBaseLine = 25 + safetyBuntModifier; // セーフティ時は一塁線方向へ

    if (roll < thirdBaseLine) {
      return 'third_base_line';
    } else if (roll < thirdBaseLine + pitcherFront) {
      return 'pitcher_front';
    } else {
      return 'first_base_line';
    }
  } else {
    // スイッチヒッター（均等分布）
    if (roll < 33) return 'third_base_line';
    if (roll < 66) return 'pitcher_front';
    return 'first_base_line';
  }
}

/**
 * バント打球の強さを決定
 */
function determineBuntStrength(buntAbility: number): BuntStrength {
  const roll = Math.random() * 100;

  // バント能力が高いほど適度な強さのバントができる
  const mediumThreshold = buntAbility * 0.5; // 能力50で25%
  const weakThreshold = mediumThreshold + 60;

  if (roll < mediumThreshold) {
    return 'medium';
  } else if (roll < weakThreshold) {
    return 'weak';
  } else {
    return 'very_weak';
  }
}

/**
 * 5.4 バント失敗の処理
 * バント失敗の結果種類を決定し、2ストライク時の三振処理を適用
 */
function handleBuntFailure(
  batter: PlayerInGame,
  buntType: BuntType,
  strikes: number
): BuntJudgementResult {
  const roll = Math.random() * 100;

  // 2ストライク時のファウル → 三振
  if (strikes === 2) {
    if (roll < 60) {
      return {
        success: false,
        description: `${batter.name}のバントはファウル。三振アウト！`,
        isFoul: true,
        isStrikeout: true
      };
    }
  }

  // 失敗の種類を決定
  if (roll < 50) {
    // ファウル
    return {
      success: false,
      description: `${batter.name}のバントはファウル。`,
      isFoul: true
    };
  } else if (roll < 75) {
    // 空振り
    return {
      success: false,
      description: `${batter.name}のバントは空振り。`,
      isFoul: false
    };
  } else {
    // 打ち損じ（凡フライ）
    return {
      success: false,
      description: `${batter.name}のバントは打ち損じて小フライ！`,
      isFoul: false,
      isPopup: true
    };
  }
}

/**
 * スクイズ成功率の計算
 * 三塁走者のSpeed値とBaserunning値を基準に成功率を計算
 */
function calculateSqueezeSuccessRate(
  runnerSpeed: number,
  runnerBaserunning: number,
  buntStrength: BuntStrength
): number {
  // 基本成功率: 60%
  const baseRate = 60;

  // 走者の走力による補正
  const speedBonus = (runnerSpeed - 60) * 0.35;

  // 走塁技術による補正
  const baserunningBonus = (runnerBaserunning - 50) * 0.25;

  // バント打球の強さによる補正
  const strengthBonus: Record<BuntStrength, number> = {
    'very_weak': -20,  // 弱すぎると守備が早く処理できる
    'weak': 0,
    'medium': 10       // 適度な強さが最適
  };

  const finalRate = baseRate + speedBonus + baserunningBonus + strengthBonus[buntStrength];

  return Math.min(95, Math.max(20, finalRate));
}

/**
 * 5.1 バント打球に対する守備処理
 * バント打球の方向と強さから担当守備選手を特定
 */
export function determineBuntFielder(
  buntBallInfo: BuntBallInfo
): { primaryPosition: Position; assistPosition?: Position } {
  const { direction, strength } = buntBallInfo;

  switch (direction) {
    case 'third_base_line':
      // 三塁線沿い: 三塁手が主担当、投手が補助
      return {
        primaryPosition: '3B',
        assistPosition: 'P'
      };

    case 'pitcher_front':
      // 投手正面: 投手が主担当、捕手が補助
      if (strength === 'very_weak') {
        // 非常に弱い打球は捕手が処理可能
        return {
          primaryPosition: 'C',
          assistPosition: 'P'
        };
      }
      return {
        primaryPosition: 'P',
        assistPosition: 'C'
      };

    case 'first_base_line':
      // 一塁線沿い: 一塁手が主担当、投手が補助
      return {
        primaryPosition: '1B',
        assistPosition: 'P'
      };
  }
}

/**
 * 5.2 犠打バントの守備判定と進塁処理
 * 守備選手の能力で捕球/送球判定を行い、走者の進塁を決定
 */
export interface BuntDefensiveResult {
  batterOut: boolean;
  batterReachedBase: boolean;
  runnersAdvanced: {
    from: 'first' | 'second' | 'third' | 'batter';
    to: 'first' | 'second' | 'third' | 'home' | 'out';
  }[];
  targetRunner?: 'batter' | 'first' | 'second' | 'third';
  description: string;
}

export function processBuntDefensive(
  buntBallInfo: BuntBallInfo,
  batter: PlayerInGame,
  fielder: PlayerInGame,
  assistFielder: PlayerInGame | undefined,
  runners: RunnerState,
  outs: number
): BuntDefensiveResult {
  const { strength, buntType } = buntBallInfo;

  // 守備選手の守備範囲
  const fieldingRange = fielder.fielding.infieldRange;

  // 打球への到達判定
  const catchDifficulty: Record<BuntStrength, number> = {
    'very_weak': 95,
    'weak': 80,
    'medium': 60
  };

  const canCatch = Math.random() * 100 < (catchDifficulty[strength] * fieldingRange / 100);

  // 到達できない場合はセーフティバント成功
  if (!canCatch) {
    return handleBuntNoFielding(batter, runners);
  }

  // 5.2 犠打バントと進塁判定
  // 守備選手が捕球した場合、どこへ送球するかを判断
  const throwTarget = determineThrowTarget(runners, outs, buntType, batter.running.speed);

  if (throwTarget === 'first') {
    // 一塁送球 - 打者アウトを狙う
    const throwSuccess = evaluateThrowToFirst(
      fielder,
      batter.running.speed,
      batter.batterHand,
      strength
    );

    if (throwSuccess) {
      // 打者アウト、走者は進塁
      return {
        batterOut: true,
        batterReachedBase: false,
        runnersAdvanced: [
          { from: 'batter', to: 'out' },
          ...advanceAllRunners(runners)
        ],
        targetRunner: 'batter',
        description: `${fielder.name}(${fielder.position})が捕球して一塁送球。打者アウト！`
      };
    } else {
      // 送球が間に合わず、打者セーフ
      return {
        batterOut: false,
        batterReachedBase: true,
        runnersAdvanced: [
          { from: 'batter', to: 'first' },
          ...advanceAllRunners(runners)
        ],
        description: `${fielder.name}(${fielder.position})の送球が間に合わず、打者セーフ！`
      };
    }
  } else if (throwTarget === 'lead_runner') {
    // 進塁ランナーをアウトにする
    const leadRunner = getLeadRunner(runners);
    if (leadRunner) {
      const throwSuccess = Math.random() * 100 < 70; // 進塁ランナーへの送球成功率

      if (throwSuccess) {
        return {
          batterOut: false,
          batterReachedBase: true,
          runnersAdvanced: [
            { from: 'batter', to: 'first' },
            { from: leadRunner.from, to: 'out' }
          ],
          targetRunner: leadRunner.from,
          description: `${fielder.name}(${fielder.position})が${leadRunner.targetBase}へ送球！走者アウト！`
        };
      }
    }

    // 送球失敗時はセーフティバント成功扱い
    return handleBuntNoFielding(batter, runners);
  }

  // デフォルト: 犠打成功（打者アウト、走者進塁）
  return {
    batterOut: true,
    batterReachedBase: false,
    runnersAdvanced: [
      { from: 'batter', to: 'out' },
      ...advanceAllRunners(runners)
    ],
    description: `${fielder.name}(${fielder.position})が処理。犠打成功！`
  };
}

/**
 * 守備選手が送球先を判断
 * 試合状況（走者、アウトカウント）に応じて送球先を決定
 */
function determineThrowTarget(
  runners: RunnerState,
  outs: number,
  buntType: BuntType,
  batterSpeed: number
): 'first' | 'lead_runner' {
  // セーフティバントの場合は一塁優先
  if (buntType === 'safety') {
    return 'first';
  }

  // ツーアウトは必ず一塁
  if (outs === 2) {
    return 'first';
  }

  // 走者がいない場合は一塁
  if (!runners.first && !runners.second && !runners.third) {
    return 'first';
  }

  // 打者の走力が高い場合は進塁ランナーを狙う確率が上がる
  if (batterSpeed > 70 && Math.random() > 0.6) {
    return 'lead_runner';
  }

  // 基本的には一塁を狙う（犠打の場合）
  if (Math.random() > 0.7) {
    return 'lead_runner';
  }

  return 'first';
}

/**
 * 一塁送球の成否判定
 * 守備選手の送球能力、打者の走力、左打者補正を考慮
 */
function evaluateThrowToFirst(
  fielder: PlayerInGame,
  batterSpeed: number,
  batterHand: Hand,
  buntStrength: BuntStrength
): boolean {
  // 守備選手の肩力
  const throwingArm = fielder.fielding.infieldArm;

  // 基本アウト確率: 75%
  let outChance = 75;

  // 打者の走力による補正
  const speedPenalty = (batterSpeed - 60) * 0.3;
  outChance -= speedPenalty;

  // 左打者補正（一塁に近い）
  if (batterHand === 'left') {
    outChance -= 10; // AC 54に基づく+10%のセーフ確率
  }

  // バント打球の強さによる補正
  const strengthModifier: Record<BuntStrength, number> = {
    'very_weak': 15,   // 弱い打球は守備が早く処理できる
    'weak': 5,
    'medium': -10      // 適度な強さは打者に有利
  };
  outChance += strengthModifier[buntStrength];

  // 守備選手の肩力による補正
  const armBonus = (throwingArm - 50) * 0.2;
  outChance += armBonus;

  return Math.random() * 100 < Math.max(30, Math.min(95, outChance));
}

/**
 * 全走者を1塁分進塁
 */
function advanceAllRunners(runners: RunnerState): BuntDefensiveResult['runnersAdvanced'] {
  const advancements: BuntDefensiveResult['runnersAdvanced'] = [];

  if (runners.third) {
    advancements.push({ from: 'third', to: 'home' });
  }
  if (runners.second) {
    advancements.push({ from: 'second', to: 'third' });
  }
  if (runners.first) {
    advancements.push({ from: 'first', to: 'second' });
  }

  return advancements;
}

/**
 * 先頭走者を取得
 */
function getLeadRunner(runners: RunnerState): { from: 'first' | 'second' | 'third'; targetBase: string } | null {
  if (runners.third) {
    return { from: 'third', targetBase: '本塁' };
  }
  if (runners.second) {
    return { from: 'second', targetBase: '三塁' };
  }
  if (runners.first) {
    return { from: 'first', targetBase: '二塁' };
  }
  return null;
}

/**
 * 守備が打球に到達できなかった場合の処理
 */
function handleBuntNoFielding(
  batter: PlayerInGame,
  runners: RunnerState
): BuntDefensiveResult {
  return {
    batterOut: false,
    batterReachedBase: true,
    runnersAdvanced: [
      { from: 'batter', to: 'first' },
      ...advanceAllRunners(runners)
    ],
    description: `打球は守備の間を抜けて、${batter.name}は出塁！`
  };
}
