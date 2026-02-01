import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  judgeBunt,
  judgeSqueeze,
  determineBuntFielder,
  processBuntDefensive,
  BuntType,
  BuntDirection,
  BuntStrength,
} from '../buntEngine';
import { PlayerInGame, RunnerState, Runner } from '../../types';

// モック選手データの作成ヘルパー
function createMockBatter(overrides?: Partial<PlayerInGame>): PlayerInGame {
  return {
    id: 'batter1',
    name: '打者',
    teamId: 'team1',
    position: 'CF',
    batterHand: 'right',
    condition: 'normal',
    fatigue: 'fresh',
    batting: {
      contact: 60,
      babip: 60,
      gapPower: 50,
      hrPower: 40,
      eye: 50,
      avoidKs: 60,
      vsLHP: 50,
      vsRHP: 50,
    },
    running: {
      speed: 70,
      stealingAbility: 60,
      stealingAggr: 50,
      baserunning: 65,
    },
    fielding: {
      infieldRange: 50,
      outfieldRange: 70,
      infieldError: 80,
      outfieldError: 85,
      infieldArm: 60,
      outfieldArm: 70,
      turnDP: 50,
      sacrificeBunt: 70,
      buntForHit: 60,
      positionRatings: {},
    },
    ...overrides,
  } as PlayerInGame;
}

function createMockPitcher(overrides?: Partial<PlayerInGame>): PlayerInGame {
  return {
    id: 'pitcher1',
    name: '投手',
    teamId: 'team2',
    position: 'P',
    batterHand: 'right',
    pitcherHand: 'right',
    condition: 'normal',
    fatigue: 'fresh',
    batting: {
      contact: 30,
      babip: 30,
      gapPower: 20,
      hrPower: 10,
      eye: 30,
      avoidKs: 30,
      vsLHP: 30,
      vsRHP: 30,
    },
    pitching: {
      stuff: 70,
      movement: 65,
      control: 60,
      stamina: 70,
      groundBallPct: 55,
      velocity: 75,
      holdRunners: 50,
    },
    running: {
      speed: 30,
      stealingAbility: 20,
      stealingAggr: 10,
      baserunning: 30,
    },
    fielding: {
      infieldRange: 60,
      outfieldRange: 30,
      infieldError: 70,
      outfieldError: 50,
      infieldArm: 50,
      outfieldArm: 30,
      turnDP: 40,
      sacrificeBunt: 40,
      buntForHit: 20,
      positionRatings: { P: 'A' },
    },
    ...overrides,
  } as PlayerInGame;
}

