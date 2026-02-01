/**
 * 試合履歴のフィルタとユーティリティ
 * Requirement 8: 試合履歴と戦績管理
 * AC 21-25: フィルタリングと検索機能
 */

import type {
  GameResult,
  GameHistoryFilter,
  TrendAnalysis,
} from '../types/gameHistory';

/**
 * 日付範囲で試合をフィルタ
 */
function filterByDateRange(
  games: GameResult[],
  startDate?: Date,
  endDate?: Date
): GameResult[] {
  return games.filter((game) => {
    const gameDate = game.date;
    if (startDate && gameDate < startDate) return false;
    if (endDate && gameDate > endDate) return false;
    return true;
  });
}

/**
 * 期間フィルタを日付範囲に変換
 * AC 21: 期間指定（過去7日間、過去30日間、全期間）
 */
function getPeriodDateRange(
  period: 'all' | 'last7days' | 'last30days' | 'custom'
): { startDate?: Date; endDate?: Date } {
  const now = new Date();
  switch (period) {
    case 'last7days':
      return {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now,
      };
    case 'last30days':
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now,
      };
    case 'all':
    default:
      return {};
  }
}

/**
 * 試合をフィルタする
 * AC 21-24: フィルタと検索
 */
export function filterGames(
  games: GameResult[],
  filter: GameHistoryFilter
): GameResult[] {
  let filtered = [...games];

  // 期間フィルタ
  if (filter.period) {
    if (filter.period === 'custom') {
      filtered = filterByDateRange(
        filtered,
        filter.startDate,
        filter.endDate
      );
    } else {
      const { startDate, endDate } = getPeriodDateRange(filter.period);
      filtered = filterByDateRange(filtered, startDate, endDate);
    }
  }

  // 勝敗フィルタ
  // AC 23: 勝利試合のみ/敗北試合のみを表示
  if (filter.result && filter.result !== 'all') {
    filtered = filtered.filter((game) => {
      if (filter.result === 'win') return game.winner === 'home';
      if (filter.result === 'lose') return game.winner === 'away';
      if (filter.result === 'draw') return game.winner === 'draw';
      return true;
    });
  }

  // 対戦相手フィルタ
  // AC 24: 特定チームとの対戦成績を抽出表示
  if (filter.opponent) {
    filtered = filtered.filter(
      (game) =>
        game.awayTeam.teamName === filter.opponent ||
        game.awayTeam.abbreviation === filter.opponent
    );
  }

  return filtered;
}

/**
 * 最近N試合の成績を計算
 * AC 36: 最近10試合の勝率を計算
 */
export function calculateRecentRecord(
  games: GameResult[],
  count: number = 10
): TrendAnalysis['recentRecord'] {
  const recent = games.slice(0, count);

  if (recent.length === 0) {
    return {
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    };
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;

  recent.forEach((game) => {
    if (game.winner === 'home') wins++;
    else if (game.winner === 'away') losses++;
    else draws++;
  });

  return {
    games: recent.length,
    wins,
    losses,
    draws,
    winRate: recent.length > 0 ? wins / recent.length : 0,
  };
}

/**
 * トレンド分析データを計算
 * AC 36-38: 得点力と防御力の計算
 */
export function calculateTrendAnalysis(
  games: GameResult[],
  count: number = 10
): TrendAnalysis {
  const recent = games.slice(0, count);

  const recentRecord = calculateRecentRecord(games, count);

  let totalRuns = 0;
  let totalRunsAllowed = 0;

  const scoringTrend = recent.map((game) => {
    const runs = game.homeTeam.score;
    const runsAllowed = game.awayTeam.score;
    totalRuns += runs;
    totalRunsAllowed += runsAllowed;
    return {
      date: game.date,
      runs,
      runsAllowed,
    };
  });

  return {
    recentRecord,
    avgRunsPerGame: recent.length > 0 ? totalRuns / recent.length : 0,
    avgRunsAllowedPerGame:
      recent.length > 0 ? totalRunsAllowed / recent.length : 0,
    scoringTrend: scoringTrend.reverse(), // 古い順に並び替え
  };
}

/**
 * 対戦相手別の成績を集計
 * AC 40: 対戦相手別の勝率を集計
 */
export function calculateOpponentRecords(
  games: GameResult[]
): Array<{
  opponent: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}> {
  const opponentMap = new Map<
    string,
    { games: number; wins: number; losses: number; draws: number }
  >();

  games.forEach((game) => {
    const opponent = game.awayTeam.teamName;
    const current = opponentMap.get(opponent) || {
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };

    current.games++;
    if (game.winner === 'home') current.wins++;
    else if (game.winner === 'away') current.losses++;
    else current.draws++;

    opponentMap.set(opponent, current);
  });

  return Array.from(opponentMap.entries())
    .map(([opponent, record]) => ({
      opponent,
      ...record,
      winRate: record.games > 0 ? record.wins / record.games : 0,
    }))
    .sort((a, b) => b.winRate - a.winRate);
}
