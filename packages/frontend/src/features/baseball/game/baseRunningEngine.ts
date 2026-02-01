import { 
  PlayerInGame, 
  Position,
  RunnerState,
  Runner
} from '../types';
import { BatBallInfo, BatDirection, BatStrength } from './atBatEngine';

/**
 * 走塁判定エンジン
 * タスク6: 走塁と進塁判定
 * 
 * 6.1 基本進塁ルール
 * 6.2 単打時の本塁到達と追加進塁
 * 6.3 二塁打時の本塁到達と中継送球
 * 6.4 得点と実況表示
 */

// 進塁結果
export interface BaseRunningAdvancement {
  from: 'first' | 'second' | 'third' | 'batter';
  to: 'first' | 'second' | 'third' | 'home' | 'out';
  isTagUp?: boolean;
  isExtraBase?: boolean; // 追加進塁かどうか
  wasThrown?: boolean; // 送球があったかどうか
  description?: string; // 進塁の詳細説明
}

// 走塁判定結果
export interface BaseRunningResult {
  advancements: BaseRunningAdvancement[];
  runsScored: number;
  outsRecorded: number;
  commentary: string; // 総合実況
}

// ヒットの種類
export type HitType = 'single' | 'double' | 'triple' | 'home_run';

// 外野手情報
interface OutfielderInfo {
  fielder: PlayerInGame;
  position: Position;
  relayFielder?: PlayerInGame; // 中継選手
}

/**
 * 6.1 基本進塁ルール
 * 
 * 単打/二塁打/三塁打/本塁打の基本進塁を確定
 */
export function determineBasicAdvancement(
  hitType: HitType,
  runners: RunnerState,
  batter: PlayerInGame
): BaseRunningResult {
  const advancements: BaseRunningAdvancement[] = [];
  let runsScored = 0;
  const descriptions: string[] = [];

  switch (hitType) {
    case 'home_run':
      // 6.1: 本塁打時の得点処理
      descriptions.push(`${batter.name}のホームラン！`);
      
      // 打者が本塁へ
      advancements.push({ from: 'batter', to: 'home' });
      runsScored++;
      
      // すべての走者が得点
      if (runners.third) {
        advancements.push({ from: 'third', to: 'home' });
        descriptions.push(`${runners.third.playerName}が生還！`);
        runsScored++;
      }
      if (runners.second) {
        advancements.push({ from: 'second', to: 'home' });
        descriptions.push(`${runners.second.playerName}が生還！`);
        runsScored++;
      }
      if (runners.first) {
        advancements.push({ from: 'first', to: 'home' });
        descriptions.push(`${runners.first.playerName}が生還！`);
        runsScored++;
      }
      
      descriptions.push(`${runsScored}点が入りました！`);
      break;

    case 'triple':
      // 6.1: 三塁打の進塁確定
      descriptions.push(`${batter.name}の三塁打！`);
      
      // 打者は三塁へ
      advancements.push({ from: 'batter', to: 'third' });
      
      // すべての走者が得点
      if (runners.third) {
        advancements.push({ from: 'third', to: 'home' });
        descriptions.push(`${runners.third.playerName}が生還！`);
        runsScored++;
      }
      if (runners.second) {
        advancements.push({ from: 'second', to: 'home' });
        descriptions.push(`${runners.second.playerName}が生還！`);
        runsScored++;
      }
      if (runners.first) {
        advancements.push({ from: 'first', to: 'home' });
        descriptions.push(`${runners.first.playerName}が生還！`);
        runsScored++;
      }
      break;

    case 'double':
      // 6.1: 二塁打の基本進塁（詳細判定は後続処理で）
      descriptions.push(`${batter.name}の二塁打！`);
      
      // 打者は二塁へ
      advancements.push({ from: 'batter', to: 'second' });
      
      // 三塁走者は確実に得点
      if (runners.third) {
        advancements.push({ from: 'third', to: 'home' });
        descriptions.push(`${runners.third.playerName}が生還！`);
        runsScored++;
      }
      
      // 二塁走者も確実に得点
      if (runners.second) {
        advancements.push({ from: 'second', to: 'home' });
        descriptions.push(`${runners.second.playerName}が生還！`);
        runsScored++;
      }
      
      // 一塁走者は三塁へ（本塁到達は別途判定）
      // この関数では基本進塁のみ
      if (runners.first) {
        advancements.push({ from: 'first', to: 'third' });
        descriptions.push(`${runners.first.playerName}は三塁へ`);
      }
      break;

    case 'single':
      // 6.1: 単打の基本進塁（詳細判定は後続処理で）
      descriptions.push(`${batter.name}のヒット！`);
      
      // 打者は一塁へ
      advancements.push({ from: 'batter', to: 'first' });
      
      // 三塁走者は確実に得点
      if (runners.third) {
        advancements.push({ from: 'third', to: 'home' });
        descriptions.push(`${runners.third.playerName}が生還！`);
        runsScored++;
      }
      
      // 二塁走者は三塁へ（本塁到達は別途判定）
      if (runners.second) {
        advancements.push({ from: 'second', to: 'third' });
        descriptions.push(`${runners.second.playerName}は三塁へ`);
      }
      
      // 一塁走者は二塁へ
      if (runners.first) {
        advancements.push({ from: 'first', to: 'second' });
        descriptions.push(`${runners.first.playerName}は二塁へ`);
      }
      break;
  }

  return {
    advancements,
    runsScored,
    outsRecorded: 0,
    commentary: descriptions.join(' ')
  };
}

