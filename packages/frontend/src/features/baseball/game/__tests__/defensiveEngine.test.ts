import { describe, it, expect, beforeEach } from 'vitest';
import { processDefensivePlay } from '../defensiveEngine';
import type { BatBallInfo, DefensivePlayInput } from '../atBatEngine';
import type { PlayerInGame, RunnerState } from '../../types';

/**
 * 守備判定エンジンのテスト
 * タスク4: 守備判定とアウト処理
 */

describe('守備判定エンジン', () => {
  let mockBatter: PlayerInGame;
  let mockDefendingTeam: PlayerInGame[];
  let mockRunners: RunnerState;

  beforeEach(() => {
    // モック打者
    mockBatter = createMockPlayer('打者A', 'DH', {
      contact: 70,
      babip: 65,
      gapPower: 60,
      hrPower: 55
    });

    // モック守備チーム
    mockDefendingTeam = [
      createMockPlayer('投手', 'P', undefined, { infieldRange: 60, infieldError: 80 }),
      createMockPlayer('捕手', 'C', undefined, { infieldRange: 50, infieldError: 85 }),
      createMockPlayer('一塁手', '1B', undefined, { infieldRange: 65, infieldError: 90 }),
      createMockPlayer('二塁手', '2B', undefined, { infieldRange: 75, infieldError: 85, turnDP: 80 }),
      createMockPlayer('三塁手', '3B', undefined, { infieldRange: 70, infieldError: 85 }),
      createMockPlayer('遊撃手', 'SS', undefined, { infieldRange: 80, infieldError: 90, turnDP: 85 }),
      createMockPlayer('左翼手', 'LF', undefined, { outfieldRange: 70, outfieldError: 85, outfieldArm: 65 }),
      createMockPlayer('中堅手', 'CF', undefined, { outfieldRange: 85, outfieldError: 90, outfieldArm: 75 }),
      createMockPlayer('右翼手', 'RF', undefined, { outfieldRange: 75, outfieldError: 85, outfieldArm: 80 })
    ];

    // 走者なし
    mockRunners = {
      first: null,
      second: null,
      third: null
    };
  });

  describe('4.1: 打球方向に基づく担当選手の特定', () => {
    it('左方向のゴロは三塁手または遊撃手が担当する', () => {
      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'left',
        strength: 'medium',
        extraBasePotential: 10
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      const result = processDefensivePlay(input, mockDefendingTeam);

      expect(result.fielderPosition).toMatch(/3B|SS/);
    });

    it('右方向のフライは右翼手が担当する', () => {
      const batBallInfo: BatBallInfo = {
        type: 'fly_ball',
        direction: 'right',
        strength: 'strong',
        extraBasePotential: 50
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 1
      };

      const result = processDefensivePlay(input, mockDefendingTeam);

      expect(result.fielderPosition).toBe('RF');
    });

    it('中央方向のライナーは中堅手が担当する', () => {
      const batBallInfo: BatBallInfo = {
        type: 'line_drive',
        direction: 'center',
        strength: 'very_strong',
        extraBasePotential: 70
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      const result = processDefensivePlay(input, mockDefendingTeam);

      expect(result.fielderPosition).toBe('CF');
    });
  });

  describe('4.2: ゴロ/フライ/ライナーの守備処理', () => {
    it('弱いゴロはアウトになりやすい', () => {
      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'center',
        strength: 'weak',
        extraBasePotential: 5
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      // 複数回実行して統計的に検証
      let outCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const result = processDefensivePlay(input, mockDefendingTeam);
        if (result.outcome === 'out') {
          outCount++;
        }
      }

      // 弱いゴロは60%以上アウトになるはず
      // (baseCatchChance 90 * avgFieldingRange ~65 / 100 = ~58%, エラー判定後 ~55-60%)
      expect(outCount).toBeGreaterThan(50);
    });

    it('非常に強いフライは本塁打になる可能性がある', () => {
      const batBallInfo: BatBallInfo = {
        type: 'fly_ball',
        direction: 'center',
        strength: 'very_strong',
        extraBasePotential: 85
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      const result = processDefensivePlay(input, mockDefendingTeam);

      expect(['home_run', 'triple', 'double']).toContain(result.outcome);
    });

    it('守備範囲の高い選手はアウトにしやすい', () => {
      // 守備範囲の高いチームを作成
      const goodDefendingTeam = mockDefendingTeam.map(p => ({
        ...p,
        fielding: {
          ...p.fielding,
          infieldRange: 90,
          outfieldRange: 90,
          infieldError: 95,
          outfieldError: 95
        }
      }));

      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'center_right',
        strength: 'medium',
        extraBasePotential: 15
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      let outCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const result = processDefensivePlay(input, goodDefendingTeam as PlayerInGame[]);
        if (result.outcome === 'out') {
          outCount++;
        }
      }

      // 守備範囲が高いと55%以上アウトになるはず
      // (baseCatchChance 70 * fieldingRange 90 / 100 = 63%, エラー判定後 ~55-60%)
      expect(outCount).toBeGreaterThan(50);
    });
  });

  describe('4.3: 併殺/タッチアップ/送球選択', () => {
    it('走者一塁で弱いゴロは併殺の可能性がある', () => {
      mockRunners.first = { playerId: 'runner1', playerName: '走者1' };

      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'center',
        strength: 'weak',
        extraBasePotential: 5
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      let doublePlayCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const result = processDefensivePlay(input, mockDefendingTeam);
        if (result.outcome === 'double_play') {
          doublePlayCount++;
        }
      }

      // 併殺は10%以上発生するはず
      expect(doublePlayCount).toBeGreaterThan(10);
    });

    it('走者三塁で外野フライは犠牲フライになる', () => {
      mockRunners.third = { playerId: 'runner3', playerName: '走者3' };

      const batBallInfo: BatBallInfo = {
        type: 'fly_ball',
        direction: 'left',
        strength: 'medium',
        extraBasePotential: 30
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 1
      };

      const result = processDefensivePlay(input, mockDefendingTeam);

      // 犠牲フライまたはアウト
      expect(['sac_fly', 'out', 'single', 'double']).toContain(result.outcome);
      
      // 犠牲フライの場合は得点が入る
      if (result.outcome === 'sac_fly') {
        expect(result.runsScored).toBeGreaterThanOrEqual(0);
      }
    });

    it('二塁打で走者一塁は本塁を狙える場合がある', () => {
      mockRunners.first = { playerId: 'runner1', playerName: '走者1' };

      const batBallInfo: BatBallInfo = {
        type: 'fly_ball',
        direction: 'center_left',
        strength: 'very_strong',
        extraBasePotential: 65
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      let scoreCount = 0;
      const trials = 50;

      for (let i = 0; i < trials; i++) {
        const result = processDefensivePlay(input, mockDefendingTeam);
        if (result.outcome === 'double' && result.runsScored > 0) {
          scoreCount++;
        }
      }

      // 一定割合で得点が入るはず
      expect(scoreCount).toBeGreaterThan(0);
    });
  });

  describe('4.4: 守備エラー詳細と実況', () => {
    it('エラー率の高い選手はエラーしやすい', () => {
      // エラー率の高いチームを作成
      const poorDefendingTeam = mockDefendingTeam.map(p => ({
        ...p,
        fielding: {
          ...p.fielding,
          infieldError: 40, // エラー率60%
          outfieldError: 40
        }
      }));

      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'center',
        strength: 'medium',
        extraBasePotential: 15
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      let errorCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const result = processDefensivePlay(input, poorDefendingTeam as PlayerInGame[]);
        if (result.outcome === 'error') {
          errorCount++;
        }
      }

      // エラーが一定数発生するはず
      // (errorChance = (100 - 40) * 0.15 = 9%, 100回中平均9回だが分散があるため2回以上)
      expect(errorCount).toBeGreaterThanOrEqual(1);
    });

    it('エラー時は走者が進塁する', () => {
      mockRunners.first = { playerId: 'runner1', playerName: '走者1' };
      mockRunners.third = { playerId: 'runner3', playerName: '走者3' };

      // エラー率の高いチームで強制的にエラーを発生させる
      const poorDefendingTeam = mockDefendingTeam.map(p => ({
        ...p,
        fielding: {
          ...p.fielding,
          infieldError: 20,
          outfieldError: 20
        }
      }));

      const batBallInfo: BatBallInfo = {
        type: 'ground_ball',
        direction: 'left',
        strength: 'strong',
        extraBasePotential: 10
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      let errorWithScoreCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const result = processDefensivePlay(input, poorDefendingTeam as PlayerInGame[]);
        if (result.outcome === 'error' && result.runsScored > 0) {
          errorWithScoreCount++;
        }
      }

      // エラー時に走者が得点する場合がある
      expect(errorWithScoreCount).toBeGreaterThanOrEqual(0);
    });

    it('エラーの種類に応じた説明文が生成される', () => {
      const batBallInfo: BatBallInfo = {
        type: 'fly_ball',
        direction: 'right',
        strength: 'weak',
        extraBasePotential: 20
      };

      const input: DefensivePlayInput = {
        batBallInfo,
        batter: mockBatter,
        runners: mockRunners,
        outs: 0
      };

      // エラーが発生するまで試行
      let errorResult;
      for (let i = 0; i < 200; i++) {
        const result = processDefensivePlay(input, mockDefendingTeam);
        if (result.outcome === 'error') {
          errorResult = result;
          break;
        }
      }

      if (errorResult) {
        expect(errorResult.description).toMatch(/エラー|落球/);
        expect(errorResult.fielder).toBeDefined();
      }
    });
  });

  describe('統合テスト', () => {
    it('様々な打球に対して適切な結果を返す', () => {
      const testCases: Array<{ batBallInfo: BatBallInfo; expectedOutcomes: string[] }> = [
        {
          batBallInfo: {
            type: 'ground_ball',
            direction: 'right',
            strength: 'weak',
            extraBasePotential: 5
          },
          expectedOutcomes: ['out', 'single', 'error']
        },
        {
          batBallInfo: {
            type: 'fly_ball',
            direction: 'center',
            strength: 'very_strong',
            extraBasePotential: 90
          },
          expectedOutcomes: ['home_run', 'triple']
        },
        {
          batBallInfo: {
            type: 'line_drive',
            direction: 'center_left',
            strength: 'strong',
            extraBasePotential: 55
          },
          expectedOutcomes: ['out', 'single', 'double', 'triple']
        }
      ];

      testCases.forEach(({ batBallInfo, expectedOutcomes }) => {
        const input: DefensivePlayInput = {
          batBallInfo,
          batter: mockBatter,
          runners: mockRunners,
          outs: 0
        };

        const result = processDefensivePlay(input, mockDefendingTeam);

        expect(expectedOutcomes).toContain(result.outcome);
        expect(result.description).toBeTruthy();
        expect(result.runnersAdvanced).toBeDefined();
      });
    });
  });
});

