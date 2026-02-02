/**
 * 選手管理のユーティリティ関数
 */

import { Player, Position, Hand, Condition, FatigueLevel } from '../types';

/**
 * 能力値の色分けクラスを取得
 */
export function getAbilityColorClass(value: number): string {
  if (value >= 90) return 'ability-excellent'; // 青
  if (value >= 70) return 'ability-good'; // 緑
  if (value >= 50) return 'ability-average'; // 黄
  if (value >= 30) return 'ability-below-average'; // 橙
  return 'ability-poor'; // 赤
}

/**
 * 打者の総合評価を計算
 */
export function calculateBatterOverall(player: Player): number {
  const { batting, running } = player;
  
  // Contact 30%, Gap/HR Power 40%, Eye 15%, Speed 15%
  const gapHrAverage = (batting.gapPower + batting.hrPower) / 2;
  const overall =
    batting.contact * 0.3 +
    gapHrAverage * 0.4 +
    batting.eye * 0.15 +
    running.speed * 0.15;
  
  return Math.round(overall);
}

/**
 * 投手の総合評価を計算
 */
export function calculatePitcherOverall(player: Player): number {
  if (!player.pitching) return 0;
  
  const { stuff, movement, control } = player.pitching;
  
  // Stuff 40%, Movement 35%, Control 25%
  const overall = stuff * 0.4 + movement * 0.35 + control * 0.25;
  
  return Math.round(overall);
}

/**
 * 選手の総合評価を計算
 */
export function calculateOverallRating(player: Player): number {
  if (player.position === 'P') {
    return calculatePitcherOverall(player);
  }
  return calculateBatterOverall(player);
}

/**
 * 打者タイプを判定
 */
export function getHitterType(player: Player): string {
  const { contact, gapPower, hrPower } = player.batting;
  
  // パワーヒッター: HR Power 70+、Contact 60未満
  if (hrPower >= 70 && contact < 60) {
    return 'パワーヒッター';
  }
  
  // コンタクトヒッター: Contact 70+、HR Power 60未満
  if (contact >= 70 && hrPower < 60) {
    return 'コンタクトヒッター';
  }
  
  // バランス型: Contact 65+、Gap/HR Power 65+
  if (contact >= 65 && gapPower >= 65 && hrPower >= 65) {
    return 'バランス型';
  }
  
  return '標準型';
}

/**
 * 投手タイプを判定
 */
export function getPitcherType(player: Player): string {
  if (!player.pitching) return '-';
  
  const { stamina } = player.pitching;
  
  // 先発投手: Stamina 70+
  if (stamina >= 70) {
    return '先発投手';
  }
  
  // リリーフ投手: Stamina 60未満
  if (stamina < 60) {
    return 'リリーフ投手';
  }
  
  return 'スイングマン';
}

/**
 * 新規選手を作成（デフォルト値）
 */
export function createNewPlayer(
  name: string,
  position: Position,
  batterHand: Hand = 'right'
): Player {
  const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const player: Player = {
    id,
    name,
    teamId: null,
    position,
    batterHand,
    pitcherHand: position === 'P' ? batterHand : undefined,
    batting: {
      contact: 50,
      babip: 50,
      gapPower: 50,
      hrPower: 50,
      eye: 50,
      avoidKs: 50,
      vsLHP: 50,
      vsRHP: 50,
    },
    running: {
      speed: 50,
      stealingAbility: 50,
      stealingAggr: 50,
      baserunning: 50,
    },
    fielding: {
      infieldRange: 50,
      outfieldRange: 50,
      infieldError: 75,
      outfieldError: 75,
      infieldArm: 50,
      outfieldArm: 50,
      turnDP: 50,
      sacrificeBunt: 50,
      buntForHit: 50,
      positionRatings: {
        [position]: 'C',
      },
    },
    condition: 'normal' as Condition,
    fatigue: 'fresh' as FatigueLevel,
  };
  
  // 投手の場合、投手能力を追加
  if (position === 'P') {
    player.pitching = {
      stuff: 50,
      movement: 50,
      control: 50,
      stamina: 50,
      groundBallPct: 50,
      velocity: 50,
      holdRunners: 50,
    };
  }
  
  // 捕手の場合、捕手能力を追加
  if (position === 'C') {
    player.fielding.catcherAbility = 50;
    player.fielding.catcherArm = 50;
  }
  
  return player;
}

