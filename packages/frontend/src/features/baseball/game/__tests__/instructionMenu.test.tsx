/**
 * タスク2実装テスト
 * 監督指示システムの動作確認用ユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import gameReducer, { GameState, setTeams, startGame, startInning, startAtBat, updateRunners } from '../gameSlice';
import { OffensiveInstructionMenu } from '../OffensiveInstructionMenu';
import { DefensiveInstructionMenu } from '../DefensiveInstructionMenu';
import { TeamInGame, PlayerInGame, OffensiveInstruction, DefensiveInstruction } from '../../types';

// テスト用のストアを作成するヘルパー
function createTestStore(initialState?: Partial<GameState>) {
  const preloadedState = initialState ? { game: { ...getInitialGameState(), ...initialState } } : undefined;
  return configureStore({
    reducer: {
      game: gameReducer,
    },
    preloadedState,
  });
}

function getInitialGameState(): GameState {
  return {
    phase: 'idle',
    gameId: null,
    homeTeam: null,
    awayTeam: null,
    score: {
      home: 0,
      away: 0,
      innings: [],
    },
    currentInning: 1,
    isTopHalf: true,
    outs: 0,
    runners: {
      first: null,
      second: null,
      third: null,
    },
    currentAtBat: null,
    currentPitcher: null,
    playLog: [],
    playLogArchive: [],
    maxInnings: 12,
    isPlayerHome: true,
    defensiveShift: 'normal',
    shiftLockRemaining: 0,
    gameStartTime: null,
    elapsedSeconds: 0,
  };
}

// テスト用のチームデータを作成
function createTestTeam(teamId: string, teamName: string): TeamInGame {
  const players: PlayerInGame[] = [];
  
  // 投手
  players.push(createTestPlayer(`${teamId}-p`, '投手', 'P'));
  
  // 捕手
  players.push(createTestPlayer(`${teamId}-c`, '捕手', 'C'));
  
  // 内野手
  players.push(createTestPlayer(`${teamId}-1b`, '一塁手', '1B'));
  players.push(createTestPlayer(`${teamId}-2b`, '二塁手', '2B'));
  players.push(createTestPlayer(`${teamId}-3b`, '三塁手', '3B'));
  players.push(createTestPlayer(`${teamId}-ss`, '遊撃手', 'SS'));
  
  // 外野手
  players.push(createTestPlayer(`${teamId}-lf`, '左翼手', 'LF'));
  players.push(createTestPlayer(`${teamId}-cf`, '中堅手', 'CF'));
  players.push(createTestPlayer(`${teamId}-rf`, '右翼手', 'RF'));

  return {
    teamId,
    teamName,
    lineup: players,
    currentBatterIndex: 0,
  };
}

function createTestPlayer(id: string, name: string, position: PlayerInGame['position']): PlayerInGame {
  return {
    id,
    name,
    teamId: 'test-team',
    position,
    batterHand: 'right',
    pitcherHand: position === 'P' ? 'right' : undefined,
    batting: {
      contact: 70,
      babip: 65,
      gapPower: 60,
      hrPower: 55,
      eye: 65,
      avoidKs: 70,
      vsLHP: 70,
      vsRHP: 65,
    },
    pitching: position === 'P' ? {
      stuff: 75,
      movement: 70,
      control: 65,
      stamina: 80,
      groundBallPct: 60,
      velocity: 75,
      holdRunners: 60,
    } : undefined,
    running: {
      speed: 60,
      stealingAbility: 50,
      stealingAggr: 40,
      baserunning: 60,
    },
    fielding: {
      infieldRange: 65,
      outfieldRange: 60,
      infieldError: 70,
      outfieldError: 65,
      infieldArm: 65,
      outfieldArm: 60,
      turnDP: 60,
      catcherAbility: position === 'C' ? 70 : undefined,
      catcherArm: position === 'C' ? 75 : undefined,
      sacrificeBunt: 60,
      buntForHit: 55,
      positionRatings: {
        [position]: 'B' as const,
      },
    },
    condition: 'normal',
    fatigue: 'normal',
  };
}

describe('監督指示システム - タスク2', () => {
  let homeTeam: TeamInGame;
  let awayTeam: TeamInGame;

  beforeEach(() => {
    homeTeam = createTestTeam('home', 'ホームチーム');
    awayTeam = createTestTeam('away', 'アウェイチーム');
  });

  describe('2.1 攻撃指示メニューと有効条件', () => {
    it('打席開始時に基本指示が提示される', () => {
      // 試合状態を準備
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = false;
      state.phase = 'awaiting_instruction';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };

      const store = createTestStore(state);
      const onSelect = (instruction: OffensiveInstruction) => {};

      render(
        <Provider store={store}>
          <OffensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // 基本指示が表示されることを確認
      expect(screen.getByText('通常打撃')).toBeInTheDocument();
      expect(screen.getByText('待て')).toBeInTheDocument();
      expect(screen.getByText('バント')).toBeInTheDocument();
    });

    it('走者一塁の場合、盗塁とヒットエンドランが有効になる', () => {
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = false;
      state.phase = 'awaiting_instruction';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.runners = {
        first: { playerId: 'runner1', playerName: '走者1' },
        second: null,
        third: null,
      };

      const store = createTestStore(state);
      const onSelect = (instruction: OffensiveInstruction) => {};

      render(
        <Provider store={store}>
          <OffensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // 盗塁とヒットエンドランが表示されることを確認
      expect(screen.getByText('盗塁')).toBeInTheDocument();
      expect(screen.getByText('ヒットエンドラン')).toBeInTheDocument();

      // ボタンが有効化されていることを確認（disabledでないこと）
      const stealButton = screen.getByText('盗塁').closest('button');
      const hitAndRunButton = screen.getByText('ヒットエンドラン').closest('button');
      expect(stealButton).not.toBeDisabled();
      expect(hitAndRunButton).not.toBeDisabled();
    });

    it('走者三塁の場合、スクイズが有効になる', () => {
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = false;
      state.phase = 'awaiting_instruction';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.runners = {
        first: null,
        second: null,
        third: { playerId: 'runner3', playerName: '走者3' },
      };

      const store = createTestStore(state);
      const onSelect = (instruction: OffensiveInstruction) => {};

      render(
        <Provider store={store}>
          <OffensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // スクイズが表示されることを確認
      expect(screen.getByText('スクイズ')).toBeInTheDocument();

      // ボタンが有効化されていることを確認
      const squeezeButton = screen.getByText('スクイズ').closest('button');
      expect(squeezeButton).not.toBeDisabled();
    });

    it('複数走者の場合、ダブルスチールが有効になる', () => {
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = false;
      state.phase = 'awaiting_instruction';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.runners = {
        first: { playerId: 'runner1', playerName: '走者1' },
        second: { playerId: 'runner2', playerName: '走者2' },
        third: null,
      };

      const store = createTestStore(state);
      const onSelect = (instruction: OffensiveInstruction) => {};

      render(
        <Provider store={store}>
          <OffensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // ダブルスチールが表示されることを確認
      expect(screen.getByText('ダブルスチール')).toBeInTheDocument();

      // ボタンが有効化されていることを確認
      const doubleStealButton = screen.getByText('ダブルスチール').closest('button');
      expect(doubleStealButton).not.toBeDisabled();
    });

    it('走者なしの場合、走者依存の指示が無効になる', () => {
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = false;
      state.phase = 'awaiting_instruction';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.runners = {
        first: null,
        second: null,
        third: null,
      };

      const store = createTestStore(state);
      const onSelect = (instruction: OffensiveInstruction) => {};

      render(
        <Provider store={store}>
          <OffensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // 盗塁とヒットエンドランとスクイズが無効化されていることを確認
      const stealButton = screen.getByText('盗塁').closest('button');
      const hitAndRunButton = screen.getByText('ヒットエンドラン').closest('button');
      const squeezeButton = screen.getByText('スクイズ').closest('button');

      expect(stealButton).toBeDisabled();
      expect(hitAndRunButton).toBeDisabled();
      expect(squeezeButton).toBeDisabled();
    });
  });

  describe('2.2 守備指示メニューと投手/シフト操作', () => {
    it('守備ターンで指示メニューが表示される', () => {
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = true;
      state.phase = 'awaiting_instruction';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.currentPitcher = {
        playerId: homeTeam.lineup[0].id,
        playerName: homeTeam.lineup[0].name,
        pitchCount: 50,
        currentPitcher: homeTeam.lineup[0],
      };

      const store = createTestStore(state);
      const onSelect = (instruction: DefensiveInstruction) => {};

      render(
        <Provider store={store}>
          <DefensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // 基本指示が表示されることを確認
      expect(screen.getByText('通常守備')).toBeInTheDocument();
      expect(screen.getByText('投手交代')).toBeInTheDocument();
      expect(screen.getByText('敬遠')).toBeInTheDocument();
      expect(screen.getByText('守備シフト変更')).toBeInTheDocument();
    });

    it('投手交代時に候補と疲労情報が提示される', () => {
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = true;
      state.phase = 'awaiting_instruction';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.currentPitcher = {
        playerId: homeTeam.lineup[0].id,
        playerName: homeTeam.lineup[0].name,
        pitchCount: 105, // 限界を超えている
        currentPitcher: homeTeam.lineup[0],
      };

      const store = createTestStore(state);
      const onSelect = (instruction: DefensiveInstruction) => {};

      render(
        <Provider store={store}>
          <DefensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // 投手交代ボタンに疲労警告が表示されることを確認
      expect(screen.getByText(/投手が疲労しています（交代推奨）/)).toBeInTheDocument();
    });

    it('守備シフトの実行を反映する', () => {
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = true;
      state.phase = 'awaiting_instruction';
      state.defensiveShift = 'normal';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.currentPitcher = {
        playerId: homeTeam.lineup[0].id,
        playerName: homeTeam.lineup[0].name,
        pitchCount: 50,
        currentPitcher: homeTeam.lineup[0],
      };

      const store = createTestStore(state);
      const onSelect = (instruction: DefensiveInstruction) => {};

      render(
        <Provider store={store}>
          <DefensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // 守備シフト変更ボタンが表示されることを確認
      expect(screen.getByText('守備シフト変更')).toBeInTheDocument();
    });

    it('敬遠指示が一塁が空いている時のみ有効', () => {
      // 一塁が空いている場合
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = true;
      state.phase = 'awaiting_instruction';
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.currentPitcher = {
        playerId: homeTeam.lineup[0].id,
        playerName: homeTeam.lineup[0].name,
        pitchCount: 50,
        currentPitcher: homeTeam.lineup[0],
      };
      state.runners = {
        first: null,
        second: null,
        third: null,
      };

      const store = createTestStore(state);
      const onSelect = (instruction: DefensiveInstruction) => {};

      const { unmount } = render(
        <Provider store={store}>
          <DefensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // 敬遠ボタンが有効であることを確認
      const walkButton = screen.getByText('敬遠').closest('button');
      expect(walkButton).not.toBeDisabled();

      unmount();

      // 一塁に走者がいる場合
      state.runners.first = { playerId: 'runner1', playerName: '走者1' };

      const store2 = createTestStore(state);

      render(
        <Provider store={store2}>
          <DefensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // 敬遠ボタンが無効であることを確認
      const walkButton2 = screen.getByText('敬遠').closest('button');
      expect(walkButton2).toBeDisabled();
    });
  });

  describe('2.3 指示制限とフィードバック', () => {
    it('無効指示に対して警告が表示される', () => {
      let state = getInitialGameState();
      state.homeTeam = homeTeam;
      state.awayTeam = awayTeam;
      state.isPlayerHome = false;
      state.phase = 'awaiting_instruction';
      state.outs = 2; // ツーアウト
      state.currentAtBat = {
        batterId: awayTeam.lineup[0].id,
        batterName: awayTeam.lineup[0].name,
        batterIndex: 0,
        pitcherId: homeTeam.lineup[0].id,
        pitcherName: homeTeam.lineup[0].name,
        balls: 0,
        strikes: 0,
      };
      state.runners = {
        first: { playerId: 'runner1', playerName: '走者1' },
        second: null,
        third: null,
      };

      const store = createTestStore(state);
      const onSelect = (instruction: OffensiveInstruction) => {};

      render(
        <Provider store={store}>
          <OffensiveInstructionMenu onSelectInstruction={onSelect} />
        </Provider>
      );

      // ツーアウトでの盗塁に警告が表示されることを確認
      expect(screen.getByText(/ツーアウトです（推奨度低）/)).toBeInTheDocument();
    });
  });
});
