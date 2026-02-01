import { Position, Condition, FatigueLevel, Hand } from './common';

/**
 * 選手関連の型定義
 */

// 打撃能力
export interface BattingAbilities {
  contact: number; // コンタクト能力 (1-100)
  babip: number; // BABIP能力 (1-100)
  gapPower: number; // ギャップ長打力 (1-100)
  hrPower: number; // 本塁打力 (1-100)
  eye: number; // 選球眼 (1-100)
  avoidKs: number; // 三振回避能力 (1-100)
  vsLHP: number; // 対左投手 (1-100)
  vsRHP: number; // 対右投手 (1-100)
}

// 投手能力
export interface PitchingAbilities {
  stuff: number; // 球威 (1-100)
  movement: number; // 変化球 (1-100)
  control: number; // 制球力 (1-100)
  stamina: number; // スタミナ (1-100)
  groundBallPct: number; // ゴロ率 (1-100)
  velocity: number; // 球速 (1-100)
  holdRunners: number; // 牽制能力 (1-100)
}

// 走塁能力
export interface RunningAbilities {
  speed: number; // 走力 (1-100)
  stealingAbility: number; // 盗塁能力 (1-100)
  stealingAggr: number; // 盗塁積極性 (1-100)
  baserunning: number; // 走塁技術 (1-100)
}

// 守備能力
export interface FieldingAbilities {
  infieldRange: number; // 内野守備範囲 (1-100)
  outfieldRange: number; // 外野守備範囲 (1-100)
  infieldError: number; // 内野エラー率（高いほど確実） (1-100)
  outfieldError: number; // 外野エラー率 (1-100)
  infieldArm: number; // 内野肩力 (1-100)
  outfieldArm: number; // 外野肩力 (1-100)
  turnDP: number; // 併殺処理能力 (1-100)
  catcherAbility?: number; // 捕手総合能力 (1-100)
  catcherArm?: number; // 捕手肩力 (1-100)
  sacrificeBunt: number; // 犠打バント能力 (1-100)
  buntForHit: number; // セーフティバント能力 (1-100)
  positionRatings: PositionRatings;
}

// ポジション適性
export interface PositionRatings {
  P?: 'A' | 'B' | 'C' | 'D' | 'F';
  C?: 'A' | 'B' | 'C' | 'D' | 'F';
  '1B'?: 'A' | 'B' | 'C' | 'D' | 'F';
  '2B'?: 'A' | 'B' | 'C' | 'D' | 'F';
  '3B'?: 'A' | 'B' | 'C' | 'D' | 'F';
  SS?: 'A' | 'B' | 'C' | 'D' | 'F';
  LF?: 'A' | 'B' | 'C' | 'D' | 'F';
  CF?: 'A' | 'B' | 'C' | 'D' | 'F';
  RF?: 'A' | 'B' | 'C' | 'D' | 'F';
}

// 選手データ
export interface Player {
  id: string;
  name: string;
  teamId: string | null;
  position: Position;
  batterHand: Hand;
  pitcherHand?: Hand;

  // 能力値
  batting: BattingAbilities;
  pitching?: PitchingAbilities;
  running: RunningAbilities;
  fielding: FieldingAbilities;

  // 状態
  condition: Condition;
  fatigue: FatigueLevel;
}

// 試合中の選手情報
export interface PlayerInGame extends Player {
  currentPitchCount?: number; // 投手の投球数
  atBats?: number; // 打席数
  hits?: number; // 安打数
  runs?: number; // 得点
  rbis?: number; // 打点
}
