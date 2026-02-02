/**
 * 試合履歴のストレージ管理
 * Requirement 8: 試合履歴と戦績管理
 * AC 1-5, 26-35
 */

import type {
  GameResult,
  GameLog,
  GameHistoryData,
  OverallRecord,
} from '../types/gameHistory';

const STORAGE_KEY = 'baseball_game_history';
const STORAGE_VERSION = 1;
const MAX_GAMES = 100; // 保存する最大試合数

/**
 * ストレージから履歴データを読み込む
 * AC 27: 起動時に履歴データを復元する
 */
export function loadGameHistory(): GameHistoryData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createEmptyHistory();
    }

    const data = JSON.parse(stored) as GameHistoryData;

    // バージョンチェック
    if (data.version !== STORAGE_VERSION) {
      console.warn('履歴データのバージョンが異なります。初期化します。');
      return createEmptyHistory();
    }

    // 日付型の復元
    data.lastUpdated = new Date(data.lastUpdated);
    data.games = data.games.map((game) => ({
      ...game,
      date: new Date(game.date),
    }));

    return data;
  } catch (error) {
    // AC 28: 破損時のエラーメッセージと初期化
    console.error('履歴データの読み込みに失敗しました:', error);
    return createEmptyHistory();
  }
}

/**
 * 空の履歴データを作成
 * AC 29: 履歴データが存在しない場合、新規に作成する
 */
function createEmptyHistory(): GameHistoryData {
  return {
    version: STORAGE_VERSION,
    games: [],
    logs: {},
    lastUpdated: new Date(),
  };
}

/**
 * 試合結果を保存
 * AC 1-2: 試合結果とハイライトを永続化する
 */
export function saveGameResult(
  gameResult: GameResult,
  gameLog: GameLog
): boolean {
  try {
    const history = loadGameHistory();

    // 試合結果を追加
    history.games.unshift(gameResult); // 新しい順に追加

    // ログを追加
    history.logs[gameResult.gameId] = gameLog;

    // 最大件数を超えた場合は古いものを削除
    // AC 31: 履歴が100試合を超える場合の処理
    if (history.games.length > MAX_GAMES) {
      const removed = history.games.splice(MAX_GAMES);
      // 削除した試合のログも削除
      removed.forEach((game) => {
        delete history.logs[game.gameId];
      });
    }

    history.lastUpdated = new Date();

    // 保存
    const json = JSON.stringify(history);
    localStorage.setItem(STORAGE_KEY, json);

    return true;
  } catch (error) {
    console.error('試合結果の保存に失敗しました:', error);
    return false;
  }
}

/**
 * 特定の試合結果を取得
 */
export function getGameResult(gameId: string): GameResult | null {
  const history = loadGameHistory();
  return history.games.find((game) => game.gameId === gameId) || null;
}

/**
 * 特定の試合ログを取得
 */
export function getGameLog(gameId: string): GameLog | null {
  const history = loadGameHistory();
  return history.logs[gameId] || null;
}

/**
 * 全試合結果を取得（新しい順）
 * AC 6-7: 履歴一覧を新しい順に表示する
 */
export function getAllGames(): GameResult[] {
  const history = loadGameHistory();
  return history.games;
}

/**
 * 通算成績を計算
 * AC 16-20: 通算成績の集計
 */