/**
 * 6.2 単打時の本塁到達と追加進塁
 * 
 * 外野手送球と走者能力で本塁到達を判定
 * 追加進塁の試行条件と成功率を評価
 */
export function evaluateSingleAdvancement(
  runners: RunnerState,
  batter: PlayerInGame,
  batBallInfo: BatBallInfo,
  outfielderInfo: OutfielderInfo
): BaseRunningResult {
  const advancements: BaseRunningAdvancement[] = [];
  let runsScored = 0;
  const descriptions: string[] = [];

  descriptions.push(`${batter.name}のヒット！`);

  // 打者は基本的に一塁へ
  advancements.push({ from: 'batter', to: 'first' });

  // 三塁走者は確実に得点
  if (runners.third) {
    advancements.push({ from: 'third', to: 'home' });
    descriptions.push(`三塁走者${runners.third.playerName}が生還！`);
    runsScored++;
  }

  // 6.2: 二塁走者の本塁到達判定
  if (runners.second) {
    const canScoreFromSecond = evaluateScoreFromSecondOnSingle(
      runners.second,
      batBallInfo,
      outfielderInfo
    );

    if (canScoreFromSecond.success) {
      advancements.push({ 
        from: 'second', 
        to: 'home',
        wasThrown: canScoreFromSecond.wasClose,
        description: canScoreFromSecond.description
      });
      descriptions.push(canScoreFromSecond.description);
      runsScored++;
    } else {
      advancements.push({ from: 'second', to: 'third' });
      descriptions.push(`二塁走者${runners.second.playerName}は三塁止まり`);
    }
  }

  // 6.2: 一塁走者の追加進塁判定（三塁への進塁試行）
  if (runners.first) {
    const extraBaseAttempt = evaluateExtraBaseOnSingle(
      runners.first,
      batBallInfo,
      outfielderInfo,
      !runners.second // 前の走者が本塁へ向かったかどうか
    );

    if (extraBaseAttempt.attempt) {
      if (extraBaseAttempt.success) {
        advancements.push({ 
          from: 'first', 
          to: 'third',
          isExtraBase: true,
          description: extraBaseAttempt.description
        });
        descriptions.push(extraBaseAttempt.description);
      } else {
        // 追加進塁失敗（アウトまたは二塁止まり）
        if (extraBaseAttempt.caughtOut) {
          advancements.push({ 
            from: 'first', 
            to: 'out',
            description: extraBaseAttempt.description
          });
          descriptions.push(extraBaseAttempt.description);
        } else {
          advancements.push({ from: 'first', to: 'second' });
          descriptions.push(`一塁走者${runners.first.playerName}は二塁へ`);
        }
      }
    } else {
      // 追加進塁を試行しない
      advancements.push({ from: 'first', to: 'second' });
      descriptions.push(`一塁走者${runners.first.playerName}は二塁へ`);
    }
  }

  // 6.2: 打者の追加進塁判定（二塁への進塁試行）
  if (!runners.first && batBallInfo.strength === 'very_strong') {
    const batterExtraBase = evaluateBatterExtraBaseOnSingle(
      batter,
      batBallInfo,
      outfielderInfo
    );

    if (batterExtraBase.success) {
      // 打者の一塁への進塁を二塁に変更
      const batterAdvancement = advancements.find(a => a.from === 'batter');
      if (batterAdvancement) {
        batterAdvancement.to = 'second';
        batterAdvancement.isExtraBase = true;
        batterAdvancement.description = batterExtraBase.description;
      }
      descriptions.push(batterExtraBase.description);
    }
  }

  return {
    advancements,
    runsScored,
    outsRecorded: 0,
    commentary: descriptions.join(' ')
  };
}

