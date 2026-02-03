/**
 * CPU戦術AIエンジン
 * Requirement 10: CPU操作チームの戦術AI
 */

import { GameState, PitcherInGame } from './gameSlice';
import { Player, PlayerInGame, TeamInGame } from '../types';
import {
  OffensiveInstruction,
  DefensiveInstruction,
  DefensiveShift,
} from '../types/common';

/**
 * CPU難易度
 * AC 63-67: 難易度別のAI調整
 */
export type CPUDifficulty = 'beginner' | 'intermediate' | 'expert';

/**
 * CPU AI設定
 */
export interface CPUAIConfig {
  difficulty: CPUDifficulty;
  thinkingTimeMs: number; // 思考時間（ミリ秒）
}

/**
 * 戦術判断コンテキスト
 */
export interface TacticalContext {
  inning: number;
  isTopHalf: boolean;
  outs: number;
  runners: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
  scoreDiff: number; // 正の値: CPUチームがリード、負の値: ビハインド
  isCloseGame: boolean; // 2点差以内
  isLateInning: boolean; // 7回以降
  batter: PlayerInGame;
  pitcher: PlayerInGame;
  pitchCount: number;
  balls: number;
  strikes: number;
}

/**
 * CPU AI判断エンジン
 * AC 1-5: CPU AIの基本動作
 */
export class CPUAIEngine {
  private config: CPUAIConfig;

  constructor(config: CPUAIConfig = { difficulty: 'intermediate', thinkingTimeMs: 1000 }) {
    this.config = config;
  }

  /**
   * 戦術コンテキストを構築
   */
  private buildContext(
    gameState: GameState,
    isOffense: boolean
  ): TacticalContext {
    const { currentInning, isTopHalf, outs, runners, score, currentAtBat, currentPitcher } = gameState;
    
    // CPUチームがホームかアウェイか判定
    const isCPUHome = !gameState.isPlayerHome;
    const cpuScore = isCPUHome ? score.home : score.away;
    const opponentScore = isCPUHome ? score.away : score.home;
    
    const scoreDiff = cpuScore - opponentScore;
    const isCloseGame = Math.abs(scoreDiff) <= 2;
    const isLateInning = currentInning >= 7;

    // 打者と投手の情報を取得
    const batter = this.getCurrentBatter(gameState);
    const pitcher = this.getCurrentPitcher(gameState);

    return {
      inning: currentInning,
      isTopHalf,
      outs,
      runners: {
        first: runners.first !== null,
        second: runners.second !== null,
        third: runners.third !== null,
      },
      scoreDiff,
      isCloseGame,
      isLateInning,
      batter,
      pitcher,
      pitchCount: currentPitcher?.pitchCount || 0,
      balls: currentAtBat?.balls || 0,
      strikes: currentAtBat?.strikes || 0,
    };
  }

  /**
   * 現在の打者を取得
   */
  private getCurrentBatter(gameState: GameState): PlayerInGame {
    const { currentAtBat, homeTeam, awayTeam, isTopHalf } = gameState;
    const team = isTopHalf ? awayTeam : homeTeam;
    
    if (!currentAtBat || !team) {
      throw new Error('打者情報が取得できません');
    }

    const batter = team.lineup[currentAtBat.batterIndex];
    if (!batter) {
      throw new Error('打者が見つかりません');
    }

    return batter;
  }

  /**
   * 現在の投手を取得
   */
  private getCurrentPitcher(gameState: GameState): PlayerInGame {
    const { currentPitcher } = gameState;
    
    if (!currentPitcher) {
      throw new Error('投手情報が取得できません');
    }

    return currentPitcher.currentPitcher;
  }

  /**
   * 思考時間を待機
   * AC 3: 思考時間の演出
   */
  async waitThinking(): Promise<void> {
    const baseTime = this.config.thinkingTimeMs;
    const randomFactor = 0.5 + Math.random(); // 0.5-1.5倍
    const actualTime = baseTime * randomFactor;
    
    return new Promise(resolve => setTimeout(resolve, actualTime));
  }

