import { PlayerInGame } from './player';

/**
 * チーム関連の型定義
 */

// チームデータ
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  roster: string[]; // 選手IDの配列
  defaultLineup: string[]; // デフォルト打順（選手IDの配列）
  bench: string[]; // ベンチメンバー（選手IDの配列）
  createdAt: number;
  updatedAt: number;
}

// 試合中のチーム情報
export interface TeamInGame {
  teamId: string;
  teamName: string;
  abbreviation: string;
  lineup: PlayerInGame[]; // 打順（9人）
  bench: PlayerInGame[]; // ベンチメンバー
  currentBatterIndex: number; // 現在の打順位置 (0-8)
  score: number;
  hits: number;
  errors: number;
  leftOnBase: number;
}
