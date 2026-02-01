import { 
  PlayerInGame, 
  RunnerState,
  Runner
} from '../types';

/**
 * 盗塁判定エンジン
 * タスク7: 盗塁/ダブルスチール/エンドラン/牽制
 * 
 * 7.1 盗塁の試行判定
 * 7.2 盗塁結果とダブルスチール
 * 7.3 エンドラン判定
 * 7.4 牽制プレイ判定
 */

// 盗塁結果
export interface StealResult {
  success: boolean;
  runner: Runner;
  targetBase: 'second' | 'third' | 'home';
  caughtStealing: boolean;
  commentary: string;
}

// ダブルスチール結果
export interface DoubleStealResult {
  results: StealResult[];
  throwTarget: 'second' | 'third' | 'home' | null;
  commentary: string;
}

// エンドラン結果
export interface HitAndRunResult {
  stealAttempt: StealResult;
  battingResult: 'hit' | 'out' | 'swing_miss';
  commentary: string;
}

// 牽制結果
export interface PickoffResult {
  attempted: boolean;
  success: boolean;
  runner: Runner | null;
  targetBase: 'first' | 'second' | 'third' | null;
  commentary: string;
}

/**
 * 7.1 盗塁の試行判定
 * 
 * 走者・投手・捕手能力で成功率を計算する
 * 塁上守備選手の処理を評価する
 */
export function judgeSteal(
  runner: Runner,
  currentBase: 'first' | 'second' | 'third',
  runnerPlayer: PlayerInGame,
  pitcher: PlayerInGame,
  catcher: PlayerInGame,
  infielders: PlayerInGame[]
): StealResult {
  const targetBase = getNextBase(currentBase);
  
  // 走者の盗塁能力
  const stealingAbility = runnerPlayer.running.stealingAbility;
  const stealingAggr = runnerPlayer.running.stealingAggr;
  
  // 投手の牽制能力とクイックモーション
  const holdRunners = pitcher.pitching.holdRunners;
  const quickMotion = pitcher.pitching.control * 0.3; // コントロールの良い投手は投球が速い
  
  // 捕手の肩力
  const catcherArm = catcher.fielding.infieldArm;
  const catcherFielding = catcher.fielding.fielding;
  
  // 塁上守備選手（二塁手またはショート）
  let infielderCovering: PlayerInGame | undefined;
  if (targetBase === 'second') {
    // 二塁盗塁の場合、二塁手またはショートがカバー
    infielderCovering = infielders.find(p => p.position === '2B' || p.position === 'SS');
  } else if (targetBase === 'third') {
    // 三塁盗塁の場合、三塁手がカバー
    infielderCovering = infielders.find(p => p.position === '3B');
  }
  
  const infielderFielding = infielderCovering?.fielding.fielding || 50;
  const infielderReaction = infielderCovering?.fielding.range || 50;
  
  // 7.1: 成功率計算
  let successRate = 50; // 基本成功率
  
  // 走者の能力による補正
  successRate += (stealingAbility - 50) * 0.8; // 盗塁能力の影響大
  successRate += (runnerPlayer.running.speed - 50) * 0.5; // スピードの影響
  successRate += (runnerPlayer.running.baserunning - 50) * 0.3; // 走塁技術の影響
  
  // 投手の能力による補正
  successRate -= (holdRunners - 50) * 0.6; // 牽制能力の影響
  successRate -= (quickMotion - 50) * 0.2; // クイックモーションの影響
  
  // 捕手の能力による補正
  successRate -= (catcherArm - 50) * 0.7; // 捕手の肩力の影響大
  successRate -= (catcherFielding - 50) * 0.3; // 捕手の守備力の影響
  
  // 7.1: 塁上守備選手の処理を評価
  successRate -= (infielderFielding - 50) * 0.2; // 内野手の守備力の影響
  successRate -= (infielderReaction - 50) * 0.2; // 内野手の反応の影響
  
  // 塁による難易度補正
  if (currentBase === 'second') {
    successRate -= 15; // 三塁盗塁は二塁盗塁より難しい
  } else if (currentBase === 'third') {
    successRate -= 25; // 本塁盗塁は非常に難しい
  }
  
  // 成功率を0-100に制限
  successRate = Math.max(0, Math.min(100, successRate));
  
  // 判定
  const roll = Math.random() * 100;
  const success = roll < successRate;
  const caughtStealing = !success;
  
  // 実況生成
  let commentary = '';
  if (success) {
    const closeness = successRate > 70 ? '余裕で' : successRate > 50 ? '' : 'タイミングギリギリで';
    commentary = `${runner.playerName}が${closeness}${getBaseNameJa(targetBase)}盗塁成功！`;
    
    if (infielderCovering) {
      commentary += ` ${infielderCovering.name}のタッグが遅れました。`;
    }
  } else {
    const closeTag = roll > successRate + 20 ? '' : 'タイミングは僅差！';
    commentary = `${runner.playerName}が${getBaseNameJa(targetBase)}盗塁を試みるも、`;
    
    if (Math.random() < 0.6) {
      commentary += `捕手${catcher.name}の好送球でタッチアウト！${closeTag}`;
    } else if (infielderCovering) {
      commentary += `${infielderCovering.name}の好タッグでアウト！${closeTag}`;
    } else {
      commentary += `アウト！${closeTag}`;
    }
  }
  
  return {
    success,
    runner,
    targetBase,
    caughtStealing,
    commentary
  };
}