/**
 * 6.2.1 単打時の二塁走者の本塁到達判定
 * 
 * 外野手送球と走者能力で評価
 */
function evaluateScoreFromSecondOnSingle(
  runner: Runner,
  batBallInfo: BatBallInfo,
  outfielderInfo: OutfielderInfo
): { success: boolean; wasClose: boolean; description: string } {
  const { direction, strength } = batBallInfo;
  const { fielder, position } = outfielderInfo;

  // 外野手の肩力
  const outfieldArm = fielder.fielding.outfieldArm;

  // 打球方向による難易度（センター方向は本塁まで距離が遠い）
  const directionModifier: Record<BatDirection, number> = {
    'left': 10,
    'center_left': 5,
    'center': -10, // センターは最も遠い
    'center_right': 5,
    'right': 10
  };

  // 打球の強さによる難易度（強い打球は外野が深い位置で取るので時間がかかる）
  const strengthModifier: Record<BatStrength, number> = {
    'weak': -30, // 弱い打球は前で取られるので無理
    'medium': 0,
    'strong': 15,
    'very_strong': 25
  };

  // 基本成功率
  let scoreChance = 50;
  scoreChance += directionModifier[direction];
  scoreChance += strengthModifier[strength];
  
  // 外野手の肩力によるペナルティ
  scoreChance -= (outfieldArm - 50) * 0.8;

  // 最終判定
  const roll = Math.random() * 100;
  const success = roll < scoreChance;
  const wasClose = Math.abs(roll - scoreChance) < 20;

  let description = '';
  if (success) {
    if (wasClose) {
      description = `二塁走者${runner.playerName}が猛ダッシュで生還！クロスプレー！`;
    } else {
      description = `二塁走者${runner.playerName}が余裕で生還！`;
    }
  } else {
    description = `二塁走者${runner.playerName}は三塁止まり。外野の好返球！`;
  }

  return { success, wasClose, description };
}

/**
 * 6.2.2 単打時の一塁走者の追加進塁判定（三塁へ）
 * 
 * 追加進塁の試行条件と成功率を評価
 */