  /**
   * 攻撃指示を決定
   * AC 6-34: 攻撃時の基本戦術判断
   */
  decideOffensiveInstruction(gameState: GameState): OffensiveInstruction {
    const context = this.buildContext(gameState, true);
    
    // 各戦術の選択確率を計算
    const probabilities = this.calculateOffensiveProbabilities(context);
    
    // ランダム選択（AC 2: ランダム性を持たせる）
    const instruction = this.selectRandomInstruction(probabilities);
    
    // 難易度による補正（AC 63-67）
    return this.applyDifficultyAdjustment(instruction, context, probabilities);
  }

  /**
   * 守備指示を決定
   * AC 35-50: 守備時の判断
   */
  decideDefensiveInstruction(gameState: GameState): DefensiveInstruction | null {
    const context = this.buildContext(gameState, false);
    
    // 投手交代判断
    if (this.shouldChangePitcher(context)) {
      return 'pitcher_change';
    }

    // 敬遠判断
    if (this.shouldIntentionalWalk(context)) {
      return 'intentional_walk';
    }

    // 守備シフト判断
    if (this.shouldApplyDefensiveShift(context)) {
      return 'defensive_shift';
    }

    return null; // 通常守備
  }

  /**
   * 守備シフトを決定
   * Requirement 11との統合
   * AC 53-57: CPU操作チームの守備シフト判断
   */
  decideDefensiveShift(gameState: GameState): DefensiveShift {
    const context = this.buildContext(gameState, false);
    const batter = context.batter;

    // ランナーが得点圏にいる場合は通常守備（AC 55）
    if (context.runners.second || context.runners.third) {
      return 'normal';
    }

    // 打者の特性に基づいてシフトを選択（AC 53）
    const hrPower = batter.batting.hrPower || 50;
    const shiftProbability = this.getShiftProbability(context);
    
    // シフトを使用するかどうかの判定
    if (Math.random() > shiftProbability) {
      return 'normal';
    }

    // 極端シフトの判断（AC 54）
    if (hrPower >= 80) {
      const enhancedProb = shiftProbability * 1.5;
      if (Math.random() < enhancedProb) {
        return 'extreme_shift';
      }
    }

    // 左打者か右打者かで方向を決定
    const batterHand = batter.batterHand || 'right';
    if (batterHand === 'left') {
      return 'pull_right'; // 左打者は右方向に引っ張る
    } else {
      return 'pull_left'; // 右打者は左方向に引っ張る
    }
  }

  /**
   * 攻撃戦術の確率を計算
   */
  private calculateOffensiveProbabilities(
    context: TacticalContext
  ): Map<OffensiveInstruction, number> {
    const probs = new Map<OffensiveInstruction, number>();

    // 基本確率: 通常打撃
    let normalSwingProb = this.calculateNormalSwingProbability(context);
    probs.set('normal_swing', normalSwingProb);

    // バント判断（AC 11-15）
    const buntProb = this.calculateBuntProbability(context);
    probs.set('bunt', buntProb);

    // 盗塁判断（AC 16-22）
    const stealProb = this.calculateStealProbability(context);
    probs.set('steal', stealProb);

    // エンドラン判断（AC 23-26）
    const hitAndRunProb = this.calculateHitAndRunProbability(context);
    probs.set('hit_and_run', hitAndRunProb);

    // スクイズ判断（AC 27-31）
    const squeezeProb = this.calculateSqueezeProbability(context);
    probs.set('squeeze', squeezeProb);

    // ダブルスチール判断（AC 32-34）
    const doubleStealProb = this.calculateDoubleStealProbability(context);
    probs.set('double_steal', doubleStealProb);

    // 待て（選択しない）
    probs.set('wait', 0);

    return this.normalizeProbabilities(probs);
  }

  /**
   * 通常打撃の確率を計算
   * AC 6-10: 攻撃時の基本戦術判断
   */
  private calculateNormalSwingProbability(context: TacticalContext): number {
    let baseProb = 0.85; // 基本85%

    const contact = context.batter.batting.contact || 50;
    
    // Contact能力による補正
    if (contact >= 70) {
      baseProb = 0.925; // AC 7: 90-95%
    } else if (contact < 40) {
      baseProb = 0.75; // AC 8: 70-80%
    }

    // 大差で負けている場合は積極的に（AC 9）
    if (context.scoreDiff <= -5) {
      baseProb *= 1.1;
    }

    return Math.min(baseProb, 1.0);
  }

