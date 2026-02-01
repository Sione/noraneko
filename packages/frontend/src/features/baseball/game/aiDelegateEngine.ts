/**
 * AI委譲エンジン
 * Requirement 10 AC 73-98: プレイヤーからCPU AIへの指示委譲
 */

import { GameState } from './gameSlice';
import { CPUAIEngine, CPUAIConfig, CPUDifficulty } from './cpuAI';
import { OffensiveInstruction, DefensiveInstruction, DefensiveShift } from '../types/common';

/**
 * AI委譲モード
 */
export type AIDelegateMode = 
  | 'off' // AI委譲なし
  | 'confirm' // 確認モード（AI推奨を表示して確認）
  | 'auto' // 自動実行モード（即座に実行）
  | 'always'; // 常にAI委譲

/**
 * AI委譲判断難易度
 * AC 84-86
 */
export type AIDelegateAggressiveness = 
  | 'conservative' // 保守的（リスクの高い戦術を避ける）
  | 'standard' // 標準
  | 'aggressive'; // 積極的（リスクの高い戦術を多用）

/**
 * AI委譲設定
 */
export interface AIDelegateConfig {
  mode: AIDelegateMode;
  aggressiveness: AIDelegateAggressiveness;
  cpuDifficulty: CPUDifficulty;
}

/**
 * AI委譲結果
 */
export interface AIDelegateResult {
  offensiveInstruction?: OffensiveInstruction;
  defensiveInstruction?: DefensiveInstruction;
  defensiveShift?: DefensiveShift;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * AI委譲統計
 * AC 89-90
 */
export interface AIDelegateStatistics {
  usageCount: number;
  successCount: number; // 得点/アウトなどの成功
  failureCount: number;
  scoreRate: number; // AI委譲時の得点率
  winRate: number; // AI委譲試合の勝率
}

/**
 * AI委譲エンジン
 * AC 73-90: AI委譲機能
 */
export class AIDelegateEngine {
  private cpuAI: CPUAIEngine;
  private config: AIDelegateConfig;
  private statistics: AIDelegateStatistics;

  constructor(config: AIDelegateConfig) {
    this.config = config;
    this.cpuAI = new CPUAIEngine({
      difficulty: config.cpuDifficulty,
      thinkingTimeMs: 500, // AI委譲は高速化
    });
    this.statistics = {
      usageCount: 0,
      successCount: 0,
      failureCount: 0,
      scoreRate: 0,
      winRate: 0,
    };
  }

  /**
   * 攻撃指示をAI委譲で決定
   * AC 74-75: AI委譲で指示を自動決定
   */
  delegateOffensiveInstruction(gameState: GameState): AIDelegateResult {
    this.statistics.usageCount++;

    // CPUAIを使用して指示を決定
    const instruction = this.cpuAI.decideOffensiveInstruction(gameState);
    
    // 積極性に応じて調整
    const adjustedInstruction = this.adjustInstructionByAggressiveness(instruction, gameState);
    
    // 理由を生成
    const reason = this.generateInstructionReason(adjustedInstruction, gameState);
    
    // 信頼度を計算
    const confidence = this.calculateConfidence(adjustedInstruction, gameState);

    return {
      offensiveInstruction: adjustedInstruction,
      reason,
      confidence,
    };
  }

  /**
   * 守備指示をAI委譲で決定
   */
  delegateDefensiveInstruction(gameState: GameState): AIDelegateResult {
    this.statistics.usageCount++;

    const instruction = this.cpuAI.decideDefensiveInstruction(gameState);
    
    if (instruction === 'defensive_shift') {
      const shift = this.cpuAI.decideDefensiveShift(gameState);
      return {
        defensiveInstruction: instruction,
        defensiveShift: shift,
        reason: this.generateShiftReason(shift, gameState),
        confidence: 'medium',
      };
    }

    return {
      defensiveInstruction: instruction || 'normal',
      reason: this.generateDefensiveInstructionReason(instruction, gameState),
      confidence: 'medium',
    };
  }

  /**
   * 積極性に応じて指示を調整
   * AC 85-86: 保守的/積極的な判断難易度
   */
  private adjustInstructionByAggressiveness(
    instruction: OffensiveInstruction,
    gameState: GameState
  ): OffensiveInstruction {
    const { aggressiveness } = this.config;

    // 保守的: リスクの高い戦術を避ける
    if (aggressiveness === 'conservative') {
      const riskyInstructions: OffensiveInstruction[] = ['steal', 'squeeze', 'hit_and_run', 'double_steal'];
      if (riskyInstructions.includes(instruction)) {
        // 50%の確率で通常打撃に変更
        if (Math.random() < 0.5) {
          return 'normal_swing';
        }
      }
    }

    // 積極的: リスクの高い戦術を多用
    if (aggressiveness === 'aggressive') {
      const { runners } = gameState;
      
      // ランナーが一塁にいる場合、盗塁を検討
      if (runners.first && instruction === 'normal_swing') {
        if (Math.random() < 0.3) {
          return 'steal';
        }
      }

      // ランナーが三塁にいる場合、スクイズを検討
      if (runners.third && gameState.outs < 2 && instruction === 'normal_swing') {
        if (Math.random() < 0.2) {
          return 'squeeze';
        }
      }
    }

    return instruction;
  }