function evaluateExtraBaseOnSingle(
  runner: Runner,
  batBallInfo: BatBallInfo,
  outfielderInfo: OutfielderInfo,
  runnerAheadScored: boolean
): { attempt: boolean; success: boolean; caughtOut: boolean; description: string } {
  const { strength, direction } = batBallInfo;
  const { fielder } = outfielderInfo;

  // 追加進塁を試行する条件
  // 1. 打球が強い
  // 2. 前の走者が得点した（混乱を誘える）
  // 3. 外野手の肩が弱い
  const outfieldArm = fielder.fielding.outfieldArm;
  
  let attemptChance = 20; // 基本試行率20%
  
  if (strength === 'very_strong') attemptChance += 40;
  if (strength === 'strong') attemptChance += 20;
  if (runnerAheadScored) attemptChance += 25; // 前の走者が得点した場合
  if (outfieldArm < 60) attemptChance += 15; // 肩が弱い
  
  const willAttempt = Math.random() * 100 < attemptChance;

  if (!willAttempt) {
    return { 
      attempt: false, 
      success: false, 
      caughtOut: false, 
      description: '' 
    };
  }

  // 成功判定
  let successChance = 40; // 基本成功率
  
  if (strength === 'very_strong') successChance += 25;
  if (strength === 'strong') successChance += 15;
  if (runnerAheadScored) successChance += 15;
  successChance -= (outfieldArm - 50) * 0.6;

  const roll = Math.random() * 100;
  const success = roll < successChance;

  let description = '';
  if (success) {
    description = `一塁走者${runner.playerName}が積極的に三塁へ！好走塁！`;
  } else {
    // 失敗時はアウトになる可能性
    const caughtOut = roll > successChance + 30; // 失敗してもセーフの余地あり
    
    if (caughtOut) {
      description = `一塁走者${runner.playerName}が三塁を狙うも送球アウト！`;
    } else {
      description = `一塁走者${runner.playerName}は二塁止まり`;
    }
    
    return { attempt: true, success: false, caughtOut, description };
  }

  return { attempt: true, success: true, caughtOut: false, description };
}

/**
 * 6.2.3 単打時の打者の追加進塁判定（二塁へ）
 */
function evaluateBatterExtraBaseOnSingle(
  batter: PlayerInGame,
  batBallInfo: BatBallInfo,
  outfielderInfo: OutfielderInfo
): { success: boolean; description: string } {
  const { strength } = batBallInfo;
  const { fielder } = outfielderInfo;

  // 打者の走力
  const speed = batter.running.speed;
  const baserunning = batter.running.baserunning;

  // 外野手の肩力
  const outfieldArm = fielder.fielding.outfieldArm;

  // 強い打球でないと試行しない
  if (strength !== 'very_strong') {
    return { success: false, description: '' };
  }

  // 成功率計算
  let successChance = 25; // 基本成功率
  successChance += (speed - 50) * 0.5;
  successChance += (baserunning - 50) * 0.3;
  successChance -= (outfieldArm - 50) * 0.6;

  const success = Math.random() * 100 < successChance;

  let description = '';
  if (success) {
    description = `${batter.name}が果敢に二塁へ！スピードを活かしました！`;
  }

  return { success, description };
}

/**
 * 6.3 二塁打時の本塁到達と中継送球
 * 
 * 外野捕球位置に応じた判断を行う
 * 中継送球の段階的評価と送球先選択
 */