/**
 * ランダムな選手を生成（ポジション特化）
 * AC 9.21: 指定ポジションに適した能力値をランダムに生成
 */
export function generateRandomPlayer(position: Position): Player {
  const names = [
    '山田太郎',
    '佐藤一郎',
    '鈴木次郎',
    '高橋三郎',
    '田中四郎',
    '伊藤五郎',
    '渡辺六郎',
    '中村七郎',
    '小林八郎',
    '加藤智也',
  ];
  
  const randomName = names[Math.floor(Math.random() * names.length)];
  const player = createNewPlayer(randomName, position);
  
  // ランダムな能力値を設定（ポジション特化）
  const randomAbility = (min: number = 30, max: number = 80) => 
    Math.floor(Math.random() * (max - min + 1)) + min;
  
  // ポジション別の能力値調整
  if (position === 'P') {
    // 投手: 投手能力を強化
    player.batting = {
      contact: randomAbility(20, 40),
      babip: randomAbility(20, 40),
      gapPower: randomAbility(20, 35),
      hrPower: randomAbility(15, 30),
      eye: randomAbility(25, 45),
      avoidKs: randomAbility(20, 40),
      vsLHP: randomAbility(30, 50),
      vsRHP: randomAbility(30, 50),
    };
    
    if (player.pitching) {
      player.pitching = {
        stuff: randomAbility(50, 90),
        movement: randomAbility(50, 90),
        control: randomAbility(40, 85),
        stamina: randomAbility(40, 90),
        groundBallPct: randomAbility(30, 70),
        velocity: randomAbility(50, 95),
        holdRunners: randomAbility(40, 80),
      };
    }
    
    player.running = {
      speed: randomAbility(20, 50),
      stealingAbility: randomAbility(20, 40),
      stealingAggr: randomAbility(20, 40),
      baserunning: randomAbility(30, 55),
    };
    
    player.fielding = {
      ...player.fielding,
      infieldRange: randomAbility(40, 70),
      outfieldRange: randomAbility(30, 50),
      infieldError: randomAbility(60, 85),
      outfieldError: randomAbility(60, 80),
      infieldArm: randomAbility(40, 70),
      outfieldArm: randomAbility(30, 60),
      turnDP: randomAbility(40, 70),
      sacrificeBunt: randomAbility(50, 80),
      buntForHit: randomAbility(30, 60),
    };
  } else if (position === 'C') {
    // 捕手: 捕手能力とリーダーシップを強化
    player.batting = {
      contact: randomAbility(40, 75),
      babip: randomAbility(40, 70),
      gapPower: randomAbility(40, 75),
      hrPower: randomAbility(45, 80),
      eye: randomAbility(50, 75),
      avoidKs: randomAbility(45, 70),
      vsLHP: randomAbility(50, 75),
      vsRHP: randomAbility(50, 75),
    };
    
    player.running = {
      speed: randomAbility(25, 55),
      stealingAbility: randomAbility(20, 45),
      stealingAggr: randomAbility(20, 40),
      baserunning: randomAbility(40, 65),
    };
    
    player.fielding = {
      ...player.fielding,
      infieldRange: randomAbility(40, 75),
      outfieldRange: randomAbility(30, 50),
      infieldError: randomAbility(65, 90),
      outfieldError: randomAbility(60, 80),
      infieldArm: randomAbility(50, 80),
      outfieldArm: randomAbility(40, 60),
      turnDP: randomAbility(40, 70),
      catcherAbility: randomAbility(50, 90),
      catcherArm: randomAbility(50, 90),
      sacrificeBunt: randomAbility(50, 75),
      buntForHit: randomAbility(30, 60),
    };
  } else if (['SS', '2B', '3B', '1B'].includes(position)) {
    // 内野手: 守備範囲と肩力を強化
    player.batting = {
      contact: randomAbility(45, 80),
      babip: randomAbility(45, 75),
      gapPower: randomAbility(40, 75),
      hrPower: randomAbility(35, 70),
      eye: randomAbility(45, 75),
      avoidKs: randomAbility(45, 75),
      vsLHP: randomAbility(50, 75),
      vsRHP: randomAbility(50, 75),
    };
    
    player.running = {
      speed: randomAbility(40, 80),
      stealingAbility: randomAbility(35, 75),
      stealingAggr: randomAbility(35, 70),
      baserunning: randomAbility(45, 80),
    };
    
    player.fielding = {
      ...player.fielding,
      infieldRange: randomAbility(55, 90),
      outfieldRange: randomAbility(40, 65),
      infieldError: randomAbility(70, 95),
      outfieldError: randomAbility(60, 80),
      infieldArm: randomAbility(55, 90),
      outfieldArm: randomAbility(45, 70),
      turnDP: randomAbility(50, 90),
      sacrificeBunt: randomAbility(45, 80),
      buntForHit: randomAbility(40, 75),
    };
  } else if (['LF', 'CF', 'RF'].includes(position)) {
    // 外野手: 走力と外野守備を強化
    player.batting = {
      contact: randomAbility(45, 80),
      babip: randomAbility(45, 80),
      gapPower: randomAbility(45, 85),
      hrPower: randomAbility(40, 85),
      eye: randomAbility(45, 75),
      avoidKs: randomAbility(45, 75),
      vsLHP: randomAbility(50, 75),
      vsRHP: randomAbility(50, 75),
    };
    
    player.running = {
      speed: randomAbility(55, 90),
      stealingAbility: randomAbility(45, 85),
      stealingAggr: randomAbility(40, 75),
      baserunning: randomAbility(50, 85),
    };
    
    player.fielding = {
      ...player.fielding,
      infieldRange: randomAbility(35, 60),
      outfieldRange: randomAbility(60, 95),
      infieldError: randomAbility(60, 85),
      outfieldError: randomAbility(70, 95),
      infieldArm: randomAbility(40, 70),
      outfieldArm: randomAbility(55, 90),
      turnDP: randomAbility(30, 55),
      sacrificeBunt: randomAbility(35, 65),
      buntForHit: randomAbility(35, 70),
    };
  } else {
    // その他（DH等）: バランス型
    player.batting = {
      contact: randomAbility(40, 75),
      babip: randomAbility(40, 75),
      gapPower: randomAbility(45, 80),
      hrPower: randomAbility(45, 80),
      eye: randomAbility(45, 75),
      avoidKs: randomAbility(45, 75),
      vsLHP: randomAbility(50, 75),
      vsRHP: randomAbility(50, 75),
    };
    
    player.running = {
      speed: randomAbility(35, 70),
      stealingAbility: randomAbility(30, 65),
      stealingAggr: randomAbility(30, 60),
      baserunning: randomAbility(40, 70),
    };
    
    player.fielding = {
      ...player.fielding,
      infieldRange: randomAbility(40, 70),
      outfieldRange: randomAbility(40, 70),
      infieldError: randomAbility(65, 85),
      outfieldError: randomAbility(65, 85),
      infieldArm: randomAbility(40, 70),
      outfieldArm: randomAbility(40, 70),
      turnDP: randomAbility(40, 70),
      sacrificeBunt: randomAbility(40, 70),
      buntForHit: randomAbility(35, 65),
    };
  }
  
  // ポジション適性をランダム設定
  player.fielding.positionRatings = {
    [position]: ['A', 'B', 'C'][Math.floor(Math.random() * 3)] as 'A' | 'B' | 'C',
  };
  
  return player;
}