/**
 * 7.2 盗塁結果とダブルスチール
 * 
 * 成功/失敗の実況と結果処理を行う
 * ダブルスチールの送球選択と結果を評価する
 */
export function judgeDoubleSteal(
  runners: RunnerState,
  runnerPlayers: { first?: PlayerInGame; second?: PlayerInGame; third?: PlayerInGame },
  pitcher: PlayerInGame,
  catcher: PlayerInGame,
  infielders: PlayerInGame[]
): DoubleStealResult {
  const results: StealResult[] = [];
  const descriptions: string[] = [];
  
  descriptions.push('ダブルスチール！');
  
  // 走者の位置を確認
  const runnersToSteal: Array<{ runner: Runner; base: 'first' | 'second' | 'third'; player: PlayerInGame }> = [];
  
  if (runners.first && runnerPlayers.first) {
    runnersToSteal.push({ runner: runners.first, base: 'first', player: runnerPlayers.first });
  }
  if (runners.second && runnerPlayers.second) {
    runnersToSteal.push({ runner: runners.second, base: 'second', player: runnerPlayers.second });
  }
  if (runners.third && runnerPlayers.third) {
    runnersToSteal.push({ runner: runners.third, base: 'third', player: runnerPlayers.third });
  }
  
  if (runnersToSteal.length < 2) {
    // ダブルスチールには2人以上の走者が必要
    return {
      results: [],
      throwTarget: null,
      commentary: 'ダブルスチールを試みることができません（走者が不足）'
    };
  }
  
  // 7.2: 送球選択
  // 捕手がどの塁に投げるかを決定
  // 基本的には後ろの塁（より重要な塁）を優先
  const throwTarget = determineDoubleStealThrowTarget(runnersToSteal, catcher);
  
  descriptions.push(`捕手${catcher.name}は${getBaseNameJa(throwTarget)}へ送球！`);
  
  // 7.2: 各走者の盗塁判定
  for (const { runner, base, player } of runnersToSteal) {
    const targetBase = getNextBase(base);
    
    // 送球先の塁は通常の盗塁判定
    // 送球されない塁はほぼ確実に成功
    let result: StealResult;
    
    if (targetBase === throwTarget) {
      // 送球された塁は通常の盗塁判定
      result = judgeSteal(runner, base, player, pitcher, catcher, infielders);
    } else {
      // 送球されなかった塁はほぼ確実に成功
      const almostCertainSuccess = Math.random() < 0.95;
      
      result = {
        success: almostCertainSuccess,
        runner,
        targetBase,
        caughtStealing: !almostCertainSuccess,
        commentary: almostCertainSuccess 
          ? `${runner.playerName}が${getBaseNameJa(targetBase)}盗塁成功！無警戒！` 
          : `${runner.playerName}が${getBaseNameJa(targetBase)}盗塁失敗。まさかのアウト！`
      };
    }
    
    results.push(result);
    descriptions.push(result.commentary);
  }
  
  return {
    results,
    throwTarget,
    commentary: descriptions.join(' ')
  };
}

/**
 * ダブルスチール時の送球先決定
 * 
 * 通常は後ろの塁を優先
 */
function determineDoubleStealThrowTarget(
  runnersToSteal: Array<{ runner: Runner; base: 'first' | 'second' | 'third'; player: PlayerInGame }>,
  catcher: PlayerInGame
): 'second' | 'third' | 'home' {
  // 最も進んだ走者の次の塁を狙う
  const bases = runnersToSteal.map(r => r.base);
  
  if (bases.includes('third')) {
    return 'home'; // 三塁走者がいる場合は本塁を守る
  } else if (bases.includes('second')) {
    return 'third'; // 二塁走者がいる場合は三塁を守る
  } else {
    return 'second'; // 一塁走者のみの場合は二塁を守る
  }
}

