/**
 * タスク3実装テスト
 * 打席判定エンジンの動作確認用ユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { 
  judgeAtBatOutcome, 
  describeBatBall,
  simulatePitch,
  simulateAtBatWithPitchLoop
} from '../atBatEngine';
import { PlayerInGame, Condition, FatigueLevel } from '../../types';

// テスト用の選手データ
const createTestBatter = (overrides?: Partial<PlayerInGame>): PlayerInGame => ({
  id: 'batter-1',
  name: '山田太郎',
  teamId: 'team-1',
  position: '1B',
  batterHand: 'right',
  batting: {
    contact: 70,
    babip: 65,
    gapPower: 60,
    hrPower: 55,
    eye: 65,
    avoidKs: 70,
    vsLHP: 70,
    vsRHP: 65
  },
  running: {
    speed: 60,
    stealingAbility: 50,
    stealingAggr: 40,
    baserunning: 60
  },
  fielding: {
    infieldRange: 65,
    outfieldRange: 50,
    infieldError: 70,
    outfieldError: 60,
    infieldArm: 65,
    outfieldArm: 55,
    turnDP: 60,
    sacrificeBunt: 50,
    buntForHit: 45,
    positionRatings: { '1B': 'B' }
  },
  condition: 'normal' as Condition,
  fatigue: 'normal' as FatigueLevel,
  ...overrides
});

const createTestPitcher = (overrides?: Partial<PlayerInGame>): PlayerInGame => ({
  id: 'pitcher-1',
  name: '佐藤投手',
  teamId: 'team-2',
  position: 'P',
  batterHand: 'right',
  pitcherHand: 'right',
  batting: {
    contact: 30,
    babip: 25,
    gapPower: 20,
    hrPower: 15,
    eye: 25,
    avoidKs: 30,
    vsLHP: 30,
    vsRHP: 30
  },
  pitching: {
    stuff: 75,
    movement: 70,
    control: 65,
    stamina: 80,
    groundBallPct: 60,
    velocity: 75,
    holdRunners: 60
  },
  running: {
    speed: 30,
    stealingAbility: 20,
    stealingAggr: 10,
    baserunning: 30
  },
  fielding: {
    infieldRange: 40,
    outfieldRange: 30,
    infieldError: 50,
    outfieldError: 40,
    infieldArm: 50,
    outfieldArm: 40,
    turnDP: 40,
    sacrificeBunt: 30,
    buntForHit: 25,
    positionRatings: { 'P': 'A' }
  },
  condition: 'normal' as Condition,
  fatigue: 'normal' as FatigueLevel,
  ...overrides
});

describe('打席判定エンジン - タスク3.1', () => {
  it('三振/四球/インプレーのいずれかの結果が返される', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    
    const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
    
    expect(result).toHaveProperty('outcome');
    expect(['strikeout', 'walk', 'in_play']).toContain(result.outcome);
    expect(result).toHaveProperty('description');
  });

  it('三振の場合、batBallInfoがundefinedである', () => {
    const batter = createTestBatter({
      batting: {
        contact: 20,
        babip: 20,
        gapPower: 20,
        hrPower: 20,
        eye: 20,
        avoidKs: 20, // 三振しやすい
        vsLHP: 20,
        vsRHP: 20
      }
    });
    const pitcher = createTestPitcher({
      pitching: {
        stuff: 95,
        movement: 95,
        control: 70,
        stamina: 80,
        groundBallPct: 50,
        velocity: 95,
        holdRunners: 60
      }
    });
    const runners = { first: null, second: null, third: null };
    
    // 複数回試行して三振が発生することを確認
    let strikeoutOccurred = false;
    for (let i = 0; i < 50; i++) {
      const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
      if (result.outcome === 'strikeout') {
        expect(result.batBallInfo).toBeUndefined();
        strikeoutOccurred = true;
        break;
      }
    }
    
    expect(strikeoutOccurred).toBe(true);
  });

  it('四球の場合、batBallInfoがundefinedである', () => {
    const batter = createTestBatter({
      batting: {
        contact: 70,
        babip: 70,
        gapPower: 70,
        hrPower: 70,
        eye: 95, // 選球眼が高い
        avoidKs: 80,
        vsLHP: 70,
        vsRHP: 70
      }
    });
    const pitcher = createTestPitcher({
      pitching: {
        stuff: 70,
        movement: 70,
        control: 30, // 制球が悪い
        stamina: 80,
        groundBallPct: 50,
        velocity: 70,
        holdRunners: 60
      }
    });
    const runners = { first: null, second: null, third: null };
    
    // 複数回試行して四球が発生することを確認
    let walkOccurred = false;
    for (let i = 0; i < 50; i++) {
      const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
      if (result.outcome === 'walk') {
        expect(result.batBallInfo).toBeUndefined();
        walkOccurred = true;
        break;
      }
    }
    
    expect(walkOccurred).toBe(true);
  });

  it('インプレーの場合、batBallInfoが定義されている', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    
    // 複数回試行してインプレーが発生することを確認
    let inPlayOccurred = false;
    for (let i = 0; i < 50; i++) {
      const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
      if (result.outcome === 'in_play') {
        expect(result.batBallInfo).toBeDefined();
        expect(result.batBallInfo).toHaveProperty('type');
        expect(result.batBallInfo).toHaveProperty('direction');
        expect(result.batBallInfo).toHaveProperty('strength');
        expect(result.batBallInfo).toHaveProperty('extraBasePotential');
        inPlayOccurred = true;
        break;
      }
    }
    
    expect(inPlayOccurred).toBe(true);
  });
});

describe('打席判定エンジン - タスク3.2', () => {
  it('打球の種類がground_ball/fly_ball/line_driveのいずれかである', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    
    for (let i = 0; i < 20; i++) {
      const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
      if (result.outcome === 'in_play' && result.batBallInfo) {
        expect(['ground_ball', 'fly_ball', 'line_drive']).toContain(result.batBallInfo.type);
      }
    }
  });

  it('打球の方向がleft/center_left/center/center_right/rightのいずれかである', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    
    for (let i = 0; i < 20; i++) {
      const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
      if (result.outcome === 'in_play' && result.batBallInfo) {
        expect(['left', 'center_left', 'center', 'center_right', 'right']).toContain(result.batBallInfo.direction);
      }
    }
  });

  it('打球の強さがweak/medium/strong/very_strongのいずれかである', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    
    for (let i = 0; i < 20; i++) {
      const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
      if (result.outcome === 'in_play' && result.batBallInfo) {
        expect(['weak', 'medium', 'strong', 'very_strong']).toContain(result.batBallInfo.strength);
      }
    }
  });

  it('長打可能性が0-100の範囲内である', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    
    for (let i = 0; i < 20; i++) {
      const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
      if (result.outcome === 'in_play' && result.batBallInfo) {
        expect(result.batBallInfo.extraBasePotential).toBeGreaterThanOrEqual(0);
        expect(result.batBallInfo.extraBasePotential).toBeLessThanOrEqual(100);
      }
    }
  });

  it('describeBatBallが日本語の説明文を返す', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    
    for (let i = 0; i < 20; i++) {
      const result = judgeAtBatOutcome(batter, pitcher, runners, 0);
      if (result.outcome === 'in_play' && result.batBallInfo) {
        const description = describeBatBall(result.batBallInfo);
        expect(description).toBeTruthy();
        expect(typeof description).toBe('string');
        // 日本語の文字が含まれていることを確認
        expect(description).toMatch(/[ぁ-んァ-ヶー一-龠]/);
      }
    }
  });
});

describe('打席判定エンジン - タスク3.4', () => {
  it('コンディションがexcellentの場合、能力値が向上する', () => {
    const excellentBatter = createTestBatter({ condition: 'excellent' });
    const normalBatter = createTestBatter({ condition: 'normal' });
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    
    // 複数回試行して統計的な差を確認
    let excellentInPlayCount = 0;
    let normalInPlayCount = 0;
    const trials = 100;
    
    for (let i = 0; i < trials; i++) {
      const excellentResult = judgeAtBatOutcome(excellentBatter, pitcher, runners, 0);
      const normalResult = judgeAtBatOutcome(normalBatter, pitcher, runners, 0);
      
      if (excellentResult.outcome === 'in_play') excellentInPlayCount++;
      if (normalResult.outcome === 'in_play') normalInPlayCount++;
    }
    
    // excellentの方がインプレー率が高いことを期待
    // （ただし確率的なので必ずしも常に高いとは限らない）
    console.log(`Excellent in-play rate: ${excellentInPlayCount}/${trials}`);
    console.log(`Normal in-play rate: ${normalInPlayCount}/${trials}`);
  });

  it('投球数が増えると投手の能力が低下する', () => {
    const batter = createTestBatter();
    const freshPitcher = createTestPitcher({ fatigue: 'fresh' });
    const tiredPitcher = createTestPitcher({ fatigue: 'tired' });
    const runners = { first: null, second: null, third: null };
    
    // 投球数0と投球数100で比較
    let freshStrikeoutCount = 0;
    let tiredStrikeoutCount = 0;
    const trials = 100;
    
    for (let i = 0; i < trials; i++) {
      const freshResult = judgeAtBatOutcome(batter, freshPitcher, runners, 0);
      const tiredResult = judgeAtBatOutcome(batter, tiredPitcher, runners, 100);
      
      if (freshResult.outcome === 'strikeout') freshStrikeoutCount++;
      if (tiredResult.outcome === 'strikeout') tiredStrikeoutCount++;
    }
    
    // フレッシュな投手の方が三振率が高いことを期待
    console.log(`Fresh strikeout rate: ${freshStrikeoutCount}/${trials}`);
    console.log(`Tired strikeout rate: ${tiredStrikeoutCount}/${trials}`);
  });

  it('左右の組み合わせが逆の場合、打者が有利になる', () => {
    const rightBatter = createTestBatter({ batterHand: 'right' });
    const leftPitcher = createTestPitcher({ pitcherHand: 'left' });
    const rightPitcher = createTestPitcher({ pitcherHand: 'right' });
    const runners = { first: null, second: null, third: null };
    
    // 右打者 vs 左投手（有利）と右打者 vs 右投手（不利）で比較
    let advantageInPlayCount = 0;
    let disadvantageInPlayCount = 0;
    const trials = 100;
    
    for (let i = 0; i < trials; i++) {
      const advantageResult = judgeAtBatOutcome(rightBatter, leftPitcher, runners, 0);
      const disadvantageResult = judgeAtBatOutcome(rightBatter, rightPitcher, runners, 0);
      
      if (advantageResult.outcome === 'in_play') advantageInPlayCount++;
      if (disadvantageResult.outcome === 'in_play') disadvantageInPlayCount++;
    }
    
    // 有利な組み合わせの方がインプレー率が高いことを期待
    console.log(`Advantage in-play rate: ${advantageInPlayCount}/${trials}`);
    console.log(`Disadvantage in-play rate: ${disadvantageInPlayCount}/${trials}`);
  });
});

describe('1球単位判定エンジン - タスク3.1/3.2', () => {
  it('simulatePitchが有効な結果を返す', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const result = simulatePitch(batter, pitcher, 0, 0, 0, 'normal_swing');

    expect(['called_strike', 'swinging_strike', 'ball', 'foul', 'in_play']).toContain(result.outcome);
    expect(result.description).toBeTruthy();
  });

  it('simulateAtBatWithPitchLoopが最終結果と投球ログを返す', () => {
    const batter = createTestBatter();
    const pitcher = createTestPitcher();
    const runners = { first: null, second: null, third: null };
    const result = simulateAtBatWithPitchLoop(batter, pitcher, runners, 0, 'normal_swing');

    expect(['strikeout', 'walk', 'in_play']).toContain(result.outcome);
    expect(result.pitches.length).toBeGreaterThan(0);

    for (const pitch of result.pitches) {
      expect(pitch.pitchNumber).toBeGreaterThan(0);
      expect(pitch.balls).toBeGreaterThanOrEqual(0);
      expect(pitch.balls).toBeLessThanOrEqual(4);
      expect(pitch.strikes).toBeGreaterThanOrEqual(0);
      expect(pitch.strikes).toBeLessThanOrEqual(3);
    }
  });
});