export function evaluateDoubleAdvancement(
  runners: RunnerState,
  batter: PlayerInGame,
  batBallInfo: BatBallInfo,
  outfielderInfo: OutfielderInfo
): BaseRunningResult {
  const advancements: BaseRunningAdvancement[] = [];
  let runsScored = 0;
  let outsRecorded = 0;
  const descriptions: string[] = [];

  descriptions.push(`${batter.name}の二塁打！`);

  // 打者は基本的に二塁へ
  advancements.push({ from: 'batter', to: 'second' });

  // 三塁走者は確実に得点
  if (runners.third) {
    advancements.push({ from: 'third', to: 'home' });
    descriptions.push(`三塁走者${runners.third.playerName}が生還！`);
    runsScored++;
  }

  // 二塁走者も確実に得点
  if (runners.second) {
    advancements.push({ from: 'second', to: 'home' });
    descriptions.push(`二塁走者${runners.second.playerName}が生還！`);
    runsScored++;
  }

  // 6.3: 一塁走者の本塁到達判定（中継送球を含む）
  if (runners.first) {
    const scoreFromFirstResult = evaluateScoreFromFirstOnDouble(
      runners.first,
      batBallInfo,
      outfielderInfo
    );

    if (scoreFromFirstResult.success) {
      advancements.push({ 
        from: 'first', 
        to: 'home',
        wasThrown: scoreFromFirstResult.wasThrown,
        description: scoreFromFirstResult.description
      });
      descriptions.push(scoreFromFirstResult.description);
      runsScored++;
    } else if (scoreFromFirstResult.caughtOut) {
      advancements.push({ 
        from: 'first', 
        to: 'out',
        description: scoreFromFirstResult.description
      });
      descriptions.push(scoreFromFirstResult.description);
      outsRecorded++;
    } else {
      advancements.push({ from: 'first', to: 'third' });
      descriptions.push(`一塁走者${runners.first.playerName}は三塁止まり`);
    }
  }

  return {
    advancements,
    runsScored,
    outsRecorded,
    commentary: descriptions.join(' ')
  };
}

/**
 * 6.3.1 二塁打時の一塁走者の本塁到達判定
 * 
 * 外野捕球位置と中継送球の段階的評価
 */
function evaluateScoreFromFirstOnDouble(
  runner: Runner,
  batBallInfo: BatBallInfo,
  outfielderInfo: OutfielderInfo
): { success: boolean; caughtOut: boolean; wasThrown: boolean; description: string } {
  const { direction, strength } = batBallInfo;
  const { fielder, relayFielder } = outfielderInfo;

  // 外野手の肩力
  const outfieldArm = fielder.fielding.outfieldArm;
  
  // 中継選手の能力（いる場合）
  const relayArm = relayFielder ? relayFielder.fielding.infieldArm : 50;

  // 6.3: 外野捕球位置に応じた判断
  // 打球の強さで外野手の捕球位置が変わる
  const catchDepth: Record<BatStrength, 'shallow' | 'medium' | 'deep'> = {
    'weak': 'shallow',
    'medium': 'medium',
    'strong': 'deep',
    'very_strong': 'deep'
  };

  const depth = catchDepth[strength];

  // 捕球位置による本塁到達難易度
  const depthModifier = {
    'shallow': -40, // 浅い位置で捕球されると無理
    'medium': -10,
    'deep': 20
  }[depth];

  // 打球方向による難易度
  const directionModifier: Record<BatDirection, number> = {
    'left': 5,
    'center_left': 0,
    'center': -15, // センターは最も本塁まで遠い
    'center_right': 0,
    'right': 5
  };

  // 基本成功率
  let scoreChance = 45;
  scoreChance += depthModifier;
  scoreChance += directionModifier[direction];

  // 6.3: 中継送球の段階的評価
  // 外野手の肩力と中継選手の肩力の両方を考慮
  const throwingPenalty = ((outfieldArm - 50) * 0.4) + ((relayArm - 50) * 0.3);
  scoreChance -= throwingPenalty;

  // 最終判定
  const roll = Math.random() * 100;
  const success = roll < scoreChance;
  
  // 送球があったかどうか（本塁への送球試行）
  const willThrow = scoreChance > 20; // ある程度可能性があれば送球
  
  let description = '';
  let caughtOut = false;

  if (success) {
    if (willThrow) {
      description = `一塁走者${runner.playerName}が一気に本塁へ！タイミングはセーフ！`;
    } else {
      description = `一塁走者${runner.playerName}が楽々本塁へ生還！`;
    }
  } else {
    if (willThrow && roll > scoreChance + 10) {
      // 送球してアウト
      caughtOut = true;
      if (relayFielder) {
        description = `一塁走者${runner.playerName}が本塁を狙うも、${relayFielder.name}の中継送球でタッチアウト！`;
      } else {
        description = `一塁走者${runner.playerName}が本塁を狙うも、好返球でタッチアウト！`;
      }
    } else {
      description = `一塁走者${runner.playerName}は三塁止まり`;
    }
  }

  return { 
    success, 
    caughtOut, 
    wasThrown: willThrow, 
    description 
  };
}