/**
 * 7.3 エンドラン判定
 * 
 * 打者結果に応じた走塁処理を行う
 * 成功時の実況と進塁増加を適用する
 */
export function judgeHitAndRun(
  runner: Runner,
  currentBase: 'first' | 'second',
  runnerPlayer: PlayerInGame,
  batter: PlayerInGame,
  pitcher: PlayerInGame,
  catcher: PlayerInGame,
  infielders: PlayerInGame[],
  battingOutcome: 'hit' | 'out' | 'swing_miss'
): HitAndRunResult {
  const descriptions: string[] = [];
  
  descriptions.push('ヒットエンドラン！');
  
  // 走者はスタートを切る（盗塁を試みる）
  const stealAttempt = judgeSteal(runner, currentBase, runnerPlayer, pitcher, catcher, infielders);
  
  // 打者の結果に応じて処理
  let finalCommentary = '';
  
  switch (battingOutcome) {
    case 'hit':
      // 7.3: ヒットの場合、走者は大きく進塁できる
      descriptions.push(`${batter.name}がヒット！`);
      
      if (stealAttempt.success) {
        descriptions.push(`エンドランが成功！${runner.playerName}はスタートを切っていたので大きく進塁！`);
        
        // 進塁ボーナス（実際の進塁処理は呼び出し側で行う）
        // ここでは実況のみ
      } else {
        // スタートは切ったが、盗塁は失敗
        // ただしヒットなので、走者は進塁できる可能性が高い
        descriptions.push(`${runner.playerName}はスタートを切っていましたが、ヒットが出たので問題なし！`);
      }
      break;
      
    case 'out':
      // 7.3: アウトの場合、走者は進塁できない
      descriptions.push(`${batter.name}がアウト！`);
      
      if (stealAttempt.caughtStealing) {
        descriptions.push(`エンドラン失敗！${runner.playerName}も盗塁失敗でダブルプレー！`);
      } else {
        descriptions.push(`${runner.playerName}は盗塁成功も、打者がアウトで効果なし。`);
      }
      break;
      
    case 'swing_miss':
      // 7.3: 空振りの場合、通常の盗塁判定
      descriptions.push(`${batter.name}が空振り！`);
      
      if (stealAttempt.success) {
        descriptions.push(`しかし${runner.playerName}は盗塁成功！エンドランが活きました！`);
      } else {
        descriptions.push(`${runner.playerName}も盗塁失敗！エンドランが裏目に出ました。`);
      }
      break;
  }
  
  finalCommentary = descriptions.join(' ');
  
  return {
    stealAttempt,
    battingResult: battingOutcome,
    commentary: finalCommentary
  };
}

/**
 * 7.4 牽制プレイ判定
 * 
 * 牽制試行確率とリード幅評価を行う
 * 牽制成功/悪送球の処理を適用する
 */