  /**
   * バント確率を計算
   * AC 11-15: バント戦術の判断
   */
  private calculateBuntProbability(context: TacticalContext): number {
    // ツーアウトではバントしない（AC 12）
    if (context.outs === 2) {
      return 0;
    }

    // ランナーが一塁にいない場合は基本的にバントしない
    if (!context.runners.first) {
      return 0;
    }

    const sacrificeBunt = context.batter.fielding.sacrificeBunt || 0;
    
    // 投手の場合は高確率でバント（AC 13）
    const contact = context.batter.batting.contact || 50;
    if (contact < 30) {
      return context.runners.first ? 0.6 : 0;
    }

    // クリーンナップでHR Power高い場合はバントしない（AC 15）
    const hrPower = context.batter.batting.hrPower || 50;
    const batterIndex = 0; // 簡略化: 実際は打順を取得
    if (batterIndex >= 2 && batterIndex <= 4 && hrPower >= 70) {
      return 0;
    }

    // Sacrifice Bunt能力が60以上の場合（AC 11）
    if (sacrificeBunt >= 60 && (context.outs === 0 || context.outs === 1)) {
      let prob = 0.2; // 基本15-25%
      
      // 接戦の7回以降は確率上昇（AC 14）
      if (context.isCloseGame && context.isLateInning && Math.abs(context.scoreDiff) <= 1) {
        prob += 0.25;
      }

      return prob;
    }

    return 0;
  }

  /**
   * 盗塁確率を計算
   * AC 16-22: 盗塁戦術の判断
   */
  private calculateStealProbability(context: TacticalContext): number {
    // ツーアウトは大幅減少（AC 20: 最優先適用）
    if (context.outs === 2) {
      return 0; // 70%低下 → ほぼ0
    }

    // 点差が5点以上ある場合は選択しない（AC 21: 最優先適用）
    if (Math.abs(context.scoreDiff) >= 5) {
      return 0;
    }

    // ランナーが一塁にいない場合は盗塁できない
    if (!context.runners.first) {
      return 0;
    }

    const stealingAbility = context.batter.running.stealingAbility || 50;
    
    // Stealing Ability 50未満は選択しない（AC 17）
    if (stealingAbility < 50) {
      return 0;
    }

    // 基本確率（AC 16）
    let baseProb = 0;
    if (stealingAbility >= 70) {
      baseProb = 0.25; // 20-30%
    } else if (stealingAbility >= 50) {
      baseProb = 0.1; // 低めの確率
    }

    // 投手のHold Runners能力による補正（AC 18）
    const holdRunners = context.pitcher.pitching?.holdRunners || 60;
    if (holdRunners >= 80) {
      baseProb *= 0.5;
    }

    // 捕手のCatcher Arm能力による補正（AC 19）
    // 注: 捕手情報は gameState から取得する必要があるが、簡略化のため省略
    
    // 接戦の7回以降は確率上昇（AC 22）
    if (context.isCloseGame && context.isLateInning && Math.abs(context.scoreDiff) <= 1) {
      if (context.outs < 2 && Math.abs(context.scoreDiff) < 5) {
        baseProb *= 1.5;
      }
    }

    return Math.min(baseProb, 1.0);
  }

  /**
   * エンドラン確率を計算
   * AC 23-26: エンドラン戦術の判断
   */
  private calculateHitAndRunProbability(context: TacticalContext): number {
    // ランナーが一塁にいない、またはツーアウトの場合は実行しない
    if (!context.runners.first || context.outs === 2) {
      return 0;
    }

    const contact = context.batter.batting.contact || 50;
    const speed = context.batter.running.speed || 50;

    // AC 23: Contact 65以上かつSpeed 60以上
    if (contact >= 65 && speed >= 60 && (context.outs === 0 || context.outs === 1)) {
      let prob = 0.15; // 10-20%

      // カウントが打者有利の場合は確率上昇（AC 24）
      if (context.balls >= 2 && context.strikes === 0) {
        prob *= 1.5;
      }

      // カウントが投手有利の場合は選択しない（AC 25）
      if (context.strikes === 2) {
        return 0;
      }

      // パワーヒッターの場合は確率低下（AC 26）
      const hrPower = context.batter.batting.hrPower || 50;
      if (hrPower >= 75 && contact < 60) {
        prob *= 0.5;
      }

      return prob;
    }

    return 0;
  }

