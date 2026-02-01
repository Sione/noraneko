import {
  Player,
  BattingAbilities,
  RunningAbilities,
} from '../types';
import { calculateOverallRating } from './playerAbilityUtils';

/**
 * 打順運用ユーティリティ
 * タスク8.3: 打順・ロースター運用
 */

// 打順位置の推奨タイプ
export type LineupSlotType =
  | 'leadoff' // 1番: 出塁率重視
  | 'contact' // 2番: コンタクト重視
  | 'power' // 3-5番: 長打力重視
  | 'cleanup' // 4番: 最強打者
  | 'balanced' // 6-7番: バランス型
  | 'defense' // 8番: 守備重視
  | 'pitcher'; // 9番: 投手

/**
 * 打順位置ごとの推奨基準スコアを計算
 */
export function calculateLineupScore(
  player: Player,
  slotType: LineupSlotType
): number {
  const b = player.batting;
  const r = player.running;

  switch (slotType) {
    case 'leadoff':
      // 1番: 出塁率と走力を重視
      return (
        b.eye * 0.25 +
        b.contact * 0.2 +
        b.avoidKs * 0.15 +
        r.speed * 0.2 +
        r.stealingAbility * 0.15 +
        b.babip * 0.05
      );

    case 'contact':
      // 2番: コンタクトとバント能力を重視
      return (
        b.contact * 0.3 +
        b.avoidKs * 0.2 +
        b.eye * 0.15 +
        player.fielding.sacrificeBunt * 0.15 +
        r.speed * 0.1 +
        b.babip * 0.1
      );

    case 'power':
      // 3-5番: 長打力を重視
      return (
        b.hrPower * 0.3 +
        b.gapPower * 0.25 +
        b.contact * 0.2 +
        b.babip * 0.15 +
        b.avoidKs * 0.1
      );

    case 'cleanup':
      // 4番: 総合的な打撃力を重視
      return (
        b.hrPower * 0.25 +
        b.gapPower * 0.2 +
        b.contact * 0.2 +
        b.babip * 0.15 +
        b.avoidKs * 0.1 +
        b.eye * 0.1
      );

    case 'balanced':
      // 6-7番: バランス型
      return (
        b.contact * 0.2 +
        b.gapPower * 0.2 +
        b.eye * 0.15 +
        b.babip * 0.15 +
        r.baserunning * 0.15 +
        b.avoidKs * 0.15
      );

    case 'defense':
      // 8番: 守備力も考慮
      const isInfielder = ['C', '1B', '2B', '3B', 'SS'].includes(
        player.position
      );
      const fieldingScore = isInfielder
        ? (player.fielding.infieldRange + player.fielding.infieldError) / 2
        : (player.fielding.outfieldRange + player.fielding.outfieldError) / 2;

      return (
        b.contact * 0.15 +
        b.eye * 0.15 +
        b.avoidKs * 0.15 +
        fieldingScore * 0.25 +
        b.babip * 0.15 +
        r.baserunning * 0.15
      );

    case 'pitcher':
      // 9番: 投手の場合は打撃能力のみ
      return (
        b.contact * 0.3 +
        b.avoidKs * 0.25 +
        player.fielding.sacrificeBunt * 0.25 +
        b.eye * 0.2
      );

    default:
      return calculateOverallRating(player);
  }
}

/**
 * 推奨打順を自動生成
 * @param players 選手リスト（9人以上）
 * @returns 推奨打順の選手IDリスト
 */
