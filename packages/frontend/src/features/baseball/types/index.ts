// 共通型
export * from './common';
export * from './player';
export * from './team';
export type { PlayerInGame } from './player';
export type { TeamInGame } from './team';

// 試合履歴型（common.tsと名前が重複しているため個別エクスポート）
export type {
  GameHighlight,
  GameLog,
  OverallRecord,
  GameHistoryFilter,
  GameHistoryData,
  TrendAnalysis,
} from './gameHistory';

// 型名の明確化のため別名でエクスポート
export type { InningScore as CommonInningScore } from './common';
export type { GameResult as GameOutcome } from './common';
export type { InningScore as HistoryInningScore } from './gameHistory';
export type { GameResult as GameResultData } from './gameHistory';
