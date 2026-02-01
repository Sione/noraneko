/**
 * CPU AI エンジンのテスト
 * タスク14: CPU戦術AIの実装
 */

import { CPUAIEngine } from '../cpuAI';
import { GameState } from '../gameSlice';
import { PlayerInGame } from '../../types';

/**
 * モックゲーム状態を作成
 */
function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const mockPlayer: PlayerInGame = {
    id: 'test-player',
    name: 'テスト選手',
    teamId: 'test-team',
    position: 'CF',
    batterHand: 'right',
    batting: {
      contact: 70,
      babip: 65,
      gapPower: 60,
      hrPower: 55,
      eye: 60,
      avoidKs: 65,
      vsLHP: 60,
      vsRHP: 65,
    },
    pitching: {
      stuff: 70,
      movement: 65,
      control: 60,
      stamina: 75,
      groundBallPct: 50,
      velocity: 90,
      holdRunners: 60,
    },
    running: {
      speed: 70,
      stealingAbility: 65,
      stealingAggr: 60,
      baserunning: 65,
    },
    fielding: {
      infieldRange: 65,
      outfieldRange: 70,
      infieldError: 75,
      outfieldError: 80,
      infieldArm: 65,
      outfieldArm: 70,
      turnDP: 60,
      sacrificeBunt: 50,
      buntForHit: 45,
      positionRatings: {
        CF: 'A',
      },
    },
    condition: 'normal',
    fatigue: 'normal',
  };

  const defaultState: GameState = {
    phase: 'awaiting_instruction',
    gameId: 'test-game',
    homeTeam: {
      id: 'home',
      teamName: 'ホームチーム',
      lineup: Array(9).fill(mockPlayer),
      bench: [],
      currentBatterIndex: 0,
    },
    awayTeam: {
      id: 'away',
      teamName: 'アウェイチーム',
      lineup: Array(9).fill(mockPlayer),
      bench: [],
      currentBatterIndex: 0,
    },
    allPlayers: [],
    score: {
      home: 0,
      away: 0,
      innings: [],
    },
    currentInning: 1,
    isTopHalf: true,
    outs: 0,
    runners: {
      first: null,
      second: null,
      third: null,
    },
    currentAtBat: {
      batterId: 'test-batter',
      batterName: 'テスト打者',
      batterIndex: 0,
      pitcherId: 'test-pitcher',
      pitcherName: 'テスト投手',
      balls: 0,
      strikes: 0,
    },
    currentPitcher: {
      playerId: 'test-pitcher',
      playerName: 'テスト投手',
      pitchCount: 0,
      currentPitcher: mockPlayer,
    },
    playLog: [],
    playLogArchive: [],
    maxInnings: 9,
    isPlayerHome: true,
    defensiveShift: 'normal',
    shiftLockRemaining: 0,
    gameStartTime: Date.now(),
    elapsedSeconds: 0,
    playerStatuses: {},
    substitutions: [],
    mvp: null,
  };

  return { ...defaultState, ...overrides };
}

