/**
 * 試合履歴の型定義
 * Requirement 8: 試合履歴と戦績管理
 */

/**
 * 試合結果のハイライトイベント
 */
export interface GameHighlight {
  inning: number;
  half: 'top' | 'bottom';
  type: 'scoring' | 'pitcher_change' | 'home_run' | 'walk_off' | 'double_play';
  description: string;
  timestamp: number;
}

/**
 * イニング別得点
 */
export interface InningScore {
  inning: number;
  awayScore: number;
  homeScore: number;
}

/**
 * 試合結果の基本情報
 */
export interface GameResult {
  gameId: string;
  date: Date;
  timestamp: number;
  awayTeam: {
    teamName: string;
    abbreviation: string;
    score: number;
    hits: number;
    errors: number;
    leftOnBase: number;
  };
  homeTeam: {
    teamName: string;
    abbreviation: string;
    score: number;
    hits: number;
    errors: number;
    leftOnBase: number;
  };
  winner: 'away' | 'home' | 'draw';
  gameType: 'regular' | 'extra' | 'called' | 'walk_off';
  finalInning: number;
  elapsedSeconds: number;
  innings: InningScore[];
  highlights: GameHighlight[];
  mvp?: {
    playerName: string;
    playerId: string;
    reason: string;
  };
}

/**
 * 試合の詳細ログ
 */
export interface GameLog {
  gameId: string;
  playLog: Array<{
    type: string;
    description: string;
    inning: number;
    half: 'top' | 'bottom';
    timestamp: number;
  }>;
}

/**
 * 通算戦績
 */
export interface OverallRecord {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalRuns: number;
  totalRunsAllowed: number;
  avgRunsPerGame: number;
  avgRunsAllowedPerGame: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  currentStreak: {
    type: 'win' | 'lose' | 'none';
    count: number;
  };
  highestScore: {
    score: number;
    gameId: string;
    date: Date;
  };
  lowestRunsAllowed: {
    runs: number;
    gameId: string;
    date: Date;
  };
}

/**
 * フィルタ条件
 */
export interface GameHistoryFilter {
  period?: 'all' | 'last7days' | 'last30days' | 'custom';
  startDate?: Date;
  endDate?: Date;
  result?: 'all' | 'win' | 'lose' | 'draw';
  opponent?: string;
}

/**
 * 試合履歴データ全体
 */
export interface GameHistoryData {
  version: number;
  games: GameResult[];
  logs: Record<string, GameLog>;
  lastUpdated: Date;
}

/**
 * トレンド分析データ
 */
export interface TrendAnalysis {
  recentRecord: {
    games: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
  avgRunsPerGame: number;
  avgRunsAllowedPerGame: number;
  scoringTrend: Array<{
    date: Date;
    runs: number;
    runsAllowed: number;
  }>;
}