/**
 * テンプレートから選手を生成
 */
export function createPlayerFromTemplate(
  name: string,
  templateType: string
): Player {
  const templates: Record<string, Partial<Player>> = {
    powerHitter: {
      position: 'RF',
      batterHand: 'right',
      batting: {
        contact: 60,
        babip: 55,
        gapPower: 80,
        hrPower: 85,
        eye: 50,
        avoidKs: 55,
        vsLHP: 70,
        vsRHP: 65,
      },
      running: {
        speed: 45,
        stealingAbility: 35,
        stealingAggr: 30,
        baserunning: 50,
      },
    },
    contactHitter: {
      position: 'CF',
      batterHand: 'left',
      batting: {
        contact: 85,
        babip: 80,
        gapPower: 55,
        hrPower: 40,
        eye: 75,
        avoidKs: 85,
        vsLHP: 65,
        vsRHP: 85,
      },
      running: {
        speed: 75,
        stealingAbility: 70,
        stealingAggr: 65,
        baserunning: 80,
      },
    },
    speedster: {
      position: '2B',
      batterHand: 'right',
      batting: {
        contact: 70,
        babip: 65,
        gapPower: 50,
        hrPower: 30,
        eye: 70,
        avoidKs: 75,
        vsLHP: 70,
        vsRHP: 65,
      },
      running: {
        speed: 90,
        stealingAbility: 85,
        stealingAggr: 80,
        baserunning: 85,
      },
    },
    acePitcher: {
      position: 'P',
      batterHand: 'right',
      pitcherHand: 'right',
      pitching: {
        stuff: 85,
        movement: 80,
        control: 75,
        stamina: 85,
        groundBallPct: 55,
        velocity: 85,
        holdRunners: 60,
      },
    },
    closerPitcher: {
      position: 'P',
      batterHand: 'right',
      pitcherHand: 'right',
      pitching: {
        stuff: 90,
        movement: 75,
        control: 70,
        stamina: 40,
        groundBallPct: 50,
        velocity: 90,
        holdRunners: 55,
      },
    },
  };
  
  const template = templates[templateType];
  if (!template) {
    throw new Error(`Unknown template type: ${templateType}`);
  }
  
  const player = createNewPlayer(
    name,
    template.position || 'CF',
    template.batterHand || 'right'
  );
  
  // テンプレートの値で上書き
  return {
    ...player,
    ...template,
    name, // 名前は引数のものを使用
  } as Player;
}

