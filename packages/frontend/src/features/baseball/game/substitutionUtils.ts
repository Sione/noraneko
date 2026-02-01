import { Player, PlayerInGame, Position } from '../types';

/**
 * 選手交代システム
 * タスク8.5: 交代ルールの適用
 */

// 交代タイプ
export type SubstitutionType =
  | 'pinch_hitter' // 代打
  | 'pinch_runner' // 代走
  | 'defensive_replacement' // 守備固め
  | 'pitcher_change'; // 投手交代

// 交代情報
export interface Substitution {
  type: SubstitutionType;
  inPlayer: PlayerInGame;
  outPlayer: PlayerInGame;
  position: Position;
  inning: number;
  isTopHalf: boolean;
}

// 選手の出場状態
export interface PlayerGameStatus {
  playerId: string;
  hasPlayed: boolean; // 試合に出場したか
  isActive: boolean; // 現在アクティブか
  substitutionInnings: number[]; // 交代したイニング
}

/**
 * 交代の有効性を検証
 */
export function validateSubstitution(
  substitution: Substitution,
  playerStatuses: Map<string, PlayerGameStatus>
): { valid: boolean; error?: string } {
  const inPlayerStatus = playerStatuses.get(substitution.inPlayer.id);
  const outPlayerStatus = playerStatuses.get(substitution.outPlayer.id);

  // 出場選手が既に試合に出ていないかチェック
  if (inPlayerStatus?.hasPlayed) {
    return {
      valid: false,
      error: `${substitution.inPlayer.name}は既に試合に出場しています。再出場はできません。`,
    };
  }

  // 退場選手がアクティブかチェック
  if (!outPlayerStatus?.isActive) {
    return {
      valid: false,
      error: `${substitution.outPlayer.name}は現在試合に出場していません。`,
    };
  }

  // DHルールの検証（将来的に実装）
  // 現時点では投手がDHとして打席に立つことを許可

  return { valid: true };
}

/**
 * 代打の可否を判定
 */
export function canPinchHit(
  player: Player,
  playerStatuses: Map<string, PlayerGameStatus>
): boolean {
  const status = playerStatuses.get(player.id);
  return !status?.hasPlayed; // 試合に出場していなければ代打可能
}

/**
 * 守備固めの可否を判定
 */
export function canDefensiveReplace(
  player: Player,
  position: Position,
  playerStatuses: Map<string, PlayerGameStatus>
): boolean {
  const status = playerStatuses.get(player.id);
  if (status?.hasPlayed) return false;

  // ポジション適性のチェック
  const rating = player.fielding.positionRatings[position];
  return rating !== undefined && rating !== 'F'; // F評価でなければ守備可能
}

/**
 * 投手交代の可否を判定
 */
export function canPitcherChange(
  pitcher: Player,
  playerStatuses: Map<string, PlayerGameStatus>
): boolean {
  if (pitcher.position !== 'P') return false;
  const status = playerStatuses.get(pitcher.id);
  return !status?.hasPlayed; // 試合に出場していなければ交代可能
}

/**
 * 推奨代打を取得
 * @param bench ベンチメンバー
 * @param currentBatter 現在の打者
 * @param pitcherHand 投手の利き手
 * @param playerStatuses 選手の出場状態
 */
export function getRecommendedPinchHitter(
  bench: Player[],
  currentBatter: PlayerInGame,
  pitcherHand: 'left' | 'right',
  playerStatuses: Map<string, PlayerGameStatus>
): Player | null {
  // 出場可能な選手をフィルタ
  const availablePlayers = bench.filter((p) =>
    canPinchHit(p, playerStatuses)
  );

  if (availablePlayers.length === 0) return null;

  // 左右の有利な組み合わせを優先
  const advantageousPlayers = availablePlayers.filter(
    (p) => p.batterHand !== 'switch' && p.batterHand !== pitcherHand
  );

  const candidates =
    advantageousPlayers.length > 0 ? advantageousPlayers : availablePlayers;

  // 打撃能力が現在の打者より高い選手を選択
  const currentBattingScore =
    (currentBatter.batting.contact +
      currentBatter.batting.hrPower +
      currentBatter.batting.eye) /
    3;

  const betterHitters = candidates.filter((p) => {
    const battingScore = (p.batting.contact + p.batting.hrPower + p.batting.eye) / 3;
    return battingScore > currentBattingScore;
  });

  if (betterHitters.length === 0) return null;

  // 最も打撃能力が高い選手を選択
  betterHitters.sort((a, b) => {
    const scoreA = (a.batting.contact + a.batting.hrPower + a.batting.eye) / 3;
    const scoreB = (b.batting.contact + b.batting.hrPower + b.batting.eye) / 3;
    return scoreB - scoreA;
  });

  return betterHitters[0];
}

/**
 * 推奨守備固めを取得
 */