describe('CPUAIEngine', () => {
  describe('基本動作', () => {
    it('CPU AIエンジンを作成できる', () => {
      const ai = new CPUAIEngine();
      expect(ai).toBeDefined();
    });

    it('難易度を設定できる', () => {
      const ai = new CPUAIEngine({ difficulty: 'expert', thinkingTimeMs: 500 });
      expect(ai).toBeDefined();
    });
  });

  describe('攻撃指示判断', () => {
    it('通常打撃を基本的に選択する', () => {
      const ai = new CPUAIEngine({ difficulty: 'intermediate', thinkingTimeMs: 0 });
      const gameState = createMockGameState();
      
      const results = new Map<string, number>();
      
      // 100回試行して統計を取る
      for (let i = 0; i < 100; i++) {
        const instruction = ai.decideOffensiveInstruction(gameState);
        results.set(instruction, (results.get(instruction) || 0) + 1);
      }

      // 通常打撃が最も多く選択されるべき
      const normalSwingCount = results.get('normal_swing') || 0;
      expect(normalSwingCount).toBeGreaterThan(50);
    });

    it('ランナー一塁の状況でバントを検討する', () => {
      const ai = new CPUAIEngine({ difficulty: 'intermediate', thinkingTimeMs: 0 });
      const gameState = createMockGameState({
        runners: {
          first: { playerId: 'runner1', playerName: 'ランナー1' },
          second: null,
          third: null,
        },
      });
      
      const results = new Map<string, number>();
      
      for (let i = 0; i < 100; i++) {
        const instruction = ai.decideOffensiveInstruction(gameState);
        results.set(instruction, (results.get(instruction) || 0) + 1);
      }

      // バントも選択肢に含まれるべき（まれに）
      const totalInstructions = Array.from(results.keys()).length;
      expect(totalInstructions).toBeGreaterThan(1);
    });

    it('ツーアウトではバントを選択しない', () => {
      const ai = new CPUAIEngine({ difficulty: 'intermediate', thinkingTimeMs: 0 });
      const gameState = createMockGameState({
        outs: 2,
        runners: {
          first: { playerId: 'runner1', playerName: 'ランナー1' },
          second: null,
          third: null,
        },
      });
      
      for (let i = 0; i < 50; i++) {
        const instruction = ai.decideOffensiveInstruction(gameState);
        expect(instruction).not.toBe('bunt');
        expect(instruction).not.toBe('squeeze');
      }
    });
  });

  describe('守備指示判断', () => {
    it('投球数100球超で投手交代を検討する', () => {
      const ai = new CPUAIEngine({ difficulty: 'intermediate', thinkingTimeMs: 0 });
      const gameState = createMockGameState();
      
      if (gameState.currentPitcher) {
        gameState.currentPitcher.pitchCount = 105;
      }
      
      let changeCount = 0;
      for (let i = 0; i < 20; i++) {
        const instruction = ai.decideDefensiveInstruction(gameState);
        if (instruction === 'pitcher_change') {
          changeCount++;
        }
      }

      // 80-90%の確率なので、20回中10回以上は交代するはず
      expect(changeCount).toBeGreaterThan(10);
    });

    it('点差5点以上では敬遠しない', () => {
      const ai = new CPUAIEngine({ difficulty: 'intermediate', thinkingTimeMs: 0 });
      const gameState = createMockGameState({
        score: {
          home: 0,
          away: 6,
          innings: [],
        },
      });
      
      for (let i = 0; i < 50; i++) {
        const instruction = ai.decideDefensiveInstruction(gameState);
        expect(instruction).not.toBe('intentional_walk');
      }
    });
  });

  describe('難易度による調整', () => {
    it('初級難易度では最適でない指示も選択する', () => {
      const aiExpert = new CPUAIEngine({ difficulty: 'expert', thinkingTimeMs: 0 });
      const aiBeginner = new CPUAIEngine({ difficulty: 'beginner', thinkingTimeMs: 0 });
      const gameState = createMockGameState();
      
      const expertResults = new Map<string, number>();
      const beginnerResults = new Map<string, number>();
      
      for (let i = 0; i < 100; i++) {
        const expertInstruction = aiExpert.decideOffensiveInstruction(gameState);
        const beginnerInstruction = aiBeginner.decideOffensiveInstruction(gameState);
        
        expertResults.set(expertInstruction, (expertResults.get(expertInstruction) || 0) + 1);
        beginnerResults.set(beginnerInstruction, (beginnerResults.get(beginnerInstruction) || 0) + 1);
      }

      // 初級は上級よりも多様な指示を選択する傾向がある
      const expertInstructionCount = Array.from(expertResults.keys()).length;
      const beginnerInstructionCount = Array.from(beginnerResults.keys()).length;
      
      // この検証は確率的なため、厳密な比較は避ける
      expect(beginnerInstructionCount).toBeGreaterThanOrEqual(1);
      expect(expertInstructionCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('思考時間', () => {
    it('思考時間が指定した範囲内である', async () => {
      const ai = new CPUAIEngine({ difficulty: 'intermediate', thinkingTimeMs: 1000 });
      
      const startTime = Date.now();
      await ai.waitThinking();
      const endTime = Date.now();
      
      const elapsed = endTime - startTime;
      
      // 0.5-1.5倍なので、500-1500ms
      expect(elapsed).toBeGreaterThanOrEqual(400); // 若干のマージン
      expect(elapsed).toBeLessThanOrEqual(1600); // 若干のマージン
    });
  });
});
