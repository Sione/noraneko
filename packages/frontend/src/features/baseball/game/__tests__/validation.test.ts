import { describe, it, expect } from 'vitest';
import { validateOffensiveInstruction, getErrorSeverity } from '../validation';
import type { RunnerState } from '../../types';

describe('攻撃指示の検証 - タスク2.3', () => {
  it('バントが2ストライクの場合に警告を返す', () => {
    const runners: RunnerState = { first: null, second: null, third: null };
    const error = validateOffensiveInstruction('bunt', runners, 0, { strikes: 2 });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('BUNT_TWO_STRIKES');
    expect(getErrorSeverity(error!)).toBe('warning');
  });

  it('走力が低い場合の盗塁に警告を返す', () => {
    const runners: RunnerState = {
      first: { playerId: 'runner-1', playerName: '鈍足' },
      second: null,
      third: null,
    };
    const error = validateOffensiveInstruction('steal', runners, 0, {
      runnerSpeed: 30,
      runnerName: '鈍足',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('STEAL_LOW_SPEED');
    expect(getErrorSeverity(error!)).toBe('warning');
  });
});
