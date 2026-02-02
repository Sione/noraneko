/**
 * タスク1実装テスト
 * 試合開始と基本フローの動作確認用ユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import gameReducer, {
  GameState,
  startGame,
  startInning,
  startAtBat,
  endAtBat,
  recordOut,
  endHalfInning,
  checkGameEnd,
  addScore,
  checkSayonara,
  setTeams,
  resetGame,
} from '../gameSlice';
import { TeamInGame, PlayerInGame } from '../../types';

// テスト用のチームデータを作成
function createTestTeam(teamId: string, teamName: string): TeamInGame {
  const players: PlayerInGame[] = [];
  
  // 投手
  players.push(createTestPlayer(`${teamId}-p`, '投手', 'P'));
  
  // 捕手
  players.push(createTestPlayer(`${teamId}-c`, '捕手', 'C'));
  
  // 内野手
  players.push(createTestPlayer(`${teamId}-1b`, '一塁手', '1B'));
  players.push(createTestPlayer(`${teamId}-2b`, '二塁手', '2B'));
  players.push(createTestPlayer(`${teamId}-3b`, '三塁手', '3B'));
  players.push(createTestPlayer(`${teamId}-ss`, '遊撃手', 'SS'));
  
  // 外野手
  players.push(createTestPlayer(`${teamId}-lf`, '左翼手', 'LF'));
  players.push(createTestPlayer(`${teamId}-cf`, '中堅手', 'CF'));
  players.push(createTestPlayer(`${teamId}-rf`, '右翼手', 'RF'));

  return {
    teamId,
    teamName,
    abbreviation: teamId.substring(0, 3).toUpperCase(),
    lineup: players,
    bench: [],
    currentBatterIndex: 0,
    score: 0,
    hits: 0,
    errors: 0,
    leftOnBase: 0,
  };
}

function createTestPlayer(id: string, name: string, position: PlayerInGame['position']): PlayerInGame {
  return {
    id,
    name,
    teamId: 'test-team',
    position,
    batterHand: 'right',
    pitcherHand: position === 'P' ? 'right' : undefined,
    batting: {
      contact: 50,
      babip: 50,
      gapPower: 50,
      hrPower: 50,
      eye: 50,
      avoidKs: 50,
      vsLHP: 50,
      vsRHP: 50,
    },
    pitching: position === 'P' ? {
      stuff: 50,
      movement: 50,
      control: 50,
      stamina: 50,
      groundBallPct: 50,
      velocity: 50,
      holdRunners: 50,
    } : undefined,
    running: {
      speed: 50,
      stealingAbility: 50,
      stealingAggr: 50,
      baserunning: 50,
    },
    fielding: {
      infieldRange: 50,
      outfieldRange: 50,
      infieldError: 50,
      outfieldError: 50,
      infieldArm: 50,
      outfieldArm: 50,
      turnDP: 50,
      catcherAbility: position === 'C' ? 50 : undefined,
      catcherArm: position === 'C' ? 50 : undefined,
      sacrificeBunt: 50,
      buntForHit: 50,
      positionRatings: {
        [position]: 'B' as const,
      },
    },
    condition: 'normal',
    fatigue: 'normal',
  };
}

describe('ゲームスライス - タスク1: 試合開始と基本フロー', () => {
  let initialState: GameState;
  let homeTeam: TeamInGame;
  let awayTeam: TeamInGame;
  let allPlayers: PlayerInGame[];

  beforeEach(() => {
    // 初期状態を取得
    initialState = gameReducer(undefined, { type: '@@INIT' });
    
    // テストチームを作成
    homeTeam = createTestTeam('home', 'ホームチーム');
    awayTeam = createTestTeam('away', 'アウェイチーム');
    
    // 全選手データを集約
    allPlayers = [...homeTeam.lineup, ...awayTeam.lineup];
  });

  describe('1.1 試合初期化と開始の画面遷移', () => {
    it('チームを設定できる', () => {
      const state = gameReducer(
        initialState,
        setTeams({ homeTeam, awayTeam, isPlayerHome: true, allPlayers })
      );

      expect(state.homeTeam).toEqual(homeTeam);
      expect(state.awayTeam).toEqual(awayTeam);
      expect(state.isPlayerHome).toBe(true);
      expect(state.phase).toBe('lineup_edit');
    });

    it('試合を開始できる', () => {
      let state = gameReducer(
        initialState,
        setTeams({ homeTeam, awayTeam, isPlayerHome: true, allPlayers })
      );

      state = gameReducer(state, startGame());

      expect(state.phase).toBe('inning_start');
      expect(state.currentInning).toBe(1);
      expect(state.isTopHalf).toBe(true);
      expect(state.outs).toBe(0);
      expect(state.score.home).toBe(0);
      expect(state.score.away).toBe(0);
      expect(state.gameStartTime).not.toBeNull();
    });

    it('試合開始時に先発投手が設定される', () => {
      let state = gameReducer(
        initialState,
        setTeams({ homeTeam, awayTeam, isPlayerHome: true, allPlayers })
      );

      state = gameReducer(state, startGame());

      expect(state.currentPitcher).not.toBeNull();
      expect(state.currentPitcher?.currentPitcher.position).toBe('P');
    });

    it('試合開始メッセージがログに追加される', () => {
      let state = gameReducer(
        initialState,
        setTeams({ homeTeam, awayTeam, isPlayerHome: true, allPlayers })
      );

      state = gameReducer(state, startGame());

      expect(state.playLog.length).toBeGreaterThan(0);
      const startEvent = state.playLog.find(e => e.type === 'game_start');
      expect(startEvent).toBeDefined();
      expect(startEvent?.description).toContain('試合開始');
    });
  });

  describe('1.2 イニング進行と攻守交代', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = gameReducer(
        initialState,
        setTeams({ homeTeam, awayTeam, isPlayerHome: true, allPlayers })
      );
      gameState = gameReducer(gameState, startGame());
    });

    it('イニングを開始できる', () => {
      const state = gameReducer(gameState, startInning());

      expect(state.phase).toBe('at_bat');
      expect(state.outs).toBe(0);
      expect(state.runners.first).toBeNull();
      expect(state.runners.second).toBeNull();
      expect(state.runners.third).toBeNull();
    });

    it('イニング開始メッセージがログに追加される', () => {
      const state = gameReducer(gameState, startInning());

      const inningStartEvents = state.playLog.filter(e => e.type === 'inning_start');
      expect(inningStartEvents.length).toBeGreaterThan(0);
      
      const lastInningStart = inningStartEvents[inningStartEvents.length - 1];
      expect(lastInningStart.description).toContain('回');
      expect(lastInningStart.description).toMatch(/表|裏/);
    });

    it('打席を開始できる', () => {
      let state = gameReducer(gameState, startInning());
      state = gameReducer(state, startAtBat());

      expect(state.phase).toBe('awaiting_instruction');
      expect(state.currentAtBat).not.toBeNull();
      expect(state.currentAtBat?.batterName).toBeDefined();
      expect(state.currentAtBat?.pitcherName).toBeDefined();
      expect(state.currentAtBat?.balls).toBe(0);
      expect(state.currentAtBat?.strikes).toBe(0);
    });

    it('アウトを3つ記録すると半イニング終了フェーズになる', () => {
      let state = gameReducer(gameState, startInning());

      // 1アウト
      state = gameReducer(state, recordOut({ description: 'アウト1' }));
      expect(state.outs).toBe(1);
      expect(state.phase).toBe('result_display');

      // 2アウト
      state = gameReducer(state, recordOut({ description: 'アウト2' }));
      expect(state.outs).toBe(2);
      expect(state.phase).toBe('result_display');

      // 3アウト
      state = gameReducer(state, recordOut({ description: 'アウト3' }));
      expect(state.outs).toBe(3);
      expect(state.phase).toBe('half_inning_end');
    });

    it('半イニング終了で表から裏へ交代する', () => {
      let state = gameReducer(gameState, startInning());
      expect(state.isTopHalf).toBe(true);
      expect(state.currentInning).toBe(1);

      // 3アウト
      state = gameReducer(state, recordOut({ description: 'アウト1' }));
      state = gameReducer(state, recordOut({ description: 'アウト2' }));
      state = gameReducer(state, recordOut({ description: 'アウト3' }));

      // 半イニング終了
      state = gameReducer(state, endHalfInning());

      expect(state.isTopHalf).toBe(false); // 裏へ
      expect(state.currentInning).toBe(1); // 同じ回
      expect(state.phase).toBe('inning_start');
      expect(state.outs).toBe(0); // アウトカウントリセット
    });

    it('裏終了で次のイニングの表へ進む', () => {
      let state = gameReducer(gameState, startInning());
      
      // 表を終了
      state = gameReducer(state, recordOut({ description: 'アウト1' }));
      state = gameReducer(state, recordOut({ description: 'アウト2' }));
      state = gameReducer(state, recordOut({ description: 'アウト3' }));
      state = gameReducer(state, endHalfInning());

      expect(state.isTopHalf).toBe(false);
      expect(state.currentInning).toBe(1);

      // 裏を開始して終了
      state = gameReducer(state, startInning());
      state = gameReducer(state, recordOut({ description: 'アウト1' }));
      state = gameReducer(state, recordOut({ description: 'アウト2' }));
      state = gameReducer(state, recordOut({ description: 'アウト3' }));
      state = gameReducer(state, endHalfInning());

      expect(state.isTopHalf).toBe(true); // 表へ
      expect(state.currentInning).toBe(2); // 次の回
      expect(state.outs).toBe(0);
    });

    it('打者が次へ進む', () => {
      let state = gameReducer(gameState, startInning());
      state = gameReducer(state, startAtBat());

      const firstBatterIndex = state.awayTeam?.currentBatterIndex || 0;

      state = gameReducer(state, endAtBat());

      const secondBatterIndex = state.awayTeam?.currentBatterIndex || 0;
      expect(secondBatterIndex).toBe((firstBatterIndex + 1) % 9);
    });
  });

  describe('1.3 試合終了条件と終了演出', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = gameReducer(
        initialState,
        setTeams({ homeTeam, awayTeam, isPlayerHome: true, allPlayers })
      );
      gameState = gameReducer(gameState, startGame());
    });

    it('9回終了後、得点差があれば試合終了と判定される', () => {
      // 9回表へ進める
      let state = { 
        ...gameState,
        currentInning: 9,
        isTopHalf: false,
        score: {
          ...gameState.score,
          home: 5,
          away: 3,
        }
      };

      state = gameReducer(state, checkGameEnd());

      expect(state.phase).toBe('game_end');
      const endEvent = state.playLog.find(e => e.type === 'game_end');
      expect(endEvent).toBeDefined();
      expect(endEvent?.description).toContain('勝利');
    });

    it('9回終了後、同点なら延長戦に進む', () => {
      // 9回裏へ進める
      let state = {
        ...gameState,
        currentInning: 9,
        isTopHalf: false,
        score: {
          ...gameState.score,
          home: 3,
          away: 3,
        }
      };

      state = gameReducer(state, checkGameEnd());

      // 試合終了にはならない
      expect(state.phase).not.toBe('game_end');
      
      const extendEvent = state.playLog.find(e => 
        e.description.includes('延長')
      );
      expect(extendEvent).toBeDefined();
    });

    it('コールドゲームが判定される（5回以降、10点差）', () => {
      let state = {
        ...gameState,
        currentInning: 5,
        isTopHalf: true,
        score: {
          ...gameState.score,
          home: 12,
          away: 2,
        }
      };

      state = gameReducer(state, checkGameEnd());

      expect(state.phase).toBe('game_end');
      const endEvent = state.playLog.find(e => e.type === 'game_end');
      expect(endEvent?.description).toContain('コールド');
    });

    it('サヨナラ勝ちが判定される', () => {
      let state = {
        ...gameState,
        currentInning: 9,
        isTopHalf: false,
        score: {
          ...gameState.score,
          home: 4,
          away: 5,
        }
      };

      // 裏で得点を追加してリード
      state = gameReducer(state, addScore({ team: 'home', points: 2 }));
      
      // サヨナラ判定を実行
      state = gameReducer(state, checkSayonara());

      expect(state.phase).toBe('game_end');
      const endEvent = state.playLog.find(e => e.type === 'game_end' && e.description.includes('サヨナラ'));
      expect(endEvent).toBeDefined();
    });

    it('延長戦で最大イニングに達すると引き分けになる', () => {
      let state = {
        ...gameState,
        currentInning: 12, // maxInnings
        isTopHalf: false,
        score: {
          ...gameState.score,
          home: 3,
          away: 3,
        }
      };

      state = gameReducer(state, checkGameEnd());

      expect(state.phase).toBe('game_end');
      const endEvent = state.playLog.find(e => e.type === 'game_end');
      expect(endEvent?.description).toContain('引き分け');
    });

    it('試合終了時に経過時間が記録される', () => {
      const startTime = Date.now() - 60000; // 1分前に開始
      let state: GameState = {
        ...gameState,
        currentInning: 9,
        isTopHalf: false,
        gameStartTime: startTime,
        score: {
          ...gameState.score,
          home: 5,
          away: 3,
        }
      };

      state = gameReducer(state, checkGameEnd());

      expect(state.elapsedSeconds).toBeGreaterThan(0);
    });
  });

  describe('ゲームリセット', () => {
    it('ゲームをリセットして初期状態に戻せる', () => {
      let state = gameReducer(
        initialState,
        setTeams({ homeTeam, awayTeam, isPlayerHome: true, allPlayers })
      );
      state = gameReducer(state, startGame());

      // リセット
      state = gameReducer(state, resetGame());

      expect(state.phase).toBe('idle');
      expect(state.homeTeam).toBeNull();
      expect(state.awayTeam).toBeNull();
      expect(state.currentInning).toBe(1);
      expect(state.score.home).toBe(0);
      expect(state.score.away).toBe(0);
    });
  });
});
