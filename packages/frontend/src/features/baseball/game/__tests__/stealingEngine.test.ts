import { describe, it, expect, beforeEach } from 'vitest';
import {
  judgeSteal,
  judgeDoubleSteal,
  judgeHitAndRun,
  judgePickoff,
  canSteal,
  canDoubleSteal,
  canHitAndRun
} from '../stealingEngine';
import { PlayerInGame, RunnerState, Runner } from '../../types';

describe('stealingEngine', () => {
  let runner: Runner;
  let runnerPlayer: PlayerInGame;
  let pitcher: PlayerInGame;
  let catcher: PlayerInGame;
  let infielders: PlayerInGame[];

  beforeEach(() => {
    runner = {
      playerId: 'runner1',
      playerName: '走者太郎'
    };

    runnerPlayer = {
      id: 'runner1',
      name: '走者太郎',
      teamId: 'test-team',
      position: 'CF',
      batterHand: 'right',
      pitcherHand: undefined,
      condition: 'normal',
      fatigue: 'normal',
      batting: {
        contact: 60,
        babip: 55,
        gapPower: 55,
        hrPower: 55,
        eye: 50,
        avoidKs: 60,
        vsLHP: 60,
        vsRHP: 60
      },
      pitching: undefined,
      fielding: {
        infieldRange: 60,
        outfieldRange: 70,
        infieldError: 75,
        outfieldError: 80,
        infieldArm: 60,
        outfieldArm: 70,
        turnDP: 60,
        catcherAbility: undefined,
        catcherArm: undefined,
        sacrificeBunt: 50,
        buntForHit: 50,
        positionRatings: {
          CF: 'B' as const
        }
      },
      running: {
        speed: 80,
        baserunning: 75,
        stealingAbility: 75,
        stealingAggr: 70
      }
    };

    pitcher = {
      id: 'pitcher1',
      name: '投手一郎',
      teamId: 'test-team',
      position: 'P',
      batterHand: 'right',
      pitcherHand: 'right',
      condition: 'normal',
      fatigue: 'normal',
      batting: {
        contact: 30,
        babip: 25,
        gapPower: 20,
        hrPower: 20,
        eye: 25,
        avoidKs: 30,
        vsLHP: 30,
        vsRHP: 30
      },
      pitching: {
        stuff: 75,
        velocity: 75,
        control: 70,
        movement: 68,
        stamina: 80,
        groundBallPct: 55,
        holdRunners: 65
      },
      fielding: {
        infieldRange: 60,
        outfieldRange: 50,
        infieldError: 70,
        outfieldError: 60,
        infieldArm: 55,
        outfieldArm: 50,
        turnDP: 55,
        catcherAbility: undefined,
        catcherArm: undefined,
        sacrificeBunt: 40,
        buntForHit: 35,
        positionRatings: {
          P: 'B' as const
        }
      },
      running: {
        speed: 40,
        baserunning: 35,
        stealingAbility: 20,
        stealingAggr: 10
      }
    };

    catcher = {
      id: 'catcher1',
      name: '捕手二郎',
      teamId: 'test-team',
      position: 'C',
      batterHand: 'right',
      pitcherHand: undefined,
      condition: 'normal',
      fatigue: 'normal',
      batting: {
        contact: 55,
        babip: 52,
        gapPower: 60,
        hrPower: 60,
        eye: 52,
        avoidKs: 58,
        vsLHP: 55,
        vsRHP: 55
      },
      pitching: undefined,
      fielding: {
        infieldRange: 60,
        outfieldRange: 50,
        infieldError: 75,
        outfieldError: 60,
        infieldArm: 80,
        outfieldArm: 50,
        turnDP: 65,
        catcherAbility: 75,
        catcherArm: 80,
        sacrificeBunt: 50,
        buntForHit: 45,
        positionRatings: {
          C: 'B' as const
        }
      },
      running: {
        speed: 45,
        baserunning: 50,
        stealingAbility: 30,
        stealingAggr: 25
      }
    };

    infielders = [
      {
        id: 'second_base',
        name: '二塁手',
        teamId: 'test-team',
        position: '2B',
        batterHand: 'right',
        pitcherHand: undefined,
        condition: 'normal',
        fatigue: 'normal',
        batting: {
          contact: 60,
          babip: 55,
          gapPower: 50,
          hrPower: 50,
          eye: 55,
          avoidKs: 62,
          vsLHP: 60,
          vsRHP: 60
        },
        pitching: undefined,
        fielding: {
          infieldRange: 72,
          outfieldRange: 50,
          infieldError: 75,
          outfieldError: 60,
          infieldArm: 68,
          outfieldArm: 50,
          turnDP: 70,
          catcherAbility: undefined,
          catcherArm: undefined,
          sacrificeBunt: 55,
          buntForHit: 50,
          positionRatings: {
            '2B': 'B' as const
          }
        },
        running: {
          speed: 65,
          baserunning: 60,
          stealingAbility: 50,
          stealingAggr: 40
        }
      }
    ];
  });

  describe('7.1 盗塁の試行判定', () => {
    it('走者・投手・捕手能力で成功率を計算する', () => {
      // 高い盗塁能力の走者
      const result = judgeSteal(runner, 'first', runnerPlayer, pitcher, catcher, infielders);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('runner');
      expect(result).toHaveProperty('targetBase');
      expect(result).toHaveProperty('caughtStealing');
      expect(result).toHaveProperty('commentary');
      expect(result.targetBase).toBe('second');
      expect(result.runner).toBe(runner);
    });

    it('盗塁能力が高い走者は成功率が高い', () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        const result = judgeSteal(runner, 'first', runnerPlayer, pitcher, catcher, infielders);
        results.push(result.success);
      }
      const successRate = results.filter(s => s).length / results.length;
      expect(successRate).toBeGreaterThan(0.3); // 少なくとも30%以上の成功率
    });

    it('盗塁能力が低い走者は成功率が低い', () => {
      const slowRunner = {
        ...runnerPlayer,
        running: {
          speed: 40,
          baserunning: 35,
          stealingAbility: 30,
          stealingAggr: 25
        }
      };

      const results = [];
      for (let i = 0; i < 100; i++) {
        const result = judgeSteal(runner, 'first', slowRunner, pitcher, catcher, infielders);
        results.push(result.success);
      }
      const successRate = results.filter(s => s).length / results.length;
      expect(successRate).toBeLessThan(0.5); // 50%未満の成功率
    });

    it('三塁盗塁は二塁盗塁より難しい', () => {
      const secondStealResults = [];
      const thirdStealResults = [];

      // より多くの試行で統計的に確実にする
      for (let i = 0; i < 500; i++) {
        const secondResult = judgeSteal(runner, 'first', runnerPlayer, pitcher, catcher, infielders);
        secondStealResults.push(secondResult.success);

        const thirdResult = judgeSteal(runner, 'second', runnerPlayer, pitcher, catcher, infielders);
        thirdStealResults.push(thirdResult.success);
      }

      const secondSuccessRate = secondStealResults.filter(s => s).length / secondStealResults.length;
      const thirdSuccessRate = thirdStealResults.filter(s => s).length / thirdStealResults.length;

      // 三塁盗塁の成功率は二塁盗塁より低いか、ほぼ同じ
      expect(thirdSuccessRate).toBeLessThanOrEqual(secondSuccessRate + 0.05); // 誤差5%許容
    });

    it('塁上守備選手の能力が影響する', () => {
      const weakInfielder = [{
        ...infielders[0],
        fielding: {
          infieldRange: 40,
          outfieldRange: 35,
          infieldError: 50,
          outfieldError: 50,
          infieldArm: 40,
          outfieldArm: 50,
          turnDP: 40,
          catcherAbility: undefined,
          catcherArm: undefined,
          sacrificeBunt: 50,
          buntForHit: 45,
          positionRatings: {
            '2B': 'D' as const
          }
        }
      }];

      const strongInfielder = [{
        ...infielders[0],
        fielding: {
          infieldRange: 90,
          outfieldRange: 85,
          infieldError: 95,
          outfieldError: 90,
          infieldArm: 88,
          outfieldArm: 50,
          turnDP: 90,
          catcherAbility: undefined,
          catcherArm: undefined,
          sacrificeBunt: 70,
          buntForHit: 65,
          positionRatings: {
            '2B': 'A' as const
          }
        }
      }];

      const weakResults = [];
      const strongResults = [];

      for (let i = 0; i < 50; i++) {
        weakResults.push(judgeSteal(runner, 'first', runnerPlayer, pitcher, catcher, weakInfielder).success);
        strongResults.push(judgeSteal(runner, 'first', runnerPlayer, pitcher, catcher, strongInfielder).success);
      }

      const weakSuccessRate = weakResults.filter(s => s).length / weakResults.length;
      const strongSuccessRate = strongResults.filter(s => s).length / strongResults.length;

      expect(weakSuccessRate).toBeGreaterThan(strongSuccessRate);
    });
  });

  describe('7.2 盗塁結果とダブルスチール', () => {
    it('ダブルスチールの送球選択と結果を評価する', () => {
      const runners: RunnerState = {
        first: { playerId: 'r1', playerName: '走者1' },
        second: { playerId: 'r2', playerName: '走者2' },
        third: null
      };

      const runnerPlayers = {
        first: runnerPlayer,
        second: { ...runnerPlayer, id: 'r2', name: '走者2' }
      };

      const result = judgeDoubleSteal(runners, runnerPlayers, pitcher, catcher, infielders);

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('throwTarget');
      expect(result).toHaveProperty('commentary');
      expect(result.results).toHaveLength(2);
      expect(result.throwTarget).toBeOneOf(['second', 'third', 'home']);
    });

    it('後ろの塁を優先的に守る', () => {
      const runners: RunnerState = {
        first: { playerId: 'r1', playerName: '走者1' },
        second: null,
        third: { playerId: 'r3', playerName: '走者3' }
      };

      const runnerPlayers = {
        first: runnerPlayer,
        third: { ...runnerPlayer, id: 'r3', name: '走者3' }
      };

      const result = judgeDoubleSteal(runners, runnerPlayers, pitcher, catcher, infielders);

      // 三塁走者がいる場合は本塁を守る
      expect(result.throwTarget).toBe('home');
    });

    it('送球されなかった塁はほぼ確実に成功する', () => {
      const runners: RunnerState = {
        first: { playerId: 'r1', playerName: '走者1' },
        second: { playerId: 'r2', playerName: '走者2' },
        third: null
      };

      const runnerPlayers = {
        first: runnerPlayer,
        second: { ...runnerPlayer, id: 'r2', name: '走者2' }
      };

      const results = [];
      for (let i = 0; i < 50; i++) {
        const result = judgeDoubleSteal(runners, runnerPlayers, pitcher, catcher, infielders);
        results.push(result);
      }

      // 少なくとも1人は成功することが多い（80%以上の確率で）
      const atLeastOneSuccessCount = results.filter(r => r.results.some(rr => rr.success)).length;
      const successRate = atLeastOneSuccessCount / results.length;
      expect(successRate).toBeGreaterThan(0.7); // 70%以上の確率で少なくとも1人は成功
    });
  });

  describe('7.3 エンドラン判定', () => {
    it('打者結果に応じた走塁処理を行う', () => {
      const result = judgeHitAndRun(
        runner,
        'first',
        runnerPlayer,
        runnerPlayer, // 打者
        pitcher,
        catcher,
        infielders,
        'hit'
      );

      expect(result).toHaveProperty('stealAttempt');
      expect(result).toHaveProperty('battingResult');
      expect(result).toHaveProperty('commentary');
      expect(result.battingResult).toBe('hit');
    });

    it('ヒットの場合、エンドランが成功する', () => {
      const result = judgeHitAndRun(
        runner,
        'first',
        runnerPlayer,
        runnerPlayer,
        pitcher,
        catcher,
        infielders,
        'hit'
      );

      expect(result.commentary).toContain('ヒット');
      expect(result.commentary).toContain('エンドラン');
    });

    it('アウトの場合、エンドランが失敗する', () => {
      const result = judgeHitAndRun(
        runner,
        'first',
        runnerPlayer,
        runnerPlayer,
        pitcher,
        catcher,
        infielders,
        'out'
      );

      expect(result.commentary).toContain('アウト');
    });

    it('空振りの場合、通常の盗塁判定になる', () => {
      const result = judgeHitAndRun(
        runner,
        'first',
        runnerPlayer,
        runnerPlayer,
        pitcher,
        catcher,
        infielders,
        'swing_miss'
      );

      expect(result.commentary).toContain('空振り');
    });
  });

  describe('7.4 牽制プレイ判定', () => {
    it('牽制試行確率とリード幅評価を行う', () => {
      const results = [];
      for (let i = 0; i < 50; i++) {
        const result = judgePickoff(runner, 'first', runnerPlayer, pitcher, infielders);
        results.push(result.attempted);
      }

      const attemptRate = results.filter(a => a).length / results.length;
      // 牽制は時々試行される
      expect(attemptRate).toBeGreaterThan(0);
      expect(attemptRate).toBeLessThan(0.6);
    });

    it('牽制能力が高い投手は牽制を試みやすい', () => {
      const highHoldPitcher = {
        ...pitcher,
        pitching: {
          stuff: 75,
          velocity: 75,
          control: 70,
          movement: 68,
          stamina: 80,
          groundBallPct: 55,
          holdRunners: 90
        }
      };

      const results = [];
      for (let i = 0; i < 50; i++) {
        const result = judgePickoff(runner, 'first', runnerPlayer, highHoldPitcher, infielders);
        results.push(result.attempted);
      }

      const attemptRate = results.filter(a => a).length / results.length;
      expect(attemptRate).toBeGreaterThan(0.2);
    });

    it('牽制成功はレアである', () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        const result = judgePickoff(runner, 'first', runnerPlayer, pitcher, infielders);
        if (result.attempted) {
          results.push(result.success);
        }
      }

      if (results.length > 0) {
        const successRate = results.filter(s => s).length / results.length;
        expect(successRate).toBeLessThan(0.3); // 牽制成功率は低い
      }
    });

    it('走者がいない場合は牽制を試みない', () => {
      const result = judgePickoff(null, 'first', undefined, pitcher, infielders);

      expect(result.attempted).toBe(false);
      expect(result.success).toBe(false);
      expect(result.runner).toBeNull();
    });
  });

  describe('ユーティリティ関数', () => {
    it('canSteal: 走者がいる場合はtrue', () => {
      const runners: RunnerState = {
        first: { playerId: 'r1', playerName: '走者1' },
        second: null,
        third: null
      };

      expect(canSteal(runners)).toBe(true);
    });

    it('canSteal: 走者がいない場合はfalse', () => {
      const runners: RunnerState = {
        first: null,
        second: null,
        third: null
      };

      expect(canSteal(runners)).toBe(false);
    });

    it('canDoubleSteal: 走者が2人以上いる場合はtrue', () => {
      const runners: RunnerState = {
        first: { playerId: 'r1', playerName: '走者1' },
        second: { playerId: 'r2', playerName: '走者2' },
        third: null
      };

      expect(canDoubleSteal(runners)).toBe(true);
    });

    it('canDoubleSteal: 走者が1人以下の場合はfalse', () => {
      const runners: RunnerState = {
        first: { playerId: 'r1', playerName: '走者1' },
        second: null,
        third: null
      };

      expect(canDoubleSteal(runners)).toBe(false);
    });

    it('canHitAndRun: 一塁または二塁走者がいる場合はtrue', () => {
      const runners: RunnerState = {
        first: { playerId: 'r1', playerName: '走者1' },
        second: null,
        third: null
      };

      expect(canHitAndRun(runners)).toBe(true);
    });

    it('canHitAndRun: 三塁走者のみの場合はfalse', () => {
      const runners: RunnerState = {
        first: null,
        second: null,
        third: { playerId: 'r3', playerName: '走者3' }
      };

      expect(canHitAndRun(runners)).toBe(false);
    });
  });
});