/**
 * 選手データのクローン
 */
export function clonePlayer(player: Player, newName?: string): Player {
  const cloned = JSON.parse(JSON.stringify(player)) as Player;
  cloned.id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  cloned.name = newName || `${player.name} (コピー)`;
  return cloned;
}

/**
 * 選手リストのフィルタリング
 */
export function filterPlayers(
  players: Player[],
  filters: {
    position?: Position;
    teamId?: string;
    minOverall?: number;
    maxOverall?: number;
    searchText?: string;
  }
): Player[] {
  let filtered = [...players];
  
  if (filters.position) {
    filtered = filtered.filter((p) => p.position === filters.position);
  }
  
  if (filters.teamId !== undefined) {
    filtered = filtered.filter((p) => p.teamId === filters.teamId);
  }
  
  if (filters.minOverall !== undefined) {
    filtered = filtered.filter((p) => calculateOverallRating(p) >= filters.minOverall!);
  }
  
  if (filters.maxOverall !== undefined) {
    filtered = filtered.filter((p) => calculateOverallRating(p) <= filters.maxOverall!);
  }
  
  if (filters.searchText) {
    const text = filters.searchText.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(text));
  }
  
  return filtered;
}

/**
 * 選手リストのソート
 */
export function sortPlayers(
  players: Player[],
  sortBy: 'name' | 'position' | 'overall',
  order: 'asc' | 'desc' = 'asc'
): Player[] {
  const sorted = [...players];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'ja');
        break;
      case 'position':
        comparison = a.position.localeCompare(b.position);
        break;
      case 'overall':
        comparison = calculateOverallRating(a) - calculateOverallRating(b);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}
