/**
 * 共通型定義
 */

// ゲームフェーズ
export type GamePhase =
  | 'idle' // メインメニュー
  | 'team_setup' // チーム選択
  | 'lineup_edit' // 打順編集
  | 'inning_start' // イニング開始
  | 'at_bat' // 打席中
  | 'awaiting_instruction' // 指示待ち
  | 'play_execution' // プレイ実行中
  | 'result_display' // 結果表示
  | 'half_inning_end' // 半イニング終了
  | 'half_inning_end_checked' // 半イニング終了（試合終了判定済み）
  | 'inning_end' // イニング終了
  | 'game_end' // 試合終了
  | 'paused'; // 一時停止

// ポジション
export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';

// コンディション
export type Condition = 'excellent' | 'good' | 'normal' | 'poor' | 'terrible';

// 疲労度
export type FatigueLevel = 'fresh' | 'normal' | 'tired' | 'exhausted';

// 利き手
export type Hand = 'left' | 'right' | 'switch';

// 走者状態
export interface RunnerState {
  first: Runner | null;
  second: Runner | null;
  third: Runner | null;
}

export interface Runner {
  playerId: string;
  playerName: string;
}

// 打席状態
export interface AtBatState {
  batterId: string;
  batterName: string;
  batterIndex: number; // 打順位置 (0-8)
  pitcherId: string;
  pitcherName: string;
  balls: number;
  strikes: number;
}

// イニングスコア
export interface InningScore {
  inning: number;
  homeScore: number;
  awayScore: number;
}

// プレイイベント
export interface PlayEvent {
  timestamp: number;
  inning: number;
  isTopHalf: boolean;
  description: string;
  type: PlayEventType;
  source: 'player' | 'cpu' | 'ai_delegate';
  scoreChange?: { home: number; away: number };
}

export type PlayEventType = 
  | 'game_start'
  | 'inning_start'
  | 'at_bat_start'
  | 'hit'
  | 'out'
  | 'strikeout'
  | 'walk'
  | 'home_run'
  | 'double_play'
  | 'error'
  | 'substitution'
  | 'inning_end'
  | 'game_end';

// 守備シフト
export type DefensiveShift =
  | 'normal'
  | 'pull_right'
  | 'pull_left'
  | 'extreme_shift'
  | 'infield_in'
  | 'infield_back';

// 試合結果
export type GameResult = 'home_win' | 'away_win' | 'draw';

// 攻撃指示タイプ
export type OffensiveInstruction =
  | 'normal_swing' // 通常打撃
  | 'bunt' // バント
  | 'hit_and_run' // ヒットエンドラン
  | 'steal' // 盗塁
  | 'wait' // 待て
  | 'squeeze' // スクイズ
  | 'double_steal'; // ダブルスチール

// 守備指示タイプ
export type DefensiveInstruction =
  | 'normal' // 通常守備
  | 'pitcher_change' // 投手交代
  | 'intentional_walk' // 敬遠
  | 'defensive_shift'; // 守備シフト

// 指示オプション（選択肢）
export interface InstructionOption {
  type: OffensiveInstruction | DefensiveInstruction;
  label: string; // 表示名
  description: string; // 説明文
  enabled: boolean; // 選択可能かどうか
  warning?: string; // 警告メッセージ（リスクなど）
  successRate?: string; // 成功率の目安
}

// 指示実行結果
export interface InstructionResult {
  instruction: OffensiveInstruction | DefensiveInstruction;
  success: boolean;
  description: string;
  scoreChange?: { home: number; away: number };
}