export function getRecommendedDefensiveReplacement(
  bench: Player[],
  position: Position,
  currentPlayer: PlayerInGame,
  playerStatuses: Map<string, PlayerGameStatus>
): Player | null {
  // 出場可能な選手をフィルタ
  const availablePlayers = bench.filter((p) =>
    canDefensiveReplace(p, position, playerStatuses)
  );

  if (availablePlayers.length === 0) return null;

  // 守備能力が現在の選手より高い選手を選択
  const isInfield = ['C', '1B', '2B', '3B', 'SS'].includes(position);
  const currentDefenseScore = isInfield
    ? (currentPlayer.fielding.infieldRange + currentPlayer.fielding.infieldError) / 2
    : (currentPlayer.fielding.outfieldRange + currentPlayer.fielding.outfieldError) / 2;

  const betterDefenders = availablePlayers.filter((p) => {
    const defenseScore = isInfield
      ? (p.fielding.infieldRange + p.fielding.infieldError) / 2
      : (p.fielding.outfieldRange + p.fielding.outfieldError) / 2;
    return defenseScore > currentDefenseScore;
  });

  if (betterDefenders.length === 0) return null;

  // 最も守備能力が高い選手を選択
  betterDefenders.sort((a, b) => {
    const scoreA = isInfield
      ? (a.fielding.infieldRange + a.fielding.infieldError) / 2
      : (a.fielding.outfieldRange + a.fielding.outfieldError) / 2;
    const scoreB = isInfield
      ? (b.fielding.infieldRange + b.fielding.infieldError) / 2
      : (b.fielding.outfieldRange + b.fielding.outfieldError) / 2;
    return scoreB - scoreA;
  });

  return betterDefenders[0];
}

/**
 * 推奨投手交代を取得
 */
export function getRecommendedPitcherChange(
  bench: Player[],
  currentPitcher: PlayerInGame,
  playerStatuses: Map<string, PlayerGameStatus>
): Player | null {
  // 出場可能な投手をフィルタ
  const availablePitchers = bench.filter(
    (p) => p.position === 'P' && canPitcherChange(p, playerStatuses)
  );

  if (availablePitchers.length === 0) return null;

  // 現在の投手より能力が高い投手を選択
  const currentPitchingScore = currentPitcher.pitching
    ? (currentPitcher.pitching.stuff +
        currentPitcher.pitching.control +
        currentPitcher.pitching.movement) /
      3
    : 0;

  const betterPitchers = availablePitchers.filter((p) => {
    if (!p.pitching) return false;
    const pitchingScore =
      (p.pitching.stuff + p.pitching.control + p.pitching.movement) / 3;
    return pitchingScore > currentPitchingScore;
  });

  if (betterPitchers.length === 0) {
    // より良い投手がいない場合は、疲労していない投手を選択
    return availablePitchers.find((p) => p.fatigue === 'fresh') || availablePitchers[0];
  }

  // 最も投球能力が高い投手を選択
  betterPitchers.sort((a, b) => {
    const scoreA = a.pitching
      ? (a.pitching.stuff + a.pitching.control + a.pitching.movement) / 3
      : 0;
    const scoreB = b.pitching
      ? (b.pitching.stuff + b.pitching.control + b.pitching.movement) / 3
      : 0;
    return scoreB - scoreA;
  });

  return betterPitchers[0];
}

/**
 * 交代実行後の状態更新
 */
export function applySubstitution(
  substitution: Substitution,
  playerStatuses: Map<string, PlayerGameStatus>
): Map<string, PlayerGameStatus> {
  const newStatuses = new Map(playerStatuses);

  // 入る選手の状態を更新
  const inPlayerStatus = newStatuses.get(substitution.inPlayer.id) || {
    playerId: substitution.inPlayer.id,
    hasPlayed: false,
    isActive: false,
    substitutionInnings: [],
  };
  inPlayerStatus.hasPlayed = true;
  inPlayerStatus.isActive = true;
  inPlayerStatus.substitutionInnings.push(substitution.inning);
  newStatuses.set(substitution.inPlayer.id, inPlayerStatus);

  // 出る選手の状態を更新
  const outPlayerStatus = newStatuses.get(substitution.outPlayer.id) || {
    playerId: substitution.outPlayer.id,
    hasPlayed: true,
    isActive: true,
    substitutionInnings: [],
  };
  outPlayerStatus.isActive = false;
  newStatuses.set(substitution.outPlayer.id, outPlayerStatus);

  return newStatuses;
}

/**
 * 交代の説明文を生成
 */
export function getSubstitutionDescription(substitution: Substitution): string {
  const typeLabels: Record<SubstitutionType, string> = {
    pinch_hitter: '代打',
    pinch_runner: '代走',
    defensive_replacement: '守備固め',
    pitcher_change: '投手交代',
  };

  const typeLabel = typeLabels[substitution.type];
  const inning = `${substitution.inning}回${substitution.isTopHalf ? '表' : '裏'}`;

  return `${inning} - ${typeLabel}: ${substitution.inPlayer.name}が${substitution.outPlayer.name}に代わって${substitution.position}に入ります`;
}