/**
 * 6.3.2 送球先の選択判断
 * 
 * 複数走者がいる場合の送球先を決定
 */
export function determineThrowTarget(
  runners: RunnerState,
  outs: number,
  batBallInfo: BatBallInfo
): 'home' | 'third' | 'second' | 'first' {
  // アウトカウントと走者状況で判断
  
  // 三塁走者がいて、ツーアウトでない場合は本塁優先
  if (runners.third && outs < 2) {
    return 'home';
  }

  // 二塁走者がいて、三塁が空いている場合
  if (runners.second && !runners.third) {
    // 強い打球なら本塁を狙う可能性
    if (batBallInfo.strength === 'very_strong') {
      return 'home';
    }
    return 'third';
  }

  // 一塁走者のみの場合は二塁へ
  if (runners.first && !runners.second && !runners.third) {
    return 'second';
  }

  // デフォルトは本塁
  return 'home';
}

/**
 * 6.4 得点と実況表示
 * 
 * タイムリーやタッチアウトの実況を生成
 */
export function generateScoringCommentary(
  advancements: BaseRunningAdvancement[],
  runsScored: number,
  batter: PlayerInGame
): string {
  const descriptions: string[] = [];

  // 得点があった場合
  if (runsScored > 0) {
    const scoringRunners = advancements.filter(a => a.to === 'home' && a.from !== 'batter');
    
    if (runsScored === 1) {
      descriptions.push('タイムリーヒット！');
    } else if (runsScored === 2) {
      descriptions.push('2点タイムリー！');
    } else if (runsScored >= 3) {
      descriptions.push(`大量${runsScored}点！`);
    }

    // 個別の走者の得点を説明
    scoringRunners.forEach(runner => {
      if (runner.description) {
        descriptions.push(runner.description);
      }
    });

    // 打者が本塁打で得点した場合
    const batterScored = advancements.find(a => a.from === 'batter' && a.to === 'home');
    if (batterScored) {
      if (runsScored === 1) {
        descriptions.push('ソロホームラン！');
      } else if (runsScored === 2) {
        descriptions.push('2ランホームラン！');
      } else if (runsScored === 3) {
        descriptions.push('3ランホームラン！');
      } else if (runsScored === 4) {
        descriptions.push('満塁ホームラン！グランドスラム！');
      }
    }
  }

  // タッチアウトがあった場合
  const tagOuts = advancements.filter(a => a.to === 'out' && a.wasThrown);
  tagOuts.forEach(tagOut => {
    if (tagOut.description) {
      descriptions.push(tagOut.description);
    }
  });

  // 追加進塁があった場合
  const extraBases = advancements.filter(a => a.isExtraBase);
  extraBases.forEach(extra => {
    if (extra.description) {
      descriptions.push(extra.description);
    }
  });

  return descriptions.join(' ');
}

/**
 * ユーティリティ: 走者の走力を取得
 * 
 * 注: 現在のRunnerには走力情報がないため、
 * 実際の実装ではPlayerInGameから取得する必要がある
 */
function getRunnerSpeed(runner: Runner, allPlayers: PlayerInGame[]): number {
  const player = allPlayers.find(p => p.id === runner.playerId);
  return player?.running.speed || 50; // デフォルト50
}

/**
 * ユーティリティ: 走者の走塁技術を取得
 */
function getRunnerBaserunning(runner: Runner, allPlayers: PlayerInGame[]): number {
  const player = allPlayers.find(p => p.id === runner.playerId);
  return player?.running.baserunning || 50; // デフォルト50
}