  /**
   * スクイズ確率を計算
   * AC 27-31: スクイズ戦術の判断
   */
  private calculateSqueezeProbability(context: TacticalContext): number {
    // ツーアウトまたは三塁ランナーがいない場合は実行しない（AC 30）
    if (context.outs === 2 || !context.runners.third) {
      return 0;
    }

    // クリーンナップの場合は実行しない（AC 31）
    // 簡略化: 打順情報を使用しない
    
    const sacrificeBunt = context.batter.fielding.sacrificeBunt || 0;
    const runnerSpeed = 60; // 簡略化: 実際は三塁ランナーの情報を取得

    // AC 27: Sacrifice Bunt 60以上かつSpeed 60以上
    if (sacrificeBunt >= 60 && runnerSpeed >= 60 && context.outs <= 1) {
      // AC 28: 接戦の7回以降
      if (context.isCloseGame && context.isLateInning && 
          (context.scoreDiff === 0 || context.scoreDiff === -1)) {
        return 0.2; // 15-25%
      }

      // AC 29: ノーアウトまたはワンアウト
      if (context.outs === 0 || context.outs === 1) {
        return 0.1; // 5-15%
      }
    }

    return 0;
  }

  /**
   * ダブルスチール確率を計算
   * AC 32-34: ダブルスチール戦術の判断
   */
  private calculateDoubleStealProbability(context: TacticalContext): number {
    // ツーアウトでは実行しない（AC 34）
    if (context.outs === 2) {
      return 0;
    }

    // ランナーが一塁と三塁、または一塁と二塁にいる場合
    if (context.runners.first && context.runners.third) {
      // 両ランナーのStealing Ability平均が65以上（AC 32）
      // 簡略化: 仮の値を使用
      const avgStealing = 65;
      if (avgStealing >= 65) {
        return 0.125; // 10-15%
      }
    } else if (context.runners.first && context.runners.second) {
      // 両ランナーのStealing Ability平均が70以上（AC 33）
      const avgStealing = 65;
      if (avgStealing >= 70) {
        return 0.075; // 5-10%
      }
    }

    return 0;
  }

  /**
   * 投手交代判断
   * AC 35-42: 守備時の投手交代判断
   */
  private shouldChangePitcher(context: TacticalContext): boolean {
    const { pitchCount, scoreDiff, isLateInning, inning } = context;

    // AC 35: 投球数が100球を超える
    if (pitchCount > 100) {
      return Math.random() < 0.85; // 80-90%
    }

    // AC 36: 投球数が75球を超え疲労度が「疲労」以上
    if (pitchCount > 75) {
      // 疲労度の判定は簡略化
      return Math.random() < 0.5; // 40-60%
    }

    // AC 37: 5失点以上している場合
    // 注: 失点情報は別途管理する必要があるため簡略化

    // AC 39: リリーフ投手の投球数が30球を超える
    // 注: 先発/リリーフの区別が必要

    // AC 40-42: 7回以降の接戦
    if (isLateInning && Math.abs(scoreDiff) <= 3) {
      if (pitchCount > 80) {
        return Math.random() < 0.6;
      }
    }

    return false;
  }

  /**
   * 敬遠判断
   * AC 43-47: 守備時の敬遠判断
   */
  private shouldIntentionalWalk(context: TacticalContext): boolean {
    const { runners, batter, isLateInning, scoreDiff } = context;

    // 点差が5点以上ある場合は敬遠しない（AC 47）
    if (Math.abs(scoreDiff) >= 5) {
      return false;
    }

    // 満塁になる敬遠は確率低下（AC 45）
    if (runners.first && runners.second && runners.third) {
      return Math.random() < 0.2; // 80%低下
    }

    const hrPower = batter.batting.hrPower || 50;
    
    // AC 43: 一塁が空いており、HR Power 80以上
    if (!runners.first && hrPower >= 80) {
      return Math.random() < 0.2; // 15-25%
    }

    // AC 44: 一塁が空いており、HR Power 75以上で次打者がContact 50未満
    // 注: 次打者の情報が必要
    
    // AC 46: 8回以降の接戦で一塁が空いている
    if (context.inning >= 8 && Math.abs(scoreDiff) <= 2 && !runners.first) {
      if (hrPower >= 70) {
        return Math.random() < 0.3; // 25-35%
      }
    }

    return false;
  }