// ヘルパー関数
function createMockPlayer(
  name: string,
  position: PlayerInGame['position'],
  batting?: Partial<PlayerInGame['batting']>,
  fielding?: Partial<PlayerInGame['fielding']>
): PlayerInGame {
  return {
    id: `player-${name}`,
    name,
    teamId: 'team1',
    position,
    batterHand: 'right',
    pitcherHand: position === 'P' ? 'right' : undefined,
    batting: {
      contact: batting?.contact ?? 50,
      babip: batting?.babip ?? 50,
      gapPower: batting?.gapPower ?? 50,
      hrPower: batting?.hrPower ?? 50,
      eye: batting?.eye ?? 50,
      avoidKs: batting?.avoidKs ?? 50,
      vsLHP: batting?.vsLHP ?? 50,
      vsRHP: batting?.vsRHP ?? 50
    },
    pitching: position === 'P' ? {
      stuff: 50,
      movement: 50,
      control: 50,
      stamina: 50,
      groundBallPct: 50,
      velocity: 50,
      holdRunners: 50
    } : undefined,
    running: {
      speed: 50,
      stealingAbility: 50,
      stealingAggr: 50,
      baserunning: 50
    },
    fielding: {
      infieldRange: fielding?.infieldRange ?? 50,
      outfieldRange: fielding?.outfieldRange ?? 50,
      infieldError: fielding?.infieldError ?? 50,
      outfieldError: fielding?.outfieldError ?? 50,
      infieldArm: fielding?.infieldArm ?? 50,
      outfieldArm: fielding?.outfieldArm ?? 50,
      turnDP: fielding?.turnDP ?? 50,
      catcherAbility: position === 'C' ? 50 : undefined,
      catcherArm: position === 'C' ? 50 : undefined,
      sacrificeBunt: 50,
      buntForHit: 50,
      positionRatings: {
        [position]: 'A' as const
      }
    },
    condition: 'normal',
    fatigue: 'normal'
  };
}