export function judgePickoff(
  runner: Runner | null,
  targetBase: 'first' | 'second' | 'third',
  runnerPlayer: PlayerInGame | undefined,
  pitcher: PlayerInGame,
  infielders: PlayerInGame[]
): PickoffResult {
  if (!runner || !runnerPlayer) {
    return {
      attempted: false,
      success: false,
      runner: null,
      targetBase: null,
      commentary: ''
    };
  }
  
  // 7.4: 牽制試行確率
  const holdRunners = pitcher.pitching.holdRunners;
  const runnerStealingAggr = runnerPlayer.running.stealingAggr;
  
  // 牽制を試みる確率
  let pickoffAttemptRate = 20; // 基本試行率20%
  pickoffAttemptRate += (holdRunners - 50) * 0.5; // 牽制能力が高いほど試行しやすい
  pickoffAttemptRate += (runnerStealingAggr - 50) * 0.4; // 走者の積極性が高いほど警戒して牽制
  
  pickoffAttemptRate = Math.max(0, Math.min(100, pickoffAttemptRate));
  
  const willAttemptPickoff = Math.random() * 100 < pickoffAttemptRate;
  
  if (!willAttemptPickoff) {
    return {
      attempted: false,
      success: false,
      runner: null,
      targetBase: null,
      commentary: ''
    };
  }
  
  // 牽制を試みる
  const descriptions: string[] = [];
  descriptions.push(`投手${pitcher.name}が${getBaseNameJa(targetBase)}へ牽制！`);
  
  // 塁の守備選手を取得
  let infielder: PlayerInGame | undefined;
  switch (targetBase) {
    case 'first':
      infielder = infielders.find(p => p.position === '1B');
      break;
    case 'second':
      infielder = infielders.find(p => p.position === '2B' || p.position === 'SS');
      break;
    case 'third':
      infielder = infielders.find(p => p.position === '3B');
      break;
  }
  
  // 7.4: リード幅評価
  // 走者のリード幅を能力で評価
  const runnerBaserunning = runnerPlayer.running.baserunning;
  const runnerStealingAbility = runnerPlayer.running.stealingAbility;
  
  // リード幅（大きいほどリスク）
  let leadDistance = 50; // 基本リード幅
  leadDistance += (runnerStealingAbility - 50) * 0.4; // 盗塁能力が高いほど大きくリード
  leadDistance += (runnerStealingAggr - 50) * 0.3; // 積極性が高いほど大きくリード
  leadDistance -= (runnerBaserunning - 50) * 0.2; // 走塁技術が高いほど安全なリード
  leadDistance -= (holdRunners - 50) * 0.5; // 投手の牽制能力が高いほど小さくリード
  
  leadDistance = Math.max(0, Math.min(100, leadDistance));
  
  // 7.4: 牽制成功判定
  let pickoffSuccessRate = 10; // 基本成功率（低い）
  pickoffSuccessRate += (holdRunners - 50) * 0.6; // 投手の牽制能力
  pickoffSuccessRate += (leadDistance - 50) * 0.5; // リード幅が大きいほど成功しやすい
  
  if (infielder) {
    const infielderFielding = infielder.fielding.fielding;
    const infielderReaction = infielder.fielding.range;
    pickoffSuccessRate += (infielderFielding - 50) * 0.3; // 内野手の守備力
    pickoffSuccessRate += (infielderReaction - 50) * 0.2; // 内野手の反応
  }
  
  // 走者の反応
  pickoffSuccessRate -= (runnerBaserunning - 50) * 0.4; // 走塁技術で戻れる
  pickoffSuccessRate -= (runnerPlayer.running.speed - 50) * 0.3; // スピードで戻れる
  
  pickoffSuccessRate = Math.max(0, Math.min(100, pickoffSuccessRate));
  
  const pickoffSuccess = Math.random() * 100 < pickoffSuccessRate;
  
  // 7.4: 悪送球の可能性
  const wildThrowRate = 5 + (pitcher.pitching.control < 50 ? (50 - pitcher.pitching.control) * 0.2 : 0);
  const isWildThrow = Math.random() * 100 < wildThrowRate;
  
  let commentary = '';
  if (isWildThrow) {
    // 悪送球
    commentary = `投手${pitcher.name}の牽制球が悪送球！${runner.playerName}が進塁のチャンス！`;
    
    return {
      attempted: true,
      success: false,
      runner,
      targetBase,
      commentary: descriptions.join(' ') + ' ' + commentary
    };
  } else if (pickoffSuccess) {
    // 牽制成功
    if (infielder) {
      commentary = `${infielder.name}が素早くタッチ！${runner.playerName}が牽制アウト！`;
    } else {
      commentary = `${runner.playerName}が牽制アウト！`;
    }
    
    return {
      attempted: true,
      success: true,
      runner,
      targetBase,
      commentary: descriptions.join(' ') + ' ' + commentary
    };
  } else {
    // 牽制失敗（セーフ）
    const wasClose = Math.abs(Math.random() * 100 - pickoffSuccessRate) < 20;
    
    if (wasClose) {
      commentary = `${runner.playerName}がギリギリで帰塁！タイミングは僅差！`;
    } else {
      commentary = `${runner.playerName}が余裕で帰塁。`;
    }
    
    return {
      attempted: true,
      success: false,
      runner,
      targetBase,
      commentary: descriptions.join(' ') + ' ' + commentary
    };
  }
}

/**
 * 盗塁可能な走者をチェック
 */
export function canSteal(runners: RunnerState): boolean {
  return !!(runners.first || runners.second || runners.third);
}

/**
 * ダブルスチール可能な走者をチェック
 */
export function canDoubleSteal(runners: RunnerState): boolean {
  const runnerCount = [runners.first, runners.second, runners.third].filter(r => r !== null).length;
  return runnerCount >= 2;
}

/**
 * エンドラン可能な走者をチェック（一塁または二塁走者が必要）
 */
export function canHitAndRun(runners: RunnerState): boolean {
  return !!(runners.first || runners.second);
}

// ユーティリティ関数

function getNextBase(currentBase: 'first' | 'second' | 'third'): 'second' | 'third' | 'home' {
  switch (currentBase) {
    case 'first':
      return 'second';
    case 'second':
      return 'third';
    case 'third':
      return 'home';
  }
}

function getBaseNameJa(base: 'first' | 'second' | 'third' | 'home'): string {
  switch (base) {
    case 'first':
      return '一塁';
    case 'second':
      return '二塁';
    case 'third':
      return '三塁';
    case 'home':
      return '本塁';
  }
}
