import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  GamePhase,
  RunnerState,
  AtBatState,
  PlayEvent,
  InningScore,
  DefensiveShift,
  Player,
} from '../types';
import { TeamInGame, PlayerInGame } from '../types';

/**
 * GameSlice - 試合状態管理
 */

export interface PitcherInGame {
  playerId: string;
  playerName: string;
  pitchCount: number;
  currentPitcher: PlayerInGame;
}

export interface GameState {
  // ゲームフェーズ
  phase: GamePhase;

  // 試合基本情報
  gameId: string | null;
  homeTeam: TeamInGame | null;
  awayTeam: TeamInGame | null;
  allPlayers: Player[]; // タスク8.3: 全選手データ

  // スコアボード
  score: {
    home: number;
    away: number;
    innings: InningScore[];
  };

  // 現在の状況
  currentInning: number;
  isTopHalf: boolean;
  outs: number;
  runners: RunnerState;

  // 打席状態
  currentAtBat: AtBatState | null;

  // 投手状態
  currentPitcher: PitcherInGame | null;

  // プレイログ
  playLog: PlayEvent[];
  playLogArchive: PlayEvent[];

  // 設定
  maxInnings: number;
  isPlayerHome: boolean;

  // 守備シフト
  defensiveShift: DefensiveShift;
  shiftLockRemaining: number;

  // 試合時間
  gameStartTime: number | null;
  elapsedSeconds: number;

  // 選手交代管理 (タスク8.5)
  playerStatuses: Record<string, { hasPlayed: boolean; isActive: boolean }>;
  substitutions: any[]; // Substitution型の配列

  // 試合結果 (タスク10.3)
  mvp: {
    playerId: string;
    playerName: string;
    reason: string;
  } | null;
}

const initialState: GameState = {
  phase: 'idle',
  gameId: null,
  homeTeam: null,
  awayTeam: null,
  allPlayers: [], // タスク8.3: 全選手データ
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
  currentAtBat: null,
  currentPitcher: null,
  playLog: [],
  playLogArchive: [],
  maxInnings: 12,
  isPlayerHome: true,
  defensiveShift: 'normal',
  shiftLockRemaining: 0,
  gameStartTime: null,
  elapsedSeconds: 0,
  playerStatuses: {}, // タスク8.5: 選手交代管理
  substitutions: [], // タスク8.5: 交代履歴
  mvp: null, // タスク10.3: MVP選手
};

/**
 * MVP選出ロジック (タスク10.3)
 * 試合終了時に最も活躍した選手を自動選出する
 */
