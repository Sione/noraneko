/**
 * 守備シフト実況テキスト生成
 * Requirement 11 AC 41-47: シフトの視覚的フィードバックと実況
 */

import { DefensiveShift } from '../types/common';
import { DefensiveOutcome } from './defensiveEngine';

/**
 * シフト名を日本語に変換
 */
export function getShiftDisplayName(shift: DefensiveShift): string {
  const shiftNames: Record<DefensiveShift, string> = {
    normal: '通常守備',
    pull_right: '右打ちシフト',
    pull_left: '左打ちシフト',
    extreme_shift: '極端シフト',
    infield_in: '前進守備',
    infield_back: '深守備',
  };
  return shiftNames[shift];
}

/**
 * シフト指示の実況テキストを生成
 * AC 41: 守備シフトが選択される
 */
export function generateShiftInstructionCommentary(shift: DefensiveShift): string {
  const shiftName = getShiftDisplayName(shift);
  
  if (shift === 'normal') {
    return '（監督）通常守備で臨みます';
  }
  
  return `（監督）${shiftName}指示！`;
}

/**
 * シフト効果の実況テキストを生成
 * AC 42-45: シフトが適用された状態で打球が処理される
 */
export function generateShiftEffectCommentary(
  shift: DefensiveShift,
  outcome: DefensiveOutcome,
  fielderName: string,
  wasShiftEffective: boolean,
  ballDirection: 'pull' | 'center' | 'opposite'
): string {
  // 通常守備の場合はシフト効果なし
  if (shift === 'normal') {
    return '';
  }

  const shiftName = getShiftDisplayName(shift);

  // アウトになった場合
  if (outcome === 'out' || outcome === 'double_play') {
    if (wasShiftEffective) {
      // AC 42: シフトの効果を実況に含める
      if (shift === 'extreme_shift') {
        // AC 44: 極端シフトが大きな効果を発揮
        return `${shiftName}が的中！${fielderName}が完璧にアウト！`;
      } else {
        return `${shiftName}の効果で${fielderName}が難なく処理！`;
      }
    }
  }

  // 安打になった場合
  if (outcome === 'single' || outcome === 'double' || outcome === 'triple') {
    // シフトの逆を突かれた場合
    if (ballDirection === 'opposite' && wasShiftEffective) {
      // AC 43: シフトの逆を突かれる
      if (shift === 'extreme_shift' && (outcome === 'double' || outcome === 'triple')) {
        // AC 45: 極端シフトの裏をかかれて長打
        return `シフトの裏をかかれた！痛恨の${outcome === 'double' ? '二塁打' : '三塁打'}！`;
      } else {
        return 'シフトの逆を突く見事なヒット！';
      }
    } else if (wasShiftEffective && shift !== 'extreme_shift') {
      // シフト方向だが抜けてしまった
      return `${shiftName}もわずかに届かず...`;
    }
  }

  return '';
}

/**
 * 前進守備での本塁阻止プレイの実況
 */
export function generateInfieldInHomePlayCommentary(
  success: boolean,
  fielderName: string,
  catcherName?: string
): string {
  if (success) {
    return `前進守備が功を奏した！${fielderName}から${catcherName || '捕手'}への完璧な送球でアウト！`;
  } else {
    return `前進守備にもかかわらず、走者が生還...`;
  }
}

/**
 * 深守備での長打阻止プレイの実況
 */
export function generateInfieldBackPlayCommentary(
  outcome: DefensiveOutcome,
  fielderName: string
): string {
  if (outcome === 'out') {
    return `深守備が効いた！${fielderName}が深い位置から長打を阻止！`;
  } else if (outcome === 'triple') {
    return `深守備もむなしく、三塁打を許してしまった...`;
  }
  return '';
}

/**
 * シフト効果が有効だったかを判定
 */
export function wasShiftEffective(
  shift: DefensiveShift,
  outcome: DefensiveOutcome,
  ballDirection: 'pull' | 'center' | 'opposite'
): boolean {
  // 通常守備は効果判定なし
  if (shift === 'normal') {
    return false;
  }

  // シフト方向の打球でアウトになった場合
  if ((shift === 'pull_right' || shift === 'pull_left' || shift === 'extreme_shift') && 
      ballDirection === 'pull' && 
      (outcome === 'out' || outcome === 'double_play')) {
    return true;
  }

  // シフト逆方向で安打になった場合（ネガティブな意味で効果あり）
  if ((shift === 'pull_right' || shift === 'pull_left' || shift === 'extreme_shift') && 
      ballDirection === 'opposite' && 
      (outcome === 'single' || outcome === 'double' || outcome === 'triple')) {
    return true;
  }

  // 前進守備で本塁でアウトにできた場合
  if (shift === 'infield_in' && outcome === 'out') {
    return true;
  }

  // 深守備で長打を阻止できた場合
  if (shift === 'infield_back' && outcome === 'out') {
    return true;
  }

  return false;
}

/**
 * シフト表示アイコンを取得
 * AC 47: シフト表示アイコンを常時表示
 */
export function getShiftIcon(shift: DefensiveShift): string {
  const icons: Record<DefensiveShift, string> = {
    normal: '',
    pull_right: '[→シフト]',
    pull_left: '[←シフト]',
    extreme_shift: '[極端シフト]',
    infield_in: '[前進守備]',
    infield_back: '[深守備]',
  };
  return icons[shift];
}