  /**
   * 守備シフト判断
   * AC 48-50: 守備時の守備シフト判断
   */
  private shouldApplyDefensiveShift(context: TacticalContext): boolean {
    const { runners, batter } = context;

    // ランナーが得点圏にいる場合は通常守備（AC 50）
    if (runners.second || runners.third) {
      return false;
    }

    const hrPower = batter.batting.hrPower || 50;
    
    // AC 48: 極端な引っ張り傾向を持つ打者
    // 注: 打球傾向データが必要だが、簡略化のためHR Powerで代用
    
    let shiftProb = 0.5; // 40-60%

    // AC 49: HR Power 80以上の場合は確率上昇
    if (hrPower >= 80) {
      shiftProb *= 1.5;
    }

    return Math.random() < shiftProb;
  }

  /**
   * 守備シフト確率を取得（難易度補正付き）
   */
  private getShiftProbability(context: TacticalContext): number {
    let baseProb = 0.5;

    // 難易度による補正（AC 56-57）
    if (this.config.difficulty === 'expert') {
      baseProb = 0.75; // 70-80%
    } else if (this.config.difficulty === 'beginner') {
      baseProb = 0.15; // 10-20%
    }

    return baseProb;
  }

  /**
   * 確率を正規化
   */
  private normalizeProbabilities(
    probs: Map<OffensiveInstruction, number>
  ): Map<OffensiveInstruction, number> {
    const total = Array.from(probs.values()).reduce((sum, p) => sum + p, 0);
    
    if (total === 0) {
      // すべて0の場合は通常打撃に設定
      probs.set('normal_swing', 1.0);
      return probs;
    }

    const normalized = new Map<OffensiveInstruction, number>();
    for (const [instruction, prob] of probs.entries()) {
      normalized.set(instruction, prob / total);
    }

    return normalized;
  }

  /**
   * ランダムに指示を選択
   * AC 2: ランダム性を持たせる
   */
  private selectRandomInstruction(
    probabilities: Map<OffensiveInstruction, number>
  ): OffensiveInstruction {
    const rand = Math.random();
    let cumulative = 0;

    for (const [instruction, prob] of probabilities.entries()) {
      cumulative += prob;
      if (rand < cumulative) {
        return instruction;
      }
    }

    return 'normal_swing'; // フォールバック
  }

  /**
   * 難易度による補正を適用
   * AC 63-67: 難易度別のAI調整
   */
  private applyDifficultyAdjustment(
    instruction: OffensiveInstruction,
    context: TacticalContext,
    probabilities: Map<OffensiveInstruction, number>
  ): OffensiveInstruction {
    const viableInstructions = Array.from(probabilities.entries())
      .filter(([, prob]) => prob > 0)
      .map(([key]) => key);

    if (this.config.difficulty === 'beginner') {
      // AC 63: 初級は最適でない指示を30-40%の確率で選択
      if (Math.random() < 0.35) {
        if (viableInstructions.length > 0) {
          return viableInstructions[Math.floor(Math.random() * viableInstructions.length)];
        }
      }
    } else if (this.config.difficulty === 'intermediate') {
      // AC 65: 中級は最適でない指示を15-20%の確率で選択
      if (Math.random() < 0.175) {
        if (viableInstructions.length > 0) {
          return viableInstructions[Math.floor(Math.random() * viableInstructions.length)];
        }
      }
    }
    // AC 66: 上級はほぼ最適な指示を選択（ミス5%未満）

    return instruction;
  }
}

/**
 * グローバルCPU AIインスタンス
 */
let globalCPUAI: CPUAIEngine | null = null;

/**
 * CPU AIを初期化
 */
export function initializeCPUAI(config?: CPUAIConfig): void {
  globalCPUAI = new CPUAIEngine(config);
}

/**
 * CPU AIインスタンスを取得
 */
export function getCPUAI(): CPUAIEngine {
  if (!globalCPUAI) {
    globalCPUAI = new CPUAIEngine();
  }
  return globalCPUAI;
}