const selectMVP = (state: GameState): { playerId: string; playerName: string; reason: string } | null => {
  if (!state.homeTeam || !state.awayTeam) return null;

  // 勝利チームを特定
  const homeScore = state.score.home;
  const awayScore = state.score.away;
  
  // 引き分けの場合はMVPなし
  if (homeScore === awayScore) return null;
  
  const winner = homeScore > awayScore ? state.homeTeam : state.awayTeam;
  
  // 打者MVP候補
  let bestBatter: { player: PlayerInGame; score: number; reason: string } | null = null;
  
  for (const player of winner.lineup) {
    if (player.position !== 'P') {
      const atBats = player.atBats || 0;
      const hits = player.hits || 0;
      const rbis = player.rbis || 0;
      const runs = player.runs || 0;
      
      // 打席がない選手は除外
      if (atBats === 0) continue;
      
      // MVPスコアを計算（打点×3 + 安打×2 + 得点×1）
      const score = rbis * 3 + hits * 2 + runs;
      
      // 理由を生成
      let reason = '';
      if (rbis >= 3) {
        reason = `${rbis}打点の活躍`;
      } else if (hits >= 3) {
        reason = `${hits}安打の活躍`;
      } else if (rbis >= 2) {
        reason = `${rbis}打点`;
      } else if (hits >= 2) {
        reason = `${hits}安打`;
      } else {
        reason = '貢献';
      }
      
      if (!bestBatter || score > bestBatter.score) {
        bestBatter = { player, score, reason };
      }
    }
  }

  // 投手MVP候補
  let bestPitcher: { player: PlayerInGame; score: number; reason: string } | null = null;
  
  for (const player of winner.lineup) {
    if (player.position === 'P' && player.currentPitchCount && player.currentPitchCount > 20) {
      // 投手MVPスコアを計算（投球数/10をベースに）
      const score = player.currentPitchCount / 10;
      const reason = player.currentPitchCount >= 90 ? '完投級の好投' : '好投';
      
      if (!bestPitcher || score > bestPitcher.score) {
        bestPitcher = { player, score, reason };
      }
    }
  }

  // 打者と投手を比較してMVP決定
  // 打者のスコアが投手の0.8倍以上なら打者を優先
  if (bestBatter && (!bestPitcher || bestBatter.score >= bestPitcher.score * 0.8)) {
    return {
      playerId: bestBatter.player.id,
      playerName: bestBatter.player.name,
      reason: bestBatter.reason,
    };
  } else if (bestPitcher) {
    return {
      playerId: bestPitcher.player.id,
      playerName: bestPitcher.player.name,
      reason: bestPitcher.reason,
    };
  }

  return null;
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // ゲームフェーズ遷移
    setPhase: (state, action: PayloadAction<GamePhase>) => {
      state.phase = action.payload;
    },

    // チーム設定画面へ遷移
    startTeamSetup: (state) => {
      state.phase = 'team_setup';
      state.gameId = `game-${Date.now()}`;
    },

    // チーム選択
    setTeams: (
      state,
      action: PayloadAction<{ homeTeam: TeamInGame; awayTeam: TeamInGame; isPlayerHome: boolean; allPlayers: Player[] }>,
    ) => {
      state.homeTeam = action.payload.homeTeam;
      state.awayTeam = action.payload.awayTeam;
      state.isPlayerHome = action.payload.isPlayerHome;
      state.allPlayers = action.payload.allPlayers; // タスク8.3: 全選手データを保存
      state.phase = 'lineup_edit';
    },

    // 打順更新 (タスク8.3)
    updateLineup: (
      state,
      action: PayloadAction<{ isHome: boolean; lineupIds: string[] }>
    ) => {
      const { isHome, lineupIds } = action.payload;
      const team = isHome ? state.homeTeam : state.awayTeam;

      if (!team) return;

      // 新しい打順を作成
      const newLineup: PlayerInGame[] = [];
      for (const playerId of lineupIds) {
        const player = state.allPlayers.find((p) => p.id === playerId);
        if (player) {
          // PlayerをPlayerInGameに変換
          const playerInGame: PlayerInGame = {
            ...player,
            atBats: 0,
            hits: 0,
            runs: 0,
            rbis: 0,
            currentPitchCount: player.position === 'P' ? 0 : undefined,
          };
          newLineup.push(playerInGame);
        }
      }

      // 打順を更新
      team.lineup = newLineup;

      // currentBatterIndexが範囲外にならないように調整
      if (team.currentBatterIndex >= newLineup.length) {
        team.currentBatterIndex = 0;
      }
    },

    // 試合開始
    startGame: (state) => {
      state.phase = 'inning_start';
      state.gameStartTime = Date.now();
      state.currentInning = 1;
      state.isTopHalf = true;
      state.outs = 0;
      state.score = {
        home: 0,
        away: 0,
        innings: [],
      };

      // タスク8.5: 選手の出場状態を初期化
      const playerStatuses: Record<string, { hasPlayed: boolean; isActive: boolean }> = {};
      if (state.homeTeam && state.awayTeam) {
        // スターティングメンバーは出場済みかつアクティブに設定
        [...state.homeTeam.lineup, ...state.awayTeam.lineup].forEach((player) => {
          playerStatuses[player.id] = { hasPlayed: true, isActive: true };
        });
        // ベンチメンバーは未出場に設定
        [...state.homeTeam.bench, ...state.awayTeam.bench].forEach((player) => {
          playerStatuses[player.id] = { hasPlayed: false, isActive: false };
        });
      }
      state.playerStatuses = playerStatuses;
      state.substitutions = [];

      // 試合開始イベントをログに追加
      const startEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: 0,
        isTopHalf: true,
        description: 'プレイボール！試合開始です。',
        type: 'game_start',
        source: 'player',
      };
      state.playLog.push(startEvent);

      // 先発投手を設定
      if (state.homeTeam && state.awayTeam) {
        const firstPitcher = state.isTopHalf
          ? state.homeTeam.lineup.find((p) => p.position === 'P')
          : state.awayTeam.lineup.find((p) => p.position === 'P');

        if (firstPitcher) {
          state.currentPitcher = {
            playerId: firstPitcher.id,
            playerName: firstPitcher.name,
            pitchCount: 0,
            currentPitcher: firstPitcher,
          };
        }
      }
    },

    // イニング開始
    startInning: (state) => {
      state.phase = 'at_bat';
      state.outs = 0;
      state.runners = {
        first: null,
        second: null,
        third: null,
      };

      // イニング開始イベントをログに追加
      const inningStartEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: state.currentInning,
        isTopHalf: state.isTopHalf,
        description: `${state.currentInning}回${state.isTopHalf ? '表' : '裏'}の攻撃です。`,
        type: 'inning_start',
        source: 'player',
      };
      state.playLog.push(inningStartEvent);

      // 守備投手を設定
      if (state.homeTeam && state.awayTeam) {
        const defendingTeam = state.isTopHalf ? state.homeTeam : state.awayTeam;
        const pitcher = defendingTeam.lineup.find((p) => p.position === 'P');

        if (pitcher) {
          state.currentPitcher = {
            playerId: pitcher.id,
            playerName: pitcher.name,
            pitchCount: state.currentPitcher?.pitchCount || 0,
            currentPitcher: pitcher,
          };
        }
      }
    },

    // 打席開始
    startAtBat: (state) => {
      if (!state.homeTeam || !state.awayTeam) return;

      const attackingTeam = state.isTopHalf ? state.awayTeam : state.homeTeam;
      const defendingTeam = state.isTopHalf ? state.homeTeam : state.awayTeam;

      // 現在の打順から打者を取得
      const batter = attackingTeam.lineup[attackingTeam.currentBatterIndex];
      const pitcher = defendingTeam.lineup.find((p) => p.position === 'P');

      if (batter && pitcher) {
        state.currentAtBat = {
          batterId: batter.id,
          batterName: batter.name,
          batterIndex: attackingTeam.currentBatterIndex,
          pitcherId: pitcher.id,
          pitcherName: pitcher.name,
          balls: 0,
          strikes: 0,
        };

        state.phase = 'awaiting_instruction';

        // 打席開始イベントをログに追加
        const atBatStartEvent: PlayEvent = {
          timestamp: Date.now(),
          inning: state.currentInning,
          isTopHalf: state.isTopHalf,
          description: `${attackingTeam.teamName} ${attackingTeam.currentBatterIndex + 1}番 ${batter.name}の打席です。`,
          type: 'at_bat_start',
          source: 'player',
        };
        state.playLog.push(atBatStartEvent);
      }
    },

    // 打席終了（次の打者へ）
    endAtBat: (state) => {
      if (!state.homeTeam || !state.awayTeam) return;
      if (!state.currentAtBat) return;

      const attackingTeam = state.isTopHalf ? state.awayTeam : state.homeTeam;
      if (state.currentAtBat.batterIndex !== attackingTeam.currentBatterIndex) {
        state.currentAtBat = null;
        state.phase = 'at_bat';
        return;
      }

      // 打順を次へ進める
      attackingTeam.currentBatterIndex = (attackingTeam.currentBatterIndex + 1) % 9;

      // 打席状態をクリア
      state.currentAtBat = null;
      state.phase = 'at_bat';
    },

    // アウトを記録して攻守交代チェック
    recordOut: (
      state,
      action: PayloadAction<{ description: string; outsRecorded?: number; batterOut?: boolean }>
    ) => {
      const outsRecorded = Math.max(1, action.payload.outsRecorded ?? 1);
      const nextOuts = state.outs + outsRecorded;
      const batterOut = action.payload.batterOut ?? false;

      // アウトイベントをログに追加
      const outEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: state.currentInning,
        isTopHalf: state.isTopHalf,
        description: action.payload.description,
        type: 'out',
        source: 'player',
      };
      state.playLog.push(outEvent);

      // アウト数を更新（3アウトを上限にクランプ）
      state.outs = Math.min(3, nextOuts);

      // 3アウトで攻守交代（打者アウトなら打順を進める）
      if (nextOuts >= 3) {
        if (batterOut && state.homeTeam && state.awayTeam) {
          const attackingTeam = state.isTopHalf ? state.awayTeam : state.homeTeam;
          attackingTeam.currentBatterIndex = (attackingTeam.currentBatterIndex + 1) % 9;
        }
        state.phase = 'half_inning_end';
      } else {
        // まだアウトが3つ未満なら次の打者へ
        state.phase = 'result_display';
      }
    },

    // 半イニング終了処理
    endHalfInning: (state) => {
      // 半イニング終了イベントをログに追加
      const halfInningEndEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: state.currentInning,
        isTopHalf: state.isTopHalf,
        description: `${state.currentInning}回${state.isTopHalf ? '表' : '裏'}が終了しました。`,
        type: 'inning_end',
        source: 'player',
      };
      state.playLog.push(halfInningEndEvent);

      // 次のイニングへ
      if (state.isTopHalf) {
        // 表が終了したら裏へ
        state.isTopHalf = false;
        state.phase = 'inning_start';
      } else {
        // 裏が終了したら次の回の表へ
        state.currentInning += 1;
        state.isTopHalf = true;

        // イニングスコアを記録
        state.score.innings.push({
          inning: state.currentInning - 1,
          homeScore: state.score.home,
          awayScore: state.score.away,
        });

        state.phase = 'inning_start';
      }

      // 走者をクリア
      state.runners = {
        first: null,
        second: null,
        third: null,
      };

      // アウトカウントをリセット
      state.outs = 0;

      // 打席状態をクリア
      state.currentAtBat = null;
    },

    // 試合終了判定
    checkGameEnd: (state) => {
      if (!state.homeTeam || !state.awayTeam) return;

      const homeScore = state.score.home;
      const awayScore = state.score.away;
      const scoreDiff = Math.abs(homeScore - awayScore);

      // コールドゲーム判定（5回以降で10点差）
      if (state.currentInning >= 5 && scoreDiff >= 10) {
        const winner = homeScore > awayScore ? state.homeTeam.teamName : state.awayTeam.teamName;
        state.phase = 'game_end';
        
        const endEvent: PlayEvent = {
          timestamp: Date.now(),
          inning: state.currentInning,
          isTopHalf: state.isTopHalf,
          description: `コールドゲーム！${winner}の勝利です。`,
          type: 'game_end',
          source: 'player',
        };
        state.playLog.push(endEvent);

        if (state.gameStartTime) {
          state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
        }
        
        // MVP選出 (タスク10.3)
        state.mvp = selectMVP(state);
        
        return;
      }

      // 9回表終了時、後攻がリードしている場合
      if (state.currentInning === 9 && state.isTopHalf && awayScore < homeScore) {
        state.phase = 'game_end';
        
        const endEvent: PlayEvent = {
          timestamp: Date.now(),
          inning: state.currentInning,
          isTopHalf: state.isTopHalf,
          description: `試合終了！${state.homeTeam.teamName}の勝利です。`,
          type: 'game_end',
          source: 'player',
        };
        state.playLog.push(endEvent);

        if (state.gameStartTime) {
          state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
        }
        
        // MVP選出 (タスク10.3)
        state.mvp = selectMVP(state);
        
        return;
      }

      // 9回裏終了時の判定
      if (state.currentInning === 9 && !state.isTopHalf) {
        if (homeScore !== awayScore) {
          // 得点差があれば試合終了
          const winner = homeScore > awayScore ? state.homeTeam.teamName : state.awayTeam.teamName;
          state.phase = 'game_end';
          
          const endEvent: PlayEvent = {
            timestamp: Date.now(),
            inning: state.currentInning,
            isTopHalf: state.isTopHalf,
            description: `試合終了！${winner}の勝利です。`,
            type: 'game_end',
            source: 'player',
          };
          state.playLog.push(endEvent);

          if (state.gameStartTime) {
            state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
          }
          
          // MVP選出 (タスク10.3)
          state.mvp = selectMVP(state);
        } else {
          // 同点なら延長戦へ
          const extendEvent: PlayEvent = {
            timestamp: Date.now(),
            inning: state.currentInning,
            isTopHalf: state.isTopHalf,
            description: '9回を終えて同点です。延長戦に突入します。',
            type: 'inning_end',
            source: 'player',
          };
          state.playLog.push(extendEvent);
          
          // 延長戦に進む（攻守交代を実行）
          state.phase = 'half_inning_end_checked';
        }
        return;
      }

      // 延長戦の判定
      if (state.currentInning > 9 && !state.isTopHalf) {
        if (homeScore !== awayScore) {
          // 得点差があれば試合終了
          const winner = homeScore > awayScore ? state.homeTeam.teamName : state.awayTeam.teamName;
          state.phase = 'game_end';
          
          const endEvent: PlayEvent = {
            timestamp: Date.now(),
            inning: state.currentInning,
            isTopHalf: state.isTopHalf,
            description: `試合終了！${winner}の勝利です。`,
            type: 'game_end',
            source: 'player',
          };
          state.playLog.push(endEvent);

          if (state.gameStartTime) {
            state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
          }
          
          // MVP選出 (タスク10.3)
          state.mvp = selectMVP(state);
        } else if (state.currentInning >= state.maxInnings) {
          // 最大イニングに達して同点なら引き分け
          state.phase = 'game_end';
          
          const endEvent: PlayEvent = {
            timestamp: Date.now(),
            inning: state.currentInning,
            isTopHalf: state.isTopHalf,
            description: `${state.maxInnings}回を終えて同点です。引き分けとなりました。`,
            type: 'game_end',
            source: 'player',
          };
          state.playLog.push(endEvent);

          if (state.gameStartTime) {
            state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
          }
          
          // 引き分けの場合はMVPなし（selectMVP内で引き分け時はnullを返す）
          state.mvp = selectMVP(state);
        } else {
          // 延長戦継続（攻守交代を実行）
          state.phase = 'half_inning_end_checked';
        }
        return;
      }

      // サヨナラ勝ちの判定（裏で後攻がリードした場合）
      if (!state.isTopHalf && state.currentInning >= 9 && homeScore > awayScore) {
        state.phase = 'game_end';
        
        const endEvent: PlayEvent = {
          timestamp: Date.now(),
          inning: state.currentInning,
          isTopHalf: state.isTopHalf,
          description: `サヨナラ勝ち！${state.homeTeam.teamName}の勝利です！`,
          type: 'game_end',
          source: 'player',
        };
        state.playLog.push(endEvent);

        if (state.gameStartTime) {
          state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
        }
        
        // MVP選出 (タスク10.3)
        state.mvp = selectMVP(state);
        return;
      }

      // 上記の試合終了条件に該当しない場合、攻守交代を実行
      state.phase = 'half_inning_end_checked';
    },

    // 得点加算
    addScore: (state, action: PayloadAction<{ team: 'home' | 'away'; points: number }>) => {
      if (action.payload.team === 'home') {
        state.score.home += action.payload.points;
      } else {
        state.score.away += action.payload.points;
      }

      // 得点イベントをログに追加
      const teamName = action.payload.team === 'home' ? state.homeTeam?.teamName : state.awayTeam?.teamName;
      const scoreEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: state.currentInning,
        isTopHalf: state.isTopHalf,
        description: `${teamName}が${action.payload.points}点を獲得！`,
        type: 'hit',
        source: 'player',
        scoreChange: { home: state.score.home, away: state.score.away },
      };
      state.playLog.push(scoreEvent);
    },

    // サヨナラ判定を独立したアクションとして追加
    checkSayonara: (state) => {
      // サヨナラ勝ちの判定（裏で後攻がリード）
      if (!state.isTopHalf && state.currentInning >= 9) {
        const homeScore = state.score.home;
        const awayScore = state.score.away;
        
        if (homeScore > awayScore) {
          state.phase = 'game_end';
          
          const endEvent: PlayEvent = {
            timestamp: Date.now(),
            inning: state.currentInning,
            isTopHalf: state.isTopHalf,
            description: `サヨナラ勝ち！${state.homeTeam?.teamName}の勝利です！`,
            type: 'game_end',
            source: 'player',
          };
          state.playLog.push(endEvent);

          if (state.gameStartTime) {
            state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
          }
          
          // MVP選出 (タスク10.3)
          state.mvp = selectMVP(state);
        }
      }
    },

    // イニング終了
    endInning: (state) => {
      state.phase = 'inning_end';

      // イニング終了イベントをログに追加
      const inningEndEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: state.currentInning,
        isTopHalf: state.isTopHalf,
        description: `${state.currentInning}回${state.isTopHalf ? '表' : '裏'}が終了しました。`,
        type: 'inning_end',
        source: 'player',
      };
      state.playLog.push(inningEndEvent);

      // イニングスコアを記録
      state.score.innings.push({
        inning: state.currentInning,
        homeScore: state.score.home,
        awayScore: state.score.away,
      });

      // 次のイニングへ
      if (state.isTopHalf) {
        state.isTopHalf = false;
      } else {
        state.currentInning += 1;
        state.isTopHalf = true;
      }
    },

    // 試合終了
    endGame: (state, action: PayloadAction<{ result: string }>) => {
      state.phase = 'game_end';

      // 試合終了イベントをログに追加
      const gameEndEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: state.currentInning,
        isTopHalf: state.isTopHalf,
        description: action.payload.result,
        type: 'game_end',
        source: 'player',
      };
      state.playLog.push(gameEndEvent);

      // 経過時間を計算
      if (state.gameStartTime) {
        state.elapsedSeconds = Math.floor((Date.now() - state.gameStartTime) / 1000);
      }
    },

    // アウトカウント更新
    updateOuts: (state, action: PayloadAction<number>) => {
      state.outs = action.payload;
    },

    // 得点更新
    updateScore: (state, action: PayloadAction<{ home?: number; away?: number }>) => {
      if (action.payload.home !== undefined) {
        state.score.home = action.payload.home;
      }
      if (action.payload.away !== undefined) {
        state.score.away = action.payload.away;
      }
    },

  // プレイイベント追加
  addPlayEvent: (state, action: PayloadAction<PlayEvent>) => {
    state.playLog.push(action.payload);

    // ログの最大件数制限
    const MAX_LOG_ENTRIES = 100;
    if (state.playLog.length > MAX_LOG_ENTRIES) {
      const archived = state.playLog.shift();
      if (archived) {
        state.playLogArchive.push(archived);
      }
    }
  },

  // 走者の更新
  updateRunners: (state, action: PayloadAction<RunnerState>) => {
    state.runners = action.payload;
  },

  // 投球数の更新
  updatePitchCount: (state, action: PayloadAction<number>) => {
    if (state.currentPitcher) {
      state.currentPitcher.pitchCount = action.payload;
    }
  },

  // 選手交代 (タスク8.5)
  makeSubstitution: (
    state,
    action: PayloadAction<{
      isHome: boolean;
      inPlayerId: string;
      outPlayerId: string;
      lineupIndex: number;
    }>
  ) => {
    const { isHome, inPlayerId, outPlayerId, lineupIndex } = action.payload;
    const team = isHome ? state.homeTeam : state.awayTeam;

    if (!team) return;

    // 新しい選手を取得
    const inPlayer = state.allPlayers.find((p) => p.id === inPlayerId);
    if (!inPlayer) return;

    // PlayerInGameに変換
    const playerInGame: PlayerInGame = {
      ...inPlayer,
      atBats: 0,
      hits: 0,
      runs: 0,
      rbis: 0,
      currentPitchCount: inPlayer.position === 'P' ? 0 : undefined,
    };

    // 打順を更新
    team.lineup[lineupIndex] = playerInGame;

    // 選手の出場状態を更新
    state.playerStatuses[inPlayerId] = { hasPlayed: true, isActive: true };
    state.playerStatuses[outPlayerId] = { hasPlayed: true, isActive: false };

    // 交代履歴を記録
    state.substitutions.push({
      inPlayerId,
      outPlayerId,
      lineupIndex,
      inning: state.currentInning,
      isTopHalf: state.isTopHalf,
    });

    // イベントログに追加
    const event: PlayEvent = {
      timestamp: Date.now(),
      inning: state.currentInning,
      isTopHalf: state.isTopHalf,
      description: `${playerInGame.name}が${team.lineup[lineupIndex]?.name}に代わって出場します`,
      type: 'substitution',
      source: 'player',
    };
    state.playLog.push(event);
  },

  // ゲームリセット
  resetGame: (state) => {
    return initialState;
  },
  },
});

export const {
  setPhase,
  startTeamSetup,
  setTeams,
  updateLineup,
  startGame,
  startInning,
  startAtBat,
  endAtBat,
  recordOut,
  endHalfInning,
  checkGameEnd,
  addScore,
  checkSayonara,
  endInning,
  endGame,
  updateOuts,
  updateScore,
  addPlayEvent,
  updateRunners,
  updatePitchCount,
  makeSubstitution,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
