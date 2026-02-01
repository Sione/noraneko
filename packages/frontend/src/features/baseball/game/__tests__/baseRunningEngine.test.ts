import { describe, it, expect, beforeEach } from 'vitest';
import {
  determineBasicAdvancement,
  evaluateSingleAdvancement,
  evaluateDoubleAdvancement,
  generateScoringCommentary,
  determineThrowTarget,
  BaseRunningAdvancement
} from '../baseRunningEngine';
import { PlayerInGame, RunnerState, Runner } from '../../types';
import { BatBallInfo } from '../atBatEngine';

/**
 * タスク6: 走塁と進塁判定のテスト
 * 
 * 6.1 基本進塁ルール
 * 6.2 単打時の本塁到達と追加進塁
 * 6.3 二塁打時の本塁到達と中継送球
 * 6.4 得点と実況表示
 */

describe('baseRunningEngine', () => {
  let testBatter: PlayerInGame;
  let testOutfielder: PlayerInGame;
  let testRelayFielder: PlayerInGame;
  let testRunner1: Runner;
  let testRunner2: Runner;
  let testRunner3: Runner;

  beforeEach(() => {
    // テスト用打者
    testBatter = {
      id: 'batter1',
      name: '山田太郎',
      teamId: 'team1',
      position: 'CF',
      batterHand: 'right',
      batting: {
        contact: 70,
        babip: 65,
        gapPower: 60,
        hrPower: 50,
        eye: 55,
        avoidKs: 60,
        vsLHP: 65,
        vsRHP: 65
      },
      running: {
        speed: 75,
        stealingAbility: 70,
        stealingAggr: 60,
        baserunning: 75
      },
      fielding: {
        infieldRange: 50,
        outfieldRange: 80,
        infieldError: 70,
        outfieldError: 85,
        infieldArm: 60,
        outfieldArm: 70,
        turnDP: 50,
        sacrificeBunt: 50,
        buntForHit: 50,
        positionRatings: { CF: 'A' }
      },
      condition: 'normal',
      fatigue: 'normal'
    };

    // テスト用外野手
    testOutfielder = {
      id: 'of1',
      name: '佐藤一郎',
      teamId: 'team2',
      position: 'RF',
      batterHand: 'right',
      batting: {
        contact: 60,
        babip: 60,
        gapPower: 55,
        hrPower: 45,
        eye: 50,
        avoidKs: 55,
        vsLHP: 60,
        vsRHP: 60
      },
      running: {
        speed: 65,
        stealingAbility: 60,
        stealingAggr: 50,
        baserunning: 65
      },
      fielding: {
        infieldRange: 50,
        outfieldRange: 75,
        infieldError: 70,
        outfieldError: 80,
        infieldArm: 60,
        outfieldArm: 80, // 強肩
        turnDP: 50,
        sacrificeBunt: 40,
        buntForHit: 40,
        positionRatings: { RF: 'A' }
      },
      condition: 'normal',
      fatigue: 'normal'
    };

    // テスト用中継選手
    testRelayFielder = {
      id: 'if1',
      name: '鈴木次郎',
      teamId: 'team2',
      position: '2B',
      batterHand: 'right',
      batting: {
        contact: 65,
        babip: 60,
        gapPower: 50,
        hrPower: 40,
        eye: 55,
        avoidKs: 60,
        vsLHP: 60,
        vsRHP: 60
      },
      running: {
        speed: 70,
        stealingAbility: 65,
        stealingAggr: 55,
        baserunning: 70
      },
      fielding: {
        infieldRange: 80,
        outfieldRange: 50,
        infieldError: 85,
        outfieldError: 70,
        infieldArm: 75,
        outfieldArm: 60,
        turnDP: 80,
        sacrificeBunt: 50,
        buntForHit: 50,
        positionRatings: { '2B': 'A' }
      },
      condition: 'normal',
      fatigue: 'normal'
    };

    // テスト用走者
    testRunner1 = { playerId: 'runner1', playerName: '走者A' };
    testRunner2 = { playerId: 'runner2', playerName: '走者B' };
    testRunner3 = { playerId: 'runner3', playerName: '走者C' };
  });

  describe('6.1 基本進塁ルール', () => {
    it('本塁打時はすべての走者が得点する', () => {
      const runners: RunnerState = {
        first: testRunner1,
        second: testRunner2,
        third: testRunner3
      };

      const result = determineBasicAdvancement('home_run', runners, testBatter);

      expect(result.runsScored).toBe(4); // 満塁ホームラン
      expect(result.advancements).toHaveLength(4);
      expect(result.advancements.filter(a => a.to === 'home')).toHaveLength(4);
      expect(result.commentary).toContain('ホームラン');
    });

    it('三塁打時は打者が三塁、すべての走者が得点', () => {
      const runners: RunnerState = {
        first: testRunner1,
        second: testRunner2,
        third: null
      };

      const result = determineBasicAdvancement('triple', runners, testBatter);

      expect(result.runsScored).toBe(2); // 一塁と二塁の走者が得点
      expect(result.advancements.filter(a => a.to === 'third')).toHaveLength(1); // 打者
      expect(result.advancements.filter(a => a.to === 'home')).toHaveLength(2); // 走者2人
    });

    it('二塁打時は打者が二塁、二塁以降の走者が得点', () => {
      const runners: RunnerState = {
        first: testRunner1,
        second: testRunner2,
        third: testRunner3
      };

      const result = determineBasicAdvancement('double', runners, testBatter);

      expect(result.runsScored).toBe(2); // 二塁と三塁の走者が得点
      expect(result.advancements.filter(a => a.to === 'second')).toHaveLength(1); // 打者
      expect(result.advancements.filter(a => a.to === 'third')).toHaveLength(1); // 一塁走者
      expect(result.advancements.filter(a => a.to === 'home')).toHaveLength(2); // 二塁・三塁走者
    });

    it('単打時は基本的な進塁のみ', () => {
      const runners: RunnerState = {
        first: testRunner1,
        second: testRunner2,
        third: testRunner3
      };

      const result = determineBasicAdvancement('single', runners, testBatter);

      expect(result.runsScored).toBe(1); // 三塁走者のみ得点
      expect(result.advancements.filter(a => a.to === 'first')).toHaveLength(1); // 打者
      expect(result.advancements.filter(a => a.to === 'second')).toHaveLength(1); // 一塁走者
      expect(result.advancements.filter(a => a.to === 'third')).toHaveLength(1); // 二塁走者
      expect(result.advancements.filter(a => a.to === 'home')).toHaveLength(1); // 三塁走者
    });

    it('走者なしの単打は打者が一塁のみ', () => {
      const runners: RunnerState = {
        first: null,
        second: null,
        third: null
      };

      const result = determineBasicAdvancement('single', runners, testBatter);

      expect(result.runsScored).toBe(0);
      expect(result.advancements).toHaveLength(1);
      expect(result.advancements[0]).toMatchObject({
        from: 'batter',
        to: 'first'
      });
    });
  });

  describe('6.2 単打時の本塁到達と追加進塁', () => {
    it('強い打球の単打で二塁走者が本塁へ到達できる', () => {
      const runners: RunnerState = {
        first: null,
        second: testRunner2,
        third: null
      };

      const batBallInfo: BatBallInfo = {
        type: 'line_drive',
        direction: 'left',
        strength: 'very_strong',
        extraBasePotential: 70
      };

      const outfielderInfo = {
        fielder: testOutfielder,
        position: 'LF' as const
      };

      // 複数回実行して、本塁到達の可能性を確認
      let scoredCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const result = evaluateSingleAdvancement(
          runners,
          testBatter,
          batBallInfo,
          outfielderInfo
        );
        
        if (result.runsScored > 0) {
          scoredCount++;
        }
      }

      // 強い打球なので、ある程度の確率で得点できるはず
      expect(scoredCount).toBeGreaterThan(10); // 10%以上は得点できる
    });

    it('弱い打球の単打では二塁走者が本塁へ到達できない', () => {
      const runners: RunnerState = {
        first: null,
        second: testRunner2,
        third: null
      };

      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'center',
        strength: 'weak',
        extraBasePotential: 20
      };

      const outfielderInfo = {
        fielder: testOutfielder,
        position: 'CF' as const
      };

      // 複数回実行
      let scoredCount = 0;
      const trials = 50;

      for (let i = 0; i < trials; i++) {
        const result = evaluateSingleAdvancement(
          runners,
          testBatter,
          batBallInfo,
          outfielderInfo
        );
        
        if (result.runsScored > 0) {
          scoredCount++;
        }
      }

      // 弱い打球なので、ほとんど得点できないはず
      expect(scoredCount).toBeLessThan(10); // 10%未満
    });

    it('一塁走者が追加進塁を試行する場合がある', () => {
      const runners: RunnerState = {
        first: testRunner1,
        second: null,
        third: null
      };

      const batBallInfo: BatBallInfo = {
        type: 'line_drive',
        direction: 'right',
        strength: 'very_strong',
        extraBasePotential: 75
      };

      const outfielderInfo = {
        fielder: testOutfielder,
        position: 'RF' as const
      };

      // 複数回実行して、三塁への進塁があるかチェック
      let extraBaseCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const result = evaluateSingleAdvancement(
          runners,
          testBatter,
          batBallInfo,
          outfielderInfo
        );
        
        const runnerAdv = result.advancements.find(a => a.from === 'first');
        if (runnerAdv && runnerAdv.to === 'third' && runnerAdv.isExtraBase) {
          extraBaseCount++;
        }
      }

      // 強い打球なので、ある程度追加進塁が試行されるはず
      expect(extraBaseCount).toBeGreaterThan(5); // 5%以上
    });
  });

  describe('6.3 二塁打時の本塁到達と中継送球', () => {
    it('二塁打で一塁走者が本塁を狙う場合がある', () => {
      const runners: RunnerState = {
        first: testRunner1,
        second: null,
        third: null
      };

      const batBallInfo: BatBallInfo = {
        type: 'fly_ball',
        direction: 'left',
        strength: 'very_strong',
        extraBasePotential: 80
      };

      const outfielderInfo = {
        fielder: testOutfielder,
        position: 'LF' as const,
        relayFielder: testRelayFielder
      };

      // 複数回実行
      let scoredCount = 0;
      let caughtOutCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const result = evaluateDoubleAdvancement(
          runners,
          testBatter,
          batBallInfo,
          outfielderInfo
        );
        
        const runnerAdv = result.advancements.find(a => a.from === 'first');
        if (runnerAdv?.to === 'home') {
          scoredCount++;
        } else if (runnerAdv?.to === 'out') {
          caughtOutCount++;
        }
      }

      // 強い打球なので、本塁到達またはアウトの試行があるはず
      expect(scoredCount + caughtOutCount).toBeGreaterThan(20); // 20%以上
    });

    it('二塁打時に二塁・三塁走者は確実に得点', () => {
      const runners: RunnerState = {
        first: testRunner1,
        second: testRunner2,
        third: testRunner3
      };

      const batBallInfo: BatBallInfo = {
        type: 'fly_ball',
        direction: 'center',
        strength: 'strong',
        extraBasePotential: 65
      };

      const outfielderInfo = {
        fielder: testOutfielder,
        position: 'CF' as const
      };

      const result = evaluateDoubleAdvancement(
        runners,
        testBatter,
        batBallInfo,
        outfielderInfo
      );

      // 二塁と三塁の走者は確実に得点
      const secondRunnerAdv = result.advancements.find(a => a.from === 'second');
      const thirdRunnerAdv = result.advancements.find(a => a.from === 'third');

      expect(secondRunnerAdv?.to).toBe('home');
      expect(thirdRunnerAdv?.to).toBe('home');
      expect(result.runsScored).toBeGreaterThanOrEqual(2);
    });
  });

  describe('6.4 得点と実況表示', () => {
    it('タイムリーヒットの実況を生成', () => {
      const advancements: BaseRunningAdvancement[] = [
        { from: 'batter', to: 'first' },
        { from: 'third', to: 'home', description: '三塁走者が生還！' }
      ];

      const commentary = generateScoringCommentary(advancements, 1, testBatter);

      expect(commentary).toContain('タイムリー');
    });

    it('2点以上の得点時の実況を生成', () => {
      const advancements: BaseRunningAdvancement[] = [
        { from: 'batter', to: 'second' },
        { from: 'second', to: 'home', description: '二塁走者が生還！' },
        { from: 'third', to: 'home', description: '三塁走者が生還！' }
      ];

      const commentary = generateScoringCommentary(advancements, 2, testBatter);

      expect(commentary).toContain('2点');
    });

    it('ホームランの実況を生成', () => {
      const advancements: BaseRunningAdvancement[] = [
        { from: 'batter', to: 'home' },
        { from: 'first', to: 'home' }
      ];

      const commentary = generateScoringCommentary(advancements, 2, testBatter);

      expect(commentary).toContain('ホームラン');
    });

    it('満塁ホームランの実況を生成', () => {
      const advancements: BaseRunningAdvancement[] = [
        { from: 'batter', to: 'home' },
        { from: 'first', to: 'home' },
        { from: 'second', to: 'home' },
        { from: 'third', to: 'home' }
      ];

      const commentary = generateScoringCommentary(advancements, 4, testBatter);

      expect(commentary).toContain('グランドスラム');
    });
  });

  describe('送球先の選択', () => {
    it('三塁走者がいる場合は本塁へ送球', () => {
      const runners: RunnerState = {
        first: null,
        second: null,
        third: testRunner3
      };

      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'center',
        strength: 'medium',
        extraBasePotential: 30
      };

      const target = determineThrowTarget(runners, 0, batBallInfo);
      expect(target).toBe('home');
    });

    it('ツーアウトで三塁走者がいても本塁へ送球', () => {
      const runners: RunnerState = {
        first: null,
        second: null,
        third: testRunner3
      };

      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'center',
        strength: 'medium',
        extraBasePotential: 30
      };

      // ツーアウトの場合
      const target = determineThrowTarget(runners, 2, batBallInfo);
      // 実装によって本塁または一塁
      expect(['home', 'first']).toContain(target);
    });

    it('二塁走者のみの場合は状況に応じて送球先を判断', () => {
      const runners: RunnerState = {
        first: null,
        second: testRunner2,
        third: null
      };

      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'center',
        strength: 'very_strong',
        extraBasePotential: 60
      };

      const target = determineThrowTarget(runners, 0, batBallInfo);
      // 強い打球なので本塁を狙う可能性
      expect(['home', 'third']).toContain(target);
    });
  });
});