export function calculateOverallRecord(
  games: GameResult[]
): OverallRecord {
  if (games.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      totalRuns: 0,
      totalRunsAllowed: 0,
      avgRunsPerGame: 0,
      avgRunsAllowedPerGame: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      currentStreak: { type: 'none', count: 0 },
      highestScore: { score: 0, gameId: '', date: new Date() },
      lowestRunsAllowed: { runs: Infinity, gameId: '', date: new Date() },
    };
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalRuns = 0;
  let totalRunsAllowed = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  let highestScore = { score: 0, gameId: '', date: new Date() };
  let lowestRunsAllowed = {
    runs: Infinity,
    gameId: '',
    date: new Date(),
  };

  // 新しい順に並んでいるので、逆順で処理
  const sortedGames = [...games].reverse();

  sortedGames.forEach((game) => {
    // プレイヤーは常にホームチームと仮定
    const playerScore = game.homeTeam.score;
    const opponentScore = game.awayTeam.score;

    if (game.winner === 'home') {
      wins++;
      currentWinStreak++;
      currentLoseStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else if (game.winner === 'away') {
      losses++;
      currentLoseStreak++;
      currentWinStreak = 0;
      longestLoseStreak = Math.max(longestLoseStreak, currentLoseStreak);
    } else {
      draws++;
      currentWinStreak = 0;
      currentLoseStreak = 0;
    }

    totalRuns += playerScore;
    totalRunsAllowed += opponentScore;

    if (playerScore > highestScore.score) {
      highestScore = {
        score: playerScore,
        gameId: game.gameId,
        date: game.date,
      };
    }

    if (opponentScore < lowestRunsAllowed.runs) {
      lowestRunsAllowed = {
        runs: opponentScore,
        gameId: game.gameId,
        date: game.date,
      };
    }
  });

  const totalGames = games.length;
  const winRate = totalGames > 0 ? wins / totalGames : 0;

  const currentStreak =
    currentWinStreak > 0
      ? { type: 'win' as const, count: currentWinStreak }
      : currentLoseStreak > 0
        ? { type: 'lose' as const, count: currentLoseStreak }
        : { type: 'none' as const, count: 0 };

  return {
    totalGames,
    wins,
    losses,
    draws,
    winRate,
    totalRuns,
    totalRunsAllowed,
    avgRunsPerGame: totalGames > 0 ? totalRuns / totalGames : 0,
    avgRunsAllowedPerGame:
      totalGames > 0 ? totalRunsAllowed / totalGames : 0,
    longestWinStreak,
    longestLoseStreak,
    currentStreak,
    highestScore,
    lowestRunsAllowed:
      lowestRunsAllowed.runs === Infinity
        ? { runs: 0, gameId: '', date: new Date() }
        : lowestRunsAllowed,
  };
}

/**
 * 試合を削除
 * AC 32-34: 削除前の確認と警告
 */
export function deleteGames(gameIds: string[]): boolean {
  try {
    const history = loadGameHistory();

    // 試合を削除
    history.games = history.games.filter(
      (game) => !gameIds.includes(game.gameId)
    );

    // ログも削除
    gameIds.forEach((gameId) => {
      delete history.logs[gameId];
    });

    history.lastUpdated = new Date();

    const json = JSON.stringify(history);
    localStorage.setItem(STORAGE_KEY, json);

    return true;
  } catch (error) {
    console.error('試合の削除に失敗しました:', error);
    return false;
  }
}

/**
 * 全履歴を削除
 */
export function clearAllHistory(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('履歴の削除に失敗しました:', error);
    return false;
  }
}

/**
 * データをエクスポート
 * AC 30: データのエクスポート機能
 */
export function exportHistory(): string {
  const history = loadGameHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * データをインポート
 */
export function importHistory(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData) as GameHistoryData;

    // バージョンチェック
    if (data.version !== STORAGE_VERSION) {
      console.error('履歴データのバージョンが異なります。');
      return false;
    }

    // 保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('履歴のインポートに失敗しました:', error);
    return false;
  }
}

/**
 * 選手が試合履歴に含まれているかをチェック
 * AC 9.33: 削除時の試合履歴警告
 */
export function isPlayerInHistory(playerId: string): {
  inHistory: boolean;
  gamesCount: number;
  lastGameDate: Date | null;
} {
  const history = loadGameHistory();
  const games = history.games.filter((game) => {
    // ホームチームまたはアウェイチームのロースターに選手が含まれているか
    const homeRoster = game.homeTeam.roster || [];
    const awayRoster = game.awayTeam.roster || [];
    return homeRoster.includes(playerId) || awayRoster.includes(playerId);
  });

  return {
    inHistory: games.length > 0,
    gamesCount: games.length,
    lastGameDate: games.length > 0 ? games[0].date : null,
  };
}