export function generateRecommendedLineup(players: Player[]): string[] {
  if (players.length < 9) {
    throw new Error('打順を組むには最低9人の選手が必要です');
  }

  // 投手を探す
  const pitchers = players.filter((p) => p.position === 'P');
  const fieldPlayers = players.filter((p) => p.position !== 'P');

  // 各打順位置のタイプ定義
  const slotTypes: LineupSlotType[] = [
    'leadoff', // 1番
    'contact', // 2番
    'power', // 3番
    'cleanup', // 4番
    'power', // 5番
    'balanced', // 6番
    'balanced', // 7番
    'defense', // 8番
    'pitcher', // 9番
  ];

  const lineup: string[] = [];
  const usedPlayerIds = new Set<string>();

  // 1-8番: 野手を配置
  for (let i = 0; i < 8; i++) {
    const slotType = slotTypes[i];
    const availablePlayers = fieldPlayers.filter(
      (p) => !usedPlayerIds.has(p.id)
    );

    if (availablePlayers.length === 0) break;

    // 各選手のスコアを計算して最適な選手を選択
    const scoredPlayers = availablePlayers.map((player) => ({
      player,
      score: calculateLineupScore(player, slotType),
    }));

    scoredPlayers.sort((a, b) => b.score - a.score);
    const bestPlayer = scoredPlayers[0].player;

    lineup.push(bestPlayer.id);
    usedPlayerIds.add(bestPlayer.id);
  }

  // 9番: 投手を配置（投手がいない場合は残りの野手）
  if (pitchers.length > 0) {
    const availablePitchers = pitchers.filter(
      (p) => !usedPlayerIds.has(p.id)
    );
    if (availablePitchers.length > 0) {
      const bestPitcher = availablePitchers.sort(
        (a, b) =>
          calculateLineupScore(b, 'pitcher') -
          calculateLineupScore(a, 'pitcher')
      )[0];
      lineup.push(bestPitcher.id);
    } else {
      // 投手が全員使用済みの場合は残りの野手から選択
      const remainingPlayers = players.filter(
        (p) => !usedPlayerIds.has(p.id)
      );
      if (remainingPlayers.length > 0) {
        lineup.push(remainingPlayers[0].id);
      }
    }
  } else {
    // 投手がいない場合は残りの野手から選択
    const remainingPlayers = fieldPlayers.filter(
      (p) => !usedPlayerIds.has(p.id)
    );
    if (remainingPlayers.length > 0) {
      lineup.push(remainingPlayers[0].id);
    }
  }

  return lineup;
}

/**
 * 打順の有効性を検証
 */
export function validateLineup(
  lineup: string[],
  availablePlayers: Player[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 人数チェック
  if (lineup.length !== 9) {
    errors.push('打順は9人である必要があります');
  }

  // 重複チェック
  const uniqueIds = new Set(lineup);
  if (uniqueIds.size !== lineup.length) {
    errors.push('同じ選手を複数回配置することはできません');
  }

  // 存在チェック
  const availableIds = new Set(availablePlayers.map((p) => p.id));
  for (const playerId of lineup) {
    if (!availableIds.has(playerId)) {
      errors.push(`選手ID ${playerId} が見つかりません`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 打順位置の説明を取得
 */
export function getLineupSlotDescription(position: number): string {
  const descriptions: Record<number, string> = {
    1: '出塁率と走力を重視',
    2: 'コンタクトとバント能力を重視',
    3: '長打力を重視（1番目のクリーンナップ）',
    4: '最強打者を配置（チームの中心）',
    5: '長打力を重視（2番目のクリーンナップ）',
    6: 'バランス型の打者',
    7: 'バランス型の打者',
    8: '守備力も考慮した打者',
    9: '投手または守備重視の選手',
  };
  return descriptions[position] || '';
}

/**
 * 打順の総合評価を計算
 */
export function evaluateLineup(
  lineup: Player[]
): {
  overall: number;
  onBaseRate: number;
  power: number;
  speed: number;
  contact: number;
} {
  if (lineup.length === 0) {
    return { overall: 0, onBaseRate: 0, power: 0, speed: 0, contact: 0 };
  }

  let totalOnBase = 0;
  let totalPower = 0;
  let totalSpeed = 0;
  let totalContact = 0;

  for (const player of lineup) {
    const b = player.batting;
    const r = player.running;

    totalOnBase += (b.eye + b.contact + b.avoidKs) / 3;
    totalPower += (b.hrPower + b.gapPower) / 2;
    totalSpeed += (r.speed + r.stealingAbility + r.baserunning) / 3;
    totalContact += (b.contact + b.avoidKs + b.babip) / 3;
  }

  const count = lineup.length;

  const onBaseRate = Math.round(totalOnBase / count);
  const power = Math.round(totalPower / count);
  const speed = Math.round(totalSpeed / count);
  const contact = Math.round(totalContact / count);

  // 総合評価: 各要素を加重平均
  const overall = Math.round(
    onBaseRate * 0.3 + power * 0.3 + contact * 0.25 + speed * 0.15
  );

  return {
    overall,
    onBaseRate,
    power,
    speed,
    contact,
  };
}