describe('buntEngine - タスク5: バント/スクイズ判定', () => {
  beforeEach(() => {
    // 乱数をリセット
    vi.spyOn(Math, 'random');
  });

  describe('5.1 バント打球の方向と処理', () => {
    it('犠打バントが成功する', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 80 } 
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      // 成功するように乱数を設定
      vi.spyOn(Math, 'random').mockReturnValue(0.3); // 30% -> 成功

      const result = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 0);

      expect(result.success).toBe(true);
      expect(result.buntBallInfo).toBeDefined();
      expect(result.description).toContain('バント');
    });

    it('左打者はバント打球が一塁線沿いに転がりやすい', () => {
      const batter = createMockBatter({ 
        batterHand: 'left',
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 80 }
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      // 複数回テストして方向の分布を確認
      const directions: BuntDirection[] = [];
      for (let i = 0; i < 100; i++) {
        const result = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 0);
        if (result.success && result.buntBallInfo) {
          directions.push(result.buntBallInfo.direction);
        }
      }

      // 左打者は一塁線沿いが最も多いはず（統計的に）
      const firstBaseLineCount = directions.filter(d => d === 'first_base_line').length;
      expect(firstBaseLineCount).toBeGreaterThan(30); // 50%の確率なので30回以上は期待
    });

    it('右打者はバント打球が三塁線沿いに転がりやすい', () => {
      const batter = createMockBatter({ 
        batterHand: 'right',
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 80 }
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      const directions: BuntDirection[] = [];
      for (let i = 0; i < 100; i++) {
        const result = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 0);
        if (result.success && result.buntBallInfo) {
          directions.push(result.buntBallInfo.direction);
        }
      }

      // 右打者は三塁線沿いが最も多いはず
      const thirdBaseLineCount = directions.filter(d => d === 'third_base_line').length;
      expect(thirdBaseLineCount).toBeGreaterThan(25); // 40%の確率なので25回以上は期待
    });

    it('バント打球の強さが決定される', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 80 }
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      vi.spyOn(Math, 'random').mockReturnValue(0.3);

      const result = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 0);

      expect(result.success).toBe(true);
      expect(result.buntBallInfo?.strength).toMatch(/very_weak|weak|medium/);
    });

    it('バント打球方向に応じた担当守備選手が特定される', () => {
      // 三塁線沿い
      const thirdBaseLine = determineBuntFielder({
        direction: 'third_base_line',
        strength: 'weak',
        buntType: 'sacrifice',
      });
      expect(thirdBaseLine.primaryPosition).toBe('3B');
      expect(thirdBaseLine.assistPosition).toBe('P');

      // 投手正面
      const pitcherFront = determineBuntFielder({
        direction: 'pitcher_front',
        strength: 'weak',
        buntType: 'sacrifice',
      });
      expect(pitcherFront.primaryPosition).toBe('P');
      expect(pitcherFront.assistPosition).toBe('C');

      // 投手正面（非常に弱い打球）
      const pitcherFrontWeak = determineBuntFielder({
        direction: 'pitcher_front',
        strength: 'very_weak',
        buntType: 'sacrifice',
      });
      expect(pitcherFrontWeak.primaryPosition).toBe('C');

      // 一塁線沿い
      const firstBaseLine = determineBuntFielder({
        direction: 'first_base_line',
        strength: 'weak',
        buntType: 'sacrifice',
      });
      expect(firstBaseLine.primaryPosition).toBe('1B');
      expect(firstBaseLine.assistPosition).toBe('P');
    });
  });

  describe('5.2 犠打バントと進塁判定', () => {
    it('犠打バント成功時に打者がアウトになり走者が進塁する', () => {
      const batter = createMockBatter({ running: { ...createMockBatter().running, speed: 40 } });
      const fielder = createMockPitcher({ 
        position: '3B',
        fielding: { ...createMockPitcher().fielding, infieldRange: 80, infieldArm: 80 }
      });
      const runners: RunnerState = {
        first: { playerId: 'runner1', playerName: '走者1' },
        second: null,
        third: null,
      };

      const buntBallInfo = {
        direction: 'third_base_line' as BuntDirection,
        strength: 'weak' as BuntStrength,
        buntType: 'sacrifice' as BuntType,
      };

      // 捕球成功（0.5 * 80 / 100 = 0.4 < 0.6なので成功）、
      // 一塁送球を選択（0.3 < 0.7なので一塁）、
      // 送球成功（打者が遅く守備が優秀なので高確率でアウト）
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)  // 捕球成功
        .mockReturnValueOnce(0.3)  // 一塁送球を選択
        .mockReturnValueOnce(0.3); // 送球成功（75%+補正で高確率）

      const result = processBuntDefensive(buntBallInfo, batter, fielder, undefined, runners, 0);

      expect(result.batterOut).toBe(true);
      expect(result.runnersAdvanced.some(r => r.from === 'batter' && r.to === 'out')).toBe(true);
      expect(result.runnersAdvanced.some(r => r.from === 'first' && r.to === 'second')).toBe(true);
    });

    it('守備選手が打球に追いつけない場合はセーフティバント成功', () => {
      const batter = createMockBatter();
      const fielder = createMockPitcher({ 
        position: '1B',
        fielding: { ...createMockPitcher().fielding, infieldRange: 30 } // 守備範囲が狭い
      });
      const runners: RunnerState = { first: null, second: null, third: null };

      const buntBallInfo = {
        direction: 'first_base_line' as BuntDirection,
        strength: 'medium' as BuntStrength,
        buntType: 'safety' as BuntType,
      };

      vi.spyOn(Math, 'random').mockReturnValue(0.9); // 捕球失敗

      const result = processBuntDefensive(buntBallInfo, batter, fielder, undefined, runners, 0);

      expect(result.batterOut).toBe(false);
      expect(result.batterReachedBase).toBe(true);
    });

    it('守備選手が一塁を狙う場合', () => {
      const batter = createMockBatter({ running: { ...createMockBatter().running, speed: 40 } });
      const fielder = createMockPitcher({ 
        position: 'P',
        fielding: { ...createMockPitcher().fielding, infieldRange: 80, infieldArm: 80 }
      });
      const runners: RunnerState = {
        first: { playerId: 'runner1', playerName: '走者1' },
        second: null,
        third: null,
      };

      const buntBallInfo = {
        direction: 'pitcher_front' as BuntDirection,
        strength: 'weak' as BuntStrength,
        buntType: 'sacrifice' as BuntType,
      };

      // 捕球成功、一塁を狙う、送球成功
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)  // 捕球成功
        .mockReturnValueOnce(0.4)  // 一塁を狙う（0.7より小さい）
        .mockReturnValueOnce(0.3); // 送球成功

      const result = processBuntDefensive(buntBallInfo, batter, fielder, undefined, runners, 0);

      // 一塁を狙う場合は打者アウト
      expect(result.batterOut).toBe(true);
    });
  });

  describe('5.3 スクイズの判定', () => {
    it('スクイズが成功して三塁走者が生還する', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 80 }
      });
      const pitcher = createMockPitcher();
      const thirdRunner: Runner = { playerId: 'runner3', playerName: '走者3' };
      const runnerPlayer = createMockBatter({ 
        running: { ...createMockBatter().running, speed: 80, baserunning: 75 }
      });

      // バント成功、走者本塁到達成功
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // バント成功（70%程度の成功率）
        .mockReturnValueOnce(0.5)  // 方向決定
        .mockReturnValueOnce(0.3)  // 強さ決定
        .mockReturnValueOnce(0.4); // 走者本塁到達成功（高い成功率）

      const result = judgeSqueeze(batter, pitcher, thirdRunner, runnerPlayer, 0, 0);

      expect(result.success).toBe(true);
      expect(result.runnerSafe).toBe(true);
      expect(result.description).toContain('スクイズ成功');
    });

    it('スクイズでバントは成功するが走者が本塁でアウトになる', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 80 }
      });
      const pitcher = createMockPitcher({ pitching: { ...createMockPitcher().pitching!, control: 40, stuff: 40 } });
      const thirdRunner: Runner = { playerId: 'runner3', playerName: '走者3' };
      const runnerPlayer = createMockBatter({ 
        running: { ...createMockBatter().running, speed: 30, baserunning: 30 } // 走力が非常に低い
      });

      // バント成功、走者本塁到達失敗
      // 成功率計算: baseRate(70) + abilityBonus((80-50)*0.4=12) + pitcherPenalty((40-50)*-0.2=2) = 84%
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // バント成功（84%なので0.3で成功）
        .mockReturnValueOnce(0.5)  // 方向決定
        .mockReturnValueOnce(0.3)  // 強さ決定
        .mockReturnValueOnce(0.98); // 走者本塁到達失敗（低い成功率で高い乱数なので失敗）

      const result = judgeSqueeze(batter, pitcher, thirdRunner, runnerPlayer, 0, 0);

      expect(result.success).toBe(true);
      expect(result.runnerSafe).toBe(false);
      expect(result.description).toContain('本塁でアウト');
    });

    it('スクイズでバント失敗時は走者も失敗扱い', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 20 } // バント能力が非常に低い
      });
      const pitcher = createMockPitcher({ pitching: { ...createMockPitcher().pitching!, control: 80, stuff: 80 } });
      const thirdRunner: Runner = { playerId: 'runner3', playerName: '走者3' };
      const runnerPlayer = createMockBatter();

      // バント失敗（能力が非常に低く投手が優秀なので失敗しやすい）
      // 成功率計算: baseRate(70) + abilityBonus((20-50)*0.4=-12) + pitcherPenalty((80-50)*-0.2=-6) = 52%
      vi.spyOn(Math, 'random').mockReturnValue(0.99); // 非常に高い乱数で確実に失敗

      const result = judgeSqueeze(batter, pitcher, thirdRunner, runnerPlayer, 0, 0);

      expect(result.success).toBe(false);
      expect(result.runnerSafe).toBe(false);
    });

    it('走者の走力が高いほどスクイズ成功率が上がる', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 80 }
      });
      const pitcher = createMockPitcher();
      const thirdRunner: Runner = { playerId: 'runner3', playerName: '走者3' };

      // 走力が高い走者
      const fastRunner = createMockBatter({ 
        running: { ...createMockBatter().running, speed: 90, baserunning: 85 }
      });

      // 走力が低い走者
      const slowRunner = createMockBatter({ 
        running: { ...createMockBatter().running, speed: 30, baserunning: 35 }
      });

      let fastSuccess = 0;
      let slowSuccess = 0;

      // 100回試行
      for (let i = 0; i < 100; i++) {
        // 新しいモックを作成
        vi.restoreAllMocks();
        
        const fastResult = judgeSqueeze(batter, pitcher, thirdRunner, fastRunner, 0, 0);
        if (fastResult.success && fastResult.runnerSafe) {
          fastSuccess++;
        }

        const slowResult = judgeSqueeze(batter, pitcher, thirdRunner, slowRunner, 0, 0);
        if (slowResult.success && slowResult.runnerSafe) {
          slowSuccess++;
        }
      }

      // 走力が高い走者の方が成功率が高いはず
      expect(fastSuccess).toBeGreaterThan(slowSuccess);
    });
  });

  describe('5.4 バント失敗の処理', () => {
    it('バント失敗でファウルになる', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 30 } // 能力が低い
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      // 失敗、ファウル
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9)  // バント失敗
        .mockReturnValueOnce(0.3); // ファウル

      const result = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 0);

      expect(result.success).toBe(false);
      expect(result.isFoul).toBe(true);
      expect(result.description).toContain('ファウル');
    });

    it('2ストライク時のバントファウルで三振になる', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 30 }
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      // 失敗、2ストライク時のファウル
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9)  // バント失敗
        .mockReturnValueOnce(0.3); // ファウル（2ストライク時は三振）

      const result = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 2);

      expect(result.success).toBe(false);
      expect(result.isFoul).toBe(true);
      expect(result.isStrikeout).toBe(true);
      expect(result.description).toContain('三振');
    });

    it('バント失敗で空振りになる', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 30 }
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      // 失敗、空振り
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9)  // バント失敗
        .mockReturnValueOnce(0.6); // 空振り

      const result = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 0);

      expect(result.success).toBe(false);
      expect(result.isFoul).toBe(false);
      expect(result.description).toContain('空振り');
    });

    it('バント失敗で打ち損じの小フライになる', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 30 }
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      // 失敗、打ち損じ
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9)  // バント失敗
        .mockReturnValueOnce(0.8); // 打ち損じ

      const result = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 0);

      expect(result.success).toBe(false);
      expect(result.isPopup).toBe(true);
      expect(result.description).toContain('小フライ');
    });

    it('2ストライク時はバント成功率が低下する', () => {
      const batter = createMockBatter({ 
        fielding: { ...createMockBatter().fielding, sacrificeBunt: 70 }
      });
      const pitcher = createMockPitcher();
      const runners: RunnerState = { first: null, second: null, third: null };

      let normalSuccess = 0;
      let twoStrikesSuccess = 0;

      // 100回試行
      for (let i = 0; i < 100; i++) {
        vi.restoreAllMocks();
        
        const normalResult = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 0);
        if (normalResult.success) {
          normalSuccess++;
        }

        const twoStrikesResult = judgeBunt(batter, pitcher, 'sacrifice', runners, 0, 2);
        if (twoStrikesResult.success) {
          twoStrikesSuccess++;
        }
      }

      // 2ストライク時は成功率が低いはず
      expect(normalSuccess).toBeGreaterThan(twoStrikesSuccess);
    });
  });
});