  /**
   * 指示の理由を生成
   * AC 88: 判断理由をログ出力
   */
  private generateInstructionReason(
    instruction: OffensiveInstruction,
    gameState: GameState
  ): string {
    const { runners, outs, currentInning } = gameState;

    switch (instruction) {
      case 'normal_swing':
        return '通常打撃が最適と判断しました';
      
      case 'bunt':
        if (runners.first && outs < 2) {
          return `ランナー一塁、${outs}アウトのためバントで進塁を狙います`;
        }
        return 'バントで確実に進塁させます';
      
      case 'steal':
        if (runners.first) {
          return '盗塁成功率が高いと判断しました';
        }
        return '盗塁を試みます';
      
      case 'hit_and_run':
        if (runners.first) {
          return 'エンドランで進塁と安打を狙います';
        }
        return 'エンドランを実行します';
      
      case 'squeeze':
        if (runners.third && outs < 2) {
          return `${currentInning}回、${outs}アウトでスクイズが有効と判断しました`;
        }
        return 'スクイズで得点を狙います';
      
      case 'double_steal':
        return 'ダブルスチールで複数の進塁を狙います';
      
      default:
        return 'AIが最適と判断した指示です';
    }
  }

  /**
   * 守備指示の理由を生成
   */
  private generateDefensiveInstructionReason(
    instruction: DefensiveInstruction | null,
    gameState: GameState
  ): string {
    if (!instruction || instruction === 'normal') {
      return '通常守備で臨みます';
    }

    switch (instruction) {
      case 'pitcher_change':
        return '投手の疲労を考慮して交代します';
      
      case 'intentional_walk':
        return '強打者を避けて次打者との勝負を選びます';
      
      case 'defensive_shift':
        return '打者の傾向に応じてシフトを適用します';
      
      default:
        return 'AIが最適と判断した守備指示です';
    }
  }

  /**
   * シフトの理由を生成
   */
  private generateShiftReason(shift: DefensiveShift, gameState: GameState): string {
    switch (shift) {
      case 'normal':
        return '通常守備が適切と判断しました';
      
      case 'pull_right':
        return '左打者の引っ張り傾向に対応した右打ちシフトを適用します';
      
      case 'pull_left':
        return '右打者の引っ張り傾向に対応した左打ちシフトを適用します';
      
      case 'extreme_shift':
        return '強打者に対して極端シフトを適用します';
      
      case 'infield_in':
        return '三塁ランナーを本塁で刺すため前進守備を指示します';
      
      case 'infield_back':
        return '長打を阻止するため深守備を指示します';
      
      default:
        return 'AIが最適と判断したシフトです';
    }
  }

  /**
   * 信頼度を計算
   */
  private calculateConfidence(
    instruction: OffensiveInstruction,
    gameState: GameState
  ): 'high' | 'medium' | 'low' {
    const { runners, outs, score, isPlayerHome } = gameState;
    
    // 明確な状況での信頼度は高い
    if (instruction === 'bunt' && runners.first && outs < 2) {
      return 'high';
    }

    if (instruction === 'squeeze' && runners.third && outs < 2) {
      return 'medium';
    }

    // 接戦での盗塁は中程度
    const scoreDiff = Math.abs(score.home - score.away);
    if (instruction === 'steal' && scoreDiff <= 2) {
      return 'medium';
    }

    // その他は低め
    return 'low';
  }

  /**
   * AI委譲の成功を記録
   * AC 89: 使用統計を記録
   */
  recordSuccess(): void {
    this.statistics.successCount++;
  }

  /**
   * AI委譲の失敗を記録
   */
  recordFailure(): void {
    this.statistics.failureCount++;
  }

  /**
   * 統計を取得
   * AC 90: 統計を確認
   */
  getStatistics(): AIDelegateStatistics {
    return { ...this.statistics };
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<AIDelegateConfig>): void {
    this.config = { ...this.config, ...config };
    
    // CPUAIの難易度を更新
    if (config.cpuDifficulty) {
      this.cpuAI = new CPUAIEngine({
        difficulty: config.cpuDifficulty,
        thinkingTimeMs: 500,
      });
    }
  }
}

/**
 * グローバルAI委譲インスタンス
 */
let globalAIDelegate: AIDelegateEngine | null = null;

/**
 * AI委譲エンジンを初期化
 */
export function initializeAIDelegate(config?: AIDelegateConfig): void {
  const defaultConfig: AIDelegateConfig = {
    mode: 'off',
    aggressiveness: 'standard',
    cpuDifficulty: 'intermediate',
  };
  
  globalAIDelegate = new AIDelegateEngine(config || defaultConfig);
}

/**
 * AI委譲エンジンを取得
 */
export function getAIDelegate(): AIDelegateEngine {
  if (!globalAIDelegate) {
    initializeAIDelegate();
  }
  return globalAIDelegate!;
}
