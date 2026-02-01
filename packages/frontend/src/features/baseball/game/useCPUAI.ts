/**
 * CPU AI統合フック
 * Requirement 10: CPU操作チームの戦術AI
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addPlayEvent } from './gameSlice';
import { getCPUAI, CPUAIEngine, CPUDifficulty, initializeCPUAI } from './cpuAI';
import { OffensiveInstruction, DefensiveInstruction } from '../types';

/**
 * CPU AIを使用するためのフック
 */
export function useCPUAI(
  onOffensiveInstruction: (instruction: OffensiveInstruction) => void,
  onDefensiveInstruction: (instruction: DefensiveInstruction | null) => void,
  difficulty: CPUDifficulty = 'intermediate'
) {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.game);
  const { phase, isPlayerHome, isTopHalf, currentInning } = gameState;

  // CPU AIの初期化
  useEffect(() => {
    initializeCPUAI({ difficulty, thinkingTimeMs: 1000 });
  }, [difficulty]);

  // CPUのターンかどうかを判定
  const isCPUTurn = useCallback(() => {
    // プレイヤーがホームの場合: 表はCPU（アウェイ）の攻撃、裏はプレイヤー（ホーム）の攻撃
    // プレイヤーがアウェイの場合: 表はプレイヤー（アウェイ）の攻撃、裏はCPU（ホーム）の攻撃
    const isCPUAttacking = (isPlayerHome && isTopHalf) || (!isPlayerHome && !isTopHalf);
    return isCPUAttacking && phase === 'awaiting_instruction';
  }, [isPlayerHome, isTopHalf, phase]);

  // CPU攻撃指示の自動実行
  useEffect(() => {
    if (!isCPUTurn()) return;

    const executeCPUInstruction = async () => {
      try {
        const cpuAI = getCPUAI();
        
        // AC 3: 思考時間を待機
        await cpuAI.waitThinking();

        // AC 1: 攻撃指示を決定
        const instruction = cpuAI.decideOffensiveInstruction(gameState);

        // AC 4: CPU指示を表示
        const event = {
          timestamp: Date.now(),
          inning: currentInning,
          isTopHalf,
          description: `（CPU監督）${getInstructionLabel(instruction)}の指示！`,
          type: 'at_bat_start' as const,
          source: 'cpu' as const,
        };
        dispatch(addPlayEvent(event));

        // 指示を実行
        onOffensiveInstruction(instruction);
      } catch (error) {
        console.error('CPU AI実行エラー:', error);
        // フォールバック: 通常打撃
        onOffensiveInstruction('normal_swing');
      }
    };

    // 少し遅延させて実行（UI更新のため）
    const timer = setTimeout(executeCPUInstruction, 500);
    return () => clearTimeout(timer);
  }, [isCPUTurn, gameState, dispatch, currentInning, isTopHalf, onOffensiveInstruction]);

  return {
    isCPUTurn,
  };
}

/**
 * CPU守備判断フック
 * 守備側のCPU判断を処理
 */
export function useCPUDefense(
  onDefensiveInstruction: (instruction: DefensiveInstruction | null) => void,
  difficulty: CPUDifficulty = 'intermediate'
) {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.game);
  const { phase, isPlayerHome, isTopHalf, currentInning } = gameState;

  // CPU守備側のターンかどうかを判定
  const isCPUDefending = useCallback(() => {
    // プレイヤーがホームの場合: 表はプレイヤー守備、裏はCPU守備
    // プレイヤーがアウェイの場合: 表はCPU守備、裏はプレイヤー守備
    const isCPUDefense = (!isPlayerHome && isTopHalf) || (isPlayerHome && !isTopHalf);
    return isCPUDefense && phase === 'awaiting_instruction';
  }, [isPlayerHome, isTopHalf, phase]);

  // CPU守備指示の自動実行
  useEffect(() => {
    if (!isCPUDefending()) return;

    const executeCPUDefense = async () => {
      try {
        const cpuAI = getCPUAI();
        
        // 思考時間を待機
        await cpuAI.waitThinking();

        // 守備指示を決定
        const instruction = cpuAI.decideDefensiveInstruction(gameState);

        if (instruction) {
          // 指示がある場合は表示
          const event = {
            timestamp: Date.now(),
            inning: currentInning,
            isTopHalf,
            description: `（CPU監督）${getDefensiveInstructionLabel(instruction)}！`,
            type: 'at_bat_start' as const,
            source: 'cpu' as const,
          };
          dispatch(addPlayEvent(event));
        }

        // 指示を実行（nullの場合は通常守備）
        onDefensiveInstruction(instruction);
      } catch (error) {
        console.error('CPU守備AI実行エラー:', error);
        // フォールバック: 通常守備
        onDefensiveInstruction(null);
      }
    };

    const timer = setTimeout(executeCPUDefense, 500);
    return () => clearTimeout(timer);
  }, [isCPUDefending, gameState, dispatch, currentInning, isTopHalf, onDefensiveInstruction]);

  return {
    isCPUDefending,
  };
}

/**
 * 指示ラベルを取得
 */
function getInstructionLabel(instruction: OffensiveInstruction): string {
  const labels: Record<OffensiveInstruction, string> = {
    normal_swing: '通常打撃',
    bunt: 'バント',
    hit_and_run: 'エンドラン',
    steal: '盗塁',
    wait: '待て',
    squeeze: 'スクイズ',
    double_steal: 'ダブルスチール',
  };
  return labels[instruction] || instruction;
}

/**
 * 守備指示ラベルを取得
 */
function getDefensiveInstructionLabel(instruction: DefensiveInstruction): string {
  const labels: Record<DefensiveInstruction, string> = {
    normal: '通常守備',
    pitcher_change: '投手交代',
    intentional_walk: '敬遠',
    defensive_shift: '守備シフト',
  };
  return labels[instruction] || instruction;
}
