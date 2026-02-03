import { OffensiveInstruction, DefensiveInstruction, RunnerState } from '../types';

/**
 * 入力検証エラーの型
 */
export interface ValidationError {
  code: string;
  message: string;
  suggestion?: string;
}

export interface OffensiveInstructionContext {
  strikes?: number;
  runnerSpeed?: number;
  runnerName?: string;
}

/**
 * 攻撃指示の検証
 * タスク11.1: 入力エラー対応
 * 
 * Requirement 7 AC 1-5:
 * - 無効指示の理由説明
 * - 適切な選択肢の再提示
 */
export function validateOffensiveInstruction(
  instruction: OffensiveInstruction,
  runners: RunnerState,
  outs: number,
  context?: OffensiveInstructionContext
): ValidationError | null {
  // バントの検証
  if (instruction === 'bunt') {
    if ((context?.strikes ?? 0) >= 2) {
      return {
        code: 'BUNT_TWO_STRIKES',
        message: '2ストライクでのバントはファウル三振のリスクがあります',
        suggestion: '通常打撃へ切り替えることも検討してください',
      };
    }
    if (outs === 2) {
      return {
        code: 'BUNT_TWO_OUTS',
        message: 'ツーアウトでのバントは推奨されません',
        suggestion: '通常打撃で勝負するか、他の戦術を選択してください',
      };
    }
  }

  // 盗塁の検証
  if (instruction === 'steal') {
    if (!runners.first && !runners.second && !runners.third) {
      return {
        code: 'STEAL_NO_RUNNERS',
        message: '盗塁を試みる走者がいません',
        suggestion: 'ランナーが塁上にいる時のみ盗塁できます',
      };
    }
    if (context?.runnerSpeed !== undefined && context.runnerSpeed < 40) {
      const runnerName = context.runnerName ?? '走者';
      return {
        code: 'STEAL_LOW_SPEED',
        message: `${runnerName}は走力が低く盗塁のリスクが高いです`,
        suggestion: '失敗の可能性を考慮して判断してください',
      };
    }
    if (outs === 2) {
      return {
        code: 'STEAL_TWO_OUTS',
        message: 'ツーアウトでの盗塁はリスクが高いです',
        suggestion: '本当に実行しますか？',
      };
    }
  }

  // ダブルスチールの検証
  if (instruction === 'double_steal') {
    const runnerCount = [runners.first, runners.second, runners.third].filter(r => r !== null).length;
    if (runnerCount < 2) {
      return {
        code: 'DOUBLE_STEAL_NOT_ENOUGH_RUNNERS',
        message: 'ダブルスチールには複数の走者が必要です',
        suggestion: '一塁と三塁、または一塁と二塁に走者が必要です',
      };
    }
    if (outs === 2) {
      return {
        code: 'DOUBLE_STEAL_TWO_OUTS',
        message: 'ツーアウトでのダブルスチールは非常にリスクが高いです',
        suggestion: '通常打撃や盗塁を検討してください',
      };
    }
  }

  // ヒットエンドランの検証
  if (instruction === 'hit_and_run') {
    if (!runners.first && !runners.second) {
      return {
        code: 'HIT_AND_RUN_NO_RUNNERS',
        message: 'ヒットエンドランを試みる走者がいません',
        suggestion: '一塁または二塁に走者が必要です',
      };
    }
  }

  // スクイズの検証
  if (instruction === 'squeeze') {
    if (!runners.third) {
      return {
        code: 'SQUEEZE_NO_THIRD_RUNNER',
        message: 'スクイズには三塁走者が必要です',
        suggestion: '三塁に走者がいる時のみスクイズできます',
      };
    }
    if (outs === 2) {
      return {
        code: 'SQUEEZE_TWO_OUTS',
        message: 'ツーアウトでのスクイズは推奨されません',
        suggestion: '通常打撃で勝負するか、他の戦術を選択してください',
      };
    }
  }

  // 検証成功
  return null;
}

/**
 * 守備指示の検証
 */
export function validateDefensiveInstruction(
  instruction: DefensiveInstruction,
  availablePitchers: number,
  currentPitchCount: number
): ValidationError | null {
  // 投手交代の検証
  if (instruction === 'pitcher_change') {
    if (availablePitchers <= 0) {
      return {
        code: 'NO_AVAILABLE_PITCHERS',
        message: '交代可能な投手がいません',
        suggestion: '現在の投手で続行してください',
      };
    }
    if (currentPitchCount < 30) {
      return {
        code: 'EARLY_PITCHER_CHANGE',
        message: '投手の球数が少ない段階での交代です',
        suggestion: '本当に交代しますか？',
      };
    }
  }

  // 敬遠の検証
  if (instruction === 'intentional_walk') {
    // 追加の検証ロジック（状況に応じて）
  }

  // 検証成功
  return null;
}

/**
 * エラーメッセージを表示用にフォーマット
 */
export function formatValidationError(error: ValidationError): string {
  let message = `❌ ${error.message}`;
  if (error.suggestion) {
    message += `\n💡 ${error.suggestion}`;
  }
  return message;
}

/**
 * 警告レベルの判定
 */
export function getErrorSeverity(error: ValidationError): 'error' | 'warning' {
  // エラーコードに基づいて重大度を判定
  const blockingErrors = [
    'STEAL_NO_RUNNERS',
    'DOUBLE_STEAL_NOT_ENOUGH_RUNNERS',
    'HIT_AND_RUN_NO_RUNNERS',
    'SQUEEZE_NO_THIRD_RUNNER',
    'NO_AVAILABLE_PITCHERS',
  ];

  return blockingErrors.includes(error.code) ? 'error' : 'warning';
}
