import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  startInning, 
  startAtBat, 
  endAtBat, 
  recordOut, 
  endHalfInning, 
  checkGameEnd, 
  addScore, 
  addPlayEvent,
  updateRunners,
  updatePitchCount
} from '../game/gameSlice';
import { OffensiveInstructionMenu } from './OffensiveInstructionMenu';
import { DefensiveInstructionMenu } from './DefensiveInstructionMenu';
import { OffensiveInstruction, DefensiveInstruction, DefensiveShift, PlayEvent, Runner, RunnerState } from '../types';
import { 
  judgeAtBatOutcome, 
  describeBatBall, 
  DefensivePlayInput 
} from './atBatEngine';
import { processDefensivePlay } from './defensiveEngine';
import { 
  judgeBunt, 
  judgeSqueeze, 
  determineBuntFielder,
  processBuntDefensive,
  BuntType
} from './buntEngine';
import {
  judgeSteal,
  judgeDoubleSteal,
  judgeHitAndRun,
  judgePickoff
} from './stealingEngine';
// タスク11: エラーハンドリングとユーザビリティ
import { ErrorBoundary } from './ErrorBoundary';
import { Toast, useToast } from './Toast';
import { SettingsModal } from './SettingsModal';
import { HelpModal } from './HelpModal';
import { PauseMenu } from './PauseMenu';
import { ResumeGameDialog } from './ResumeGameDialog';
import { validateOffensiveInstruction, formatValidationError, getErrorSeverity } from './validation';
import { loadSettings, applyTheme, mapDifficultyToCPU } from './settings';
import { autoSaveGame, startAutoSaveInterval, saveOnInningEnd } from './autoSave';
// タスク14: CPU戦術AIの実装
import { useCPUAI } from './useCPUAI';
import './GameScreen.css';

/**
 * GameScreen - 試合画面（タスク11統合版）
 */
export function GameScreen() {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.game);
  const { phase, currentInning, isTopHalf, outs, score, homeTeam, awayTeam, playLog, currentAtBat, runners } = gameState;

  // タスク11: UI状態管理
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  
  // タスク11: Toast通知
  const { messages, removeToast, error, warning, success, info } = useToast();

  // タスク14: CPU AIの設定
  const [cpuDifficulty, setCpuDifficulty] = useState(mapDifficultyToCPU('normal'));

  // タスク11: 設定の読み込みとテーマ適用
  useEffect(() => {
    const settings = loadSettings();
    applyTheme(settings.theme);
    // タスク14: 難易度をCPU AIに適用
    setCpuDifficulty(mapDifficultyToCPU(settings.difficulty));
  }, []);

  // タスク11: 自動保存（30秒ごと）
  useEffect(() => {
    const cleanup = startAutoSaveInterval(() => {
      autoSaveGame(gameState);
    });
    return cleanup;
  }, [gameState]);

  // タスク11: イニング終了時の保存
  useEffect(() => {
    if (phase === 'half_inning_end') {
      saveOnInningEnd(gameState);
    }
  }, [phase, gameState]);

  useEffect(() => {
    // イニング開始フェーズの場合、自動的にイニングを開始
    if (phase === 'inning_start') {
      const timer = setTimeout(() => {
        dispatch(startInning());
      }, 2000);
      return () => clearTimeout(timer);
    }

    // at_batフェーズの場合、打席を開始
    if (phase === 'at_bat') {
      const timer = setTimeout(() => {
        dispatch(startAtBat());
      }, 1000);
      return () => clearTimeout(timer);
    }

    // result_displayフェーズの場合、次の打者へ
    if (phase === 'result_display') {
      const timer = setTimeout(() => {
        dispatch(endAtBat());
      }, 2000);
      return () => clearTimeout(timer);
    }

    // half_inning_endフェーズの場合、次の半イニングへ
    if (phase === 'half_inning_end') {
      const timer = setTimeout(() => {
        // 試合終了判定を実行
        dispatch(checkGameEnd());
        
        // game_endフェーズでなければ次の半イニングへ
        const state = gameState;
        if (state.phase !== 'game_end') {
          dispatch(endHalfInning());
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase, dispatch, gameState]);

  if (!homeTeam || !awayTeam) {
    return <div>試合データが見つかりません</div>;
  }

  const attackingTeam = isTopHalf ? awayTeam : homeTeam;
  const defendingTeam = isTopHalf ? homeTeam : awayTeam;

  // プレイヤーが攻撃側か守備側かを判定
  const isPlayerAttacking = (gameState.isPlayerHome && !isTopHalf) || (!gameState.isPlayerHome && isTopHalf);

  // 攻撃指示を処理
  const handleOffensiveInstruction = (instruction: OffensiveInstruction) => {
    if (!currentAtBat || !homeTeam || !awayTeam) return;

    // タスク11.1: 入力検証
    const validationError = validateOffensiveInstruction(instruction, runners, outs);
    if (validationError) {
      const severity = getErrorSeverity(validationError);
      const message = formatValidationError(validationError);
      
      if (severity === 'error') {
        // ブロッキングエラー - 実行を中止
        error(message);
        return;
      } else {
        // 警告 - 実行は継続するが警告を表示
        warning(message);
      }
    }

    const attackingTeam = isTopHalf ? awayTeam : homeTeam;
    const defendingTeam = isTopHalf ? homeTeam : awayTeam;

    // 打者と投手を取得
    const batter = attackingTeam.lineup.find(p => p.id === currentAtBat.batterId);
    const pitcher = defendingTeam.lineup.find(p => p.id === currentAtBat.pitcherId);

    if (!batter || !pitcher) return;

    // 指示実行イベントを追加
    const instructionEvent: PlayEvent = {
      timestamp: Date.now(),
      inning: currentInning,
      isTopHalf,
      description: `監督指示: ${getInstructionLabel(instruction)}`,
      type: 'at_bat_start',
      source: 'player',
    };
    dispatch(addPlayEvent(instructionEvent));

    // 投球数を更新
    const pitchCount = gameState.currentPitcher?.pitchCount || 0;
    dispatch(updatePitchCount(pitchCount + 1));

    // タスク5: バント/スクイズの処理
    if (instruction === 'bunt' || instruction === 'squeeze') {
      setTimeout(() => {
        handleBuntInstruction(instruction, batter, pitcher, runners, currentAtBat, defendingTeam, pitchCount);
      }, 1000);
      return;
    }

    // タスク7: 盗塁/ダブルスチール/エンドランの処理
    if (instruction === 'steal' || instruction === 'double_steal' || instruction === 'hit_and_run') {
      setTimeout(() => {
        handleStealingInstruction(instruction, batter, pitcher, runners, currentAtBat, attackingTeam, defendingTeam);
      }, 1000);
      return;
    }

    // タスク3: 打席判定エンジンを使用
    setTimeout(() => {
      // 3.1 投手対打者の一次判定
      const atBatResult = judgeAtBatOutcome(batter, pitcher, runners, pitchCount, instruction);

      // 結果イベントを追加
      const resultEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: currentInning,
        isTopHalf,
        description: atBatResult.description,
        type: atBatResult.outcome === 'strikeout' ? 'strikeout' : 
              atBatResult.outcome === 'walk' ? 'walk' : 'at_bat_start',
        source: 'player',
      };
      dispatch(addPlayEvent(resultEvent));

      // 三振の場合
      if (atBatResult.outcome === 'strikeout') {
        dispatch(recordOut({ description: `${batter.name}は三振しました。` }));
        return;
      }

      // 四球の場合
      if (atBatResult.outcome === 'walk') {
        // 走者を進塁
        const newRunners = { ...runners };
        if (runners.first) {
          if (runners.second) {
            if (runners.third) {
              // 満塁押し出し
              const scoringTeam = isTopHalf ? 'away' : 'home';
              dispatch(addScore({ team: scoringTeam, points: 1 }));
            } else {
              newRunners.third = runners.second;
            }
          } else {
            newRunners.second = runners.first;
          }
        }
        newRunners.first = { playerId: batter.id, playerName: batter.name };
        dispatch(updateRunners(newRunners));
        
        setTimeout(() => {
          dispatch(endAtBat());
        }, 1500);
        return;
      }

      // インプレーの場合（3.2 打球判定）
      if (atBatResult.outcome === 'in_play' && atBatResult.batBallInfo) {
        const batBallDescription = describeBatBall(atBatResult.batBallInfo);
        const batBallEvent: PlayEvent = {
          timestamp: Date.now(),
          inning: currentInning,
          isTopHalf,
          description: batBallDescription,
          type: 'at_bat_start',
          source: 'player',
        };
        dispatch(addPlayEvent(batBallEvent));

        // 3.3 守備判定への接続
        setTimeout(() => {
          const defensiveInput: DefensivePlayInput = {
            batBallInfo: atBatResult.batBallInfo!,
            batter,
            runners,
            outs
          };

          const defensiveResult = processDefensivePlay(
            defensiveInput, 
            defendingTeam.lineup, 
            gameState.defensiveShift
          );

          // 守備結果イベントを追加
          const defensiveEvent: PlayEvent = {
            timestamp: Date.now(),
            inning: currentInning,
            isTopHalf,
            description: defensiveResult.description,
            type: defensiveResult.outcome === 'home_run' ? 'home_run' : 
                  defensiveResult.outcome === 'error' ? 'error' :
                  defensiveResult.outsRecorded > 0 ? 'out' : 'hit',
            source: 'player',
          };
          dispatch(addPlayEvent(defensiveEvent));

          // 走者の進塁を処理
          const newRunners: RunnerState = { first: null, second: null, third: null };
          const scoringTeam = isTopHalf ? 'away' : 'home';

          // 本塁打の場合は全走者クリア
          if (defensiveResult.outcome === 'home_run') {
            // 得点を加算（バッター含む）
            if (defensiveResult.runsScored > 0) {
              dispatch(addScore({ team: scoringTeam, points: defensiveResult.runsScored }));
            }
            dispatch(updateRunners(newRunners));
          } else {
            // その他の結果の場合、進塁を適用
            for (const advance of defensiveResult.runnersAdvanced) {
              if (advance.from === 'batter' && advance.to !== 'out' && advance.to !== 'home') {
                const runnerData: Runner = { playerId: batter.id, playerName: batter.name };
                if (advance.to === 'first') {
                  newRunners.first = runnerData;
                } else if (advance.to === 'second') {
                  newRunners.second = runnerData;
                } else if (advance.to === 'third') {
                  newRunners.third = runnerData;
                }
              } else if (advance.from !== 'batter' && advance.to !== 'out') {
                // 既存走者の進塁
                const existingRunner = runners[advance.from];
                if (existingRunner) {
                  if (advance.to === 'first') {
                    newRunners.first = existingRunner;
                  } else if (advance.to === 'second') {
                    newRunners.second = existingRunner;
                  } else if (advance.to === 'third') {
                    newRunners.third = existingRunner;
                  }
                  // advance.to === 'home' の場合は得点処理済み
                }
              }
            }

            // 得点を加算
            if (defensiveResult.runsScored > 0) {
              dispatch(addScore({ team: scoringTeam, points: defensiveResult.runsScored }));
            }

            // 走者を更新
            dispatch(updateRunners(newRunners));
          }

          // アウトを記録
          if (defensiveResult.outsRecorded > 0) {
            setTimeout(() => {
              dispatch(recordOut({ description: defensiveResult.description }));
            }, 1500);
          } else {
            // アウトでなければ次の打者へ
            setTimeout(() => {
              dispatch(endAtBat());
            }, 1500);
          }
        }, 1000);
      }
    }, 1500);
  };

  // 守備指示を処理
  const handleDefensiveInstruction = (instruction: DefensiveInstruction | null) => {
    // nullの場合は通常守備として扱う
    const actualInstruction = instruction || 'normal';
    
    const instructionEvent: PlayEvent = {
      timestamp: Date.now(),
      inning: currentInning,
      isTopHalf,
      description: `監督指示: ${getDefensiveInstructionLabel(actualInstruction)}`,
      type: 'at_bat_start',
      source: 'player',
    };
    dispatch(addPlayEvent(instructionEvent));

    // 守備指示の処理（次のタスクで実装予定）
    // 通常守備の場合は何もせず次に進む
    if (actualInstruction === 'normal') {
      // 打席へ進む
      dispatch(startAtBat());
    }
  };

  // タスク14: CPU AIフックの統合
  useCPUAI(
    handleOffensiveInstruction,
    handleDefensiveInstruction,
    cpuDifficulty
  );

  // タスク5: バント/スクイズ指示の処理
  const handleBuntInstruction = (
    instruction: 'bunt' | 'squeeze',
    batter: any,
    pitcher: any,
    runners: RunnerState,
    currentAtBat: any,
    defendingTeam: any,
    pitchCount: number
  ) => {
    const balls = currentAtBat.balls || 0;
    const strikes = currentAtBat.strikes || 0;

    let buntResult;
    let isSqueezePlay = false;

    // スクイズの場合
    if (instruction === 'squeeze' && runners.third) {
      isSqueezePlay = true;
      const thirdRunnerPlayer = attackingTeam?.lineup.find(p => p.id === runners.third?.playerId);
      
      if (!thirdRunnerPlayer) {
        console.error('三塁走者が見つかりません');
        return;
      }

      buntResult = judgeSqueeze(batter, pitcher, runners.third, thirdRunnerPlayer, balls, strikes);
    } else {
      // 通常バントの場合
      buntResult = judgeBunt(batter, pitcher, 'sacrifice', runners, balls, strikes);
    }

    // バント結果イベントを追加
    const buntEvent: PlayEvent = {
      timestamp: Date.now(),
      inning: currentInning,
      isTopHalf,
      description: buntResult.description,
      type: 'at_bat_start',
      source: 'player',
    };
    dispatch(addPlayEvent(buntEvent));

    // バント失敗の処理
    if (!buntResult.success) {
      // 5.4 バント失敗の処理
      if (buntResult.isStrikeout) {
        // 三振アウト
        setTimeout(() => {
          dispatch(recordOut({ description: `${batter.name}は三振しました。` }));
        }, 1500);
      } else if (buntResult.isPopup) {
        // 打ち損じの小フライ（捕手または投手がキャッチ）
        setTimeout(() => {
          dispatch(recordOut({ description: `${batter.name}の打ち損じを捕手が捕球。アウト！` }));
        }, 1500);
      } else if (buntResult.isFoul) {
        // ファウル（カウント進行のみ）
        setTimeout(() => {
          dispatch(endAtBat());
        }, 1500);
      }
      return;
    }

    // バント成功の場合、守備処理へ
    if (!buntResult.buntBallInfo) {
      console.error('バント打球情報がありません');
      return;
    }

    // 5.1 守備選手を特定
    const fielderPositions = determineBuntFielder(buntResult.buntBallInfo);
    const fielder = defendingTeam.lineup.find((p: any) => p.position === fielderPositions.primaryPosition);
    const assistFielder = fielderPositions.assistPosition 
      ? defendingTeam.lineup.find((p: any) => p.position === fielderPositions.assistPosition)
      : undefined;

    if (!fielder) {
      console.error('守備選手が見つかりません');
      return;
    }

    setTimeout(() => {
      // 5.2 バント守備処理
      const defensiveResult = processBuntDefensive(
        buntResult.buntBallInfo!,
        batter,
        fielder,
        assistFielder,
        runners,
        outs
      );

      // 守備結果イベントを追加
      const defensiveEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: currentInning,
        isTopHalf,
        description: defensiveResult.description,
        type: defensiveResult.batterOut ? 'out' : 'hit',
        source: 'player',
      };
      dispatch(addPlayEvent(defensiveEvent));

      // スクイズの場合の得点処理
      if (isSqueezePlay && 'runnerSafe' in buntResult && buntResult.runnerSafe) {
        const scoringTeam = isTopHalf ? 'away' : 'home';
        dispatch(addScore({ team: scoringTeam, points: 1 }));
      }

      // 走者の進塁を処理
      const newRunners: RunnerState = { first: null, second: null, third: null };
      const scoringTeam = isTopHalf ? 'away' : 'home';

      for (const advance of defensiveResult.runnersAdvanced) {
        if (advance.from === 'batter' && advance.to !== 'out' && advance.to !== 'home') {
          const runnerData: Runner = { playerId: batter.id, playerName: batter.name };
          if (advance.to === 'first') {
            newRunners.first = runnerData;
          } else if (advance.to === 'second') {
            newRunners.second = runnerData;
          } else if (advance.to === 'third') {
            newRunners.third = runnerData;
          }
        } else if (advance.from !== 'batter' && advance.to !== 'out') {
          // 既存走者の進塁
          const existingRunner = runners[advance.from];
          if (existingRunner) {
            if (advance.to === 'home') {
              // 得点（スクイズ以外の得点）
              if (!isSqueezePlay || advance.from !== 'third') {
                dispatch(addScore({ team: scoringTeam, points: 1 }));
              }
            } else if (advance.to === 'first') {
              newRunners.first = existingRunner;
            } else if (advance.to === 'second') {
              newRunners.second = existingRunner;
            } else if (advance.to === 'third') {
              newRunners.third = existingRunner;
            }
          }
        }
      }

      // 走者を更新
      dispatch(updateRunners(newRunners));

      // アウトを記録
      if (defensiveResult.batterOut || (isSqueezePlay && 'runnerSafe' in buntResult && !buntResult.runnerSafe)) {
        setTimeout(() => {
          dispatch(recordOut({ description: defensiveResult.description }));
        }, 1500);
      } else {
        // アウトでなければ次の打者へ
        setTimeout(() => {
          dispatch(endAtBat());
        }, 1500);
      }
    }, 1000);
  };

  // タスク7: 盗塁/ダブルスチール/エンドラン指示の処理
  const handleStealingInstruction = (
    instruction: 'steal' | 'double_steal' | 'hit_and_run',
    batter: any,
    pitcher: any,
    runners: RunnerState,
    currentAtBat: any,
    attackingTeam: any,
    defendingTeam: any
  ) => {
    // 捕手を取得
    const catcher = defendingTeam.lineup.find((p: any) => p.position === 'C');
    if (!catcher) {
      console.error('捕手が見つかりません');
      return;
    }

    // 内野手を取得
    const infielders = defendingTeam.lineup.filter((p: any) => 
      ['1B', '2B', '3B', 'SS'].includes(p.position)
    );

    const scoringTeam = isTopHalf ? 'away' : 'home';

    // 7.2: ダブルスチールの処理
    if (instruction === 'double_steal') {
      const runnerPlayers = {
        first: runners.first ? attackingTeam.lineup.find((p: any) => p.id === runners.first?.playerId) : undefined,
        second: runners.second ? attackingTeam.lineup.find((p: any) => p.id === runners.second?.playerId) : undefined,
        third: runners.third ? attackingTeam.lineup.find((p: any) => p.id === runners.third?.playerId) : undefined,
      };

      const doubleStealResult = judgeDoubleSteal(
        runners,
        runnerPlayers,
        pitcher,
        catcher,
        infielders
      );

      // 結果イベントを追加
      const stealEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: currentInning,
        isTopHalf,
        description: doubleStealResult.commentary,
        type: 'at_bat_start',
        source: 'player',
      };
      dispatch(addPlayEvent(stealEvent));

      // 走者を更新
      const newRunners: RunnerState = { first: null, second: null, third: null };
      let outsRecorded = 0;
      let runsScored = 0;

      for (const result of doubleStealResult.results) {
        if (result.success) {
          // 盗塁成功
          if (result.targetBase === 'home') {
            runsScored++;
          } else {
            const runnerData: Runner = { playerId: result.runner.playerId, playerName: result.runner.playerName };
            newRunners[result.targetBase] = runnerData;
          }
        } else if (result.caughtStealing) {
          // 盗塁失敗（アウト）
          outsRecorded++;
        } else {
          // 進塁せず（元の塁に留まる）
          // この場合は元の走者情報を維持
        }
      }

      // 得点を加算
      if (runsScored > 0) {
        dispatch(addScore({ team: scoringTeam, points: runsScored }));
      }

      // 走者を更新
      dispatch(updateRunners(newRunners));

      // アウトを記録
      if (outsRecorded > 0) {
        setTimeout(() => {
          dispatch(recordOut({ description: doubleStealResult.commentary }));
        }, 1500);
      } else {
        // アウトでなければ次の打者へ
        setTimeout(() => {
          dispatch(endAtBat());
        }, 1500);
      }
      return;
    }

    // 7.1: 通常盗塁の処理
    if (instruction === 'steal') {
      // 盗塁を試みる走者を特定（最も先頭の走者）
      let runnerToSteal: Runner | null = null;
      let currentBase: 'first' | 'second' | 'third' | null = null;
      let runnerPlayer: any = null;

      if (runners.first) {
        runnerToSteal = runners.first;
        currentBase = 'first';
        runnerPlayer = attackingTeam.lineup.find((p: any) => p.id === runners.first?.playerId);
      } else if (runners.second) {
        runnerToSteal = runners.second;
        currentBase = 'second';
        runnerPlayer = attackingTeam.lineup.find((p: any) => p.id === runners.second?.playerId);
      } else if (runners.third) {
        runnerToSteal = runners.third;
        currentBase = 'third';
        runnerPlayer = attackingTeam.lineup.find((p: any) => p.id === runners.third?.playerId);
      }

      if (!runnerToSteal || !currentBase || !runnerPlayer) {
        console.error('盗塁を試みる走者が見つかりません');
        return;
      }

      const stealResult = judgeSteal(
        runnerToSteal,
        currentBase,
        runnerPlayer,
        pitcher,
        catcher,
        infielders
      );

      // 結果イベントを追加
      const stealEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: currentInning,
        isTopHalf,
        description: stealResult.commentary,
        type: 'at_bat_start',
        source: 'player',
      };
      dispatch(addPlayEvent(stealEvent));

      // 走者を更新
      const newRunners: RunnerState = { ...runners };
      
      if (stealResult.success) {
        // 盗塁成功
        if (stealResult.targetBase === 'home') {
          // 本塁盗塁成功（得点）
          if (currentBase === 'third') newRunners.third = null;
          dispatch(addScore({ team: scoringTeam, points: 1 }));
        } else {
          // その他の塁への盗塁成功
          if (currentBase === 'first') {
            newRunners.first = null;
            newRunners.second = runnerToSteal;
          } else if (currentBase === 'second') {
            newRunners.second = null;
            newRunners.third = runnerToSteal;
          }
        }
      } else {
        // 盗塁失敗（アウト）
        if (currentBase === 'first') newRunners.first = null;
        else if (currentBase === 'second') newRunners.second = null;
        else if (currentBase === 'third') newRunners.third = null;
      }

      dispatch(updateRunners(newRunners));

      // アウトを記録
      if (stealResult.caughtStealing) {
        setTimeout(() => {
          dispatch(recordOut({ description: stealResult.commentary }));
        }, 1500);
      } else {
        // アウトでなければ次の打者へ
        setTimeout(() => {
          dispatch(endAtBat());
        }, 1500);
      }
      return;
    }

    // 7.3: エンドランの処理
    if (instruction === 'hit_and_run') {
      // エンドランを試みる走者を特定（一塁または二塁）
      let runnerToSteal: Runner | null = null;
      let currentBase: 'first' | 'second' | null = null;
      let runnerPlayer: any = null;

      if (runners.first) {
        runnerToSteal = runners.first;
        currentBase = 'first';
        runnerPlayer = attackingTeam.lineup.find((p: any) => p.id === runners.first?.playerId);
      } else if (runners.second) {
        runnerToSteal = runners.second;
        currentBase = 'second';
        runnerPlayer = attackingTeam.lineup.find((p: any) => p.id === runners.second?.playerId);
      }

      if (!runnerToSteal || !currentBase || !runnerPlayer) {
        console.error('エンドランを試みる走者が見つかりません');
        return;
      }

      // 打者の結果を簡易的に判定（実際には打撃エンジンと統合）
      // ここでは簡略化のため、確率的に判定
      const battingRoll = Math.random() * 100;
      let battingOutcome: 'hit' | 'out' | 'swing_miss';
      
      if (battingRoll < 30) {
        battingOutcome = 'hit';
      } else if (battingRoll < 70) {
        battingOutcome = 'out';
      } else {
        battingOutcome = 'swing_miss';
      }

      const hitAndRunResult = judgeHitAndRun(
        runnerToSteal,
        currentBase,
        runnerPlayer,
        batter,
        pitcher,
        catcher,
        infielders,
        battingOutcome
      );

      // 結果イベントを追加
      const hitAndRunEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: currentInning,
        isTopHalf,
        description: hitAndRunResult.commentary,
        type: 'at_bat_start',
        source: 'player',
      };
      dispatch(addPlayEvent(hitAndRunEvent));

      // 走者を更新（エンドランの結果に応じて）
      const newRunners: RunnerState = { ...runners };
      let outsRecorded = 0;

      if (battingOutcome === 'hit') {
        // ヒットの場合、走者は大きく進塁
        if (currentBase === 'first') {
          newRunners.first = { playerId: batter.id, playerName: batter.name };
          if (hitAndRunResult.stealAttempt.success) {
            // 走者は三塁へ（エンドランボーナス）
            newRunners.third = runnerToSteal;
            newRunners.second = null;
          } else {
            newRunners.second = runnerToSteal;
          }
        } else if (currentBase === 'second') {
          newRunners.first = { playerId: batter.id, playerName: batter.name };
          if (hitAndRunResult.stealAttempt.success) {
            // 走者は得点
            newRunners.second = null;
            dispatch(addScore({ team: scoringTeam, points: 1 }));
          } else {
            newRunners.third = runnerToSteal;
            newRunners.second = null;
          }
        }
      } else if (battingOutcome === 'out') {
        // アウトの場合
        outsRecorded++;
        if (hitAndRunResult.stealAttempt.caughtStealing) {
          // ダブルプレー
          outsRecorded++;
          if (currentBase === 'first') newRunners.first = null;
          else if (currentBase === 'second') newRunners.second = null;
        } else if (hitAndRunResult.stealAttempt.success) {
          // 走者は進塁成功
          if (currentBase === 'first') {
            newRunners.first = null;
            newRunners.second = runnerToSteal;
          } else if (currentBase === 'second') {
            newRunners.second = null;
            newRunners.third = runnerToSteal;
          }
        }
      } else {
        // 空振りの場合、通常の盗塁判定
        if (hitAndRunResult.stealAttempt.success) {
          if (currentBase === 'first') {
            newRunners.first = null;
            newRunners.second = runnerToSteal;
          } else if (currentBase === 'second') {
            newRunners.second = null;
            newRunners.third = runnerToSteal;
          }
        } else if (hitAndRunResult.stealAttempt.caughtStealing) {
          outsRecorded++;
          if (currentBase === 'first') newRunners.first = null;
          else if (currentBase === 'second') newRunners.second = null;
        }
      }

      dispatch(updateRunners(newRunners));

      // アウトを記録
      if (outsRecorded > 0) {
        setTimeout(() => {
          dispatch(recordOut({ description: hitAndRunResult.commentary }));
        }, 1500);
      } else {
        // アウトでなければ次の打者へ
        setTimeout(() => {
          dispatch(endAtBat());
        }, 1500);
      }
      return;
    }
  };

  // 守備シフト変更を処理
  const handleShiftChange = (shift: DefensiveShift) => {
    const shiftEvent: PlayEvent = {
      timestamp: Date.now(),
      inning: currentInning,
      isTopHalf,
      description: `守備シフト変更: ${getShiftLabel(shift)}`,
      type: 'at_bat_start',
      source: 'player',
    };
    dispatch(addPlayEvent(shiftEvent));
    
    // シフト変更をgameSliceに反映（次のタスクで実装）
    // 今は通常守備へ進む
    dispatch(startAtBat());
  };

  // 投手交代を処理
  const handlePitcherChange = (pitcherId: string) => {
    if (!defendingTeam) return;
    
    const newPitcher = defendingTeam.lineup.find((p) => p.id === pitcherId);
    if (newPitcher) {
      const changeEvent: PlayEvent = {
        timestamp: Date.now(),
        inning: currentInning,
        isTopHalf,
        description: `投手交代: ${newPitcher.name}`,
        type: 'substitution',
        source: 'player',
      };
      dispatch(addPlayEvent(changeEvent));
      
      // 投手交代をgameSliceに反映（次のタスクで実装）
      // 今は打席へ進む
      dispatch(startAtBat());
    }
  };

  // 指示のラベルを取得
  const getInstructionLabel = (instruction: OffensiveInstruction): string => {
    const labels: Record<OffensiveInstruction, string> = {
      normal_swing: '通常打撃',
      bunt: 'バント',
      hit_and_run: 'ヒットエンドラン',
      steal: '盗塁',
      wait: '待て',
      squeeze: 'スクイズ',
      double_steal: 'ダブルスチール',
    };
    return labels[instruction];
  };

  const getDefensiveInstructionLabel = (instruction: DefensiveInstruction): string => {
    const labels: Record<DefensiveInstruction, string> = {
      normal: '通常守備',
      pitcher_change: '投手交代',
      intentional_walk: '敬遠',
      defensive_shift: '守備シフト変更',
    };
    return labels[instruction];
  };

  const getShiftLabel = (shift: DefensiveShift): string => {
    const labels: Record<DefensiveShift, string> = {
      normal: '通常守備',
      pull_right: '右打ちシフト',
      pull_left: '左打ちシフト',
      extreme_shift: '極端シフト',
      infield_in: '前進守備',
      infield_back: '深守備',
    };
    return labels[shift];
  };

  // イニング別得点表を生成
  const generateInningsTable = () => {
    const maxDisplayInnings = Math.max(9, currentInning);
    const innings = [];
    
    for (let i = 1; i <= maxDisplayInnings; i++) {
      const inningScore = score.innings.find(s => s.inning === i);
      innings.push({
        inning: i,
        awayScore: inningScore?.awayScore ?? (i < currentInning ? 0 : '-'),
        homeScore: inningScore?.homeScore ?? (i < currentInning || (i === currentInning && !isTopHalf) ? 0 : '-'),
      });
    }
    return innings;
  };

  const inningsTable = generateInningsTable();

  // タスク11.3: 一時停止メニューのハンドラ
  const handlePause = () => {
    setShowPause(true);
  };

  const handleSaveAndExit = () => {
    autoSaveGame(gameState);
    success('試合を保存しました');
    // メインメニューに戻る処理（実装は後ほど）
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const handleExitWithoutSave = () => {
    // 保存せずに終了（確認済み）
    window.location.href = '/';
  };

  const handleOpenSettings = () => {
    setShowPause(false);
    setShowSettings(true);
  };

  const handleOpenHelp = () => {
    setShowPause(false);
    setShowHelp(true);
  };

  // タスク11: キーボードショートカット（ESCで一時停止）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showPause && !showSettings && !showHelp) {
        handlePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPause, showSettings, showHelp]);

  // 重要局面の判定
  const getSituationLabels = () => {
    const labels: Array<{ text: string; type: string }> = [];
    const scoreDiff = isPlayerAttacking 
      ? (gameState.isPlayerHome ? score.home - score.away : score.away - score.home)
      : (gameState.isPlayerHome ? score.away - score.home : score.home - score.away);

    // 得点圏判定
    if (runners.second || runners.third) {
      labels.push({
        text: isPlayerAttacking ? 'チャンス！' : 'ピンチ！',
        type: isPlayerAttacking ? 'chance' : 'pinch'
      });
    }

    // 接戦判定（7回以降で2点差以内）
    if (currentInning >= 7 && Math.abs(scoreDiff) <= 2) {
      labels.push({ text: '接戦！', type: 'close-game' });
    }

    // サヨナラ判定
    if (currentInning >= 9 && !isTopHalf && score.home <= score.away && runners.third) {
      labels.push({ text: 'サヨナラのチャンス！', type: 'sayonara' });
    }

    // ツーアウトでのラストチャンス
    if (outs === 2 && (runners.first || runners.second || runners.third)) {
      labels.push({ text: 'ラストチャンス！', type: 'last-chance' });
    }

    return labels;
  };

  const situationLabels = getSituationLabels();

  // ガイダンスメッセージ
  const getGuidanceMessage = () => {
    switch (phase) {
      case 'inning_start':
        return `${currentInning}回${isTopHalf ? '表' : '裏'} - ${attackingTeam.teamName}の攻撃が始まります`;
      case 'awaiting_instruction':
        if (isPlayerAttacking) {
          // 攻撃側の詳細ガイダンス
          if (outs === 2) {
            return 'ツーアウト！ 確実にランナーを進めましょう';
          } else if (runners.third) {
            return '三塁にランナー！ 得点のチャンスです';
          } else if (runners.second) {
            return '得点圏にランナー！ タイムリーを狙いましょう';
          } else if (runners.first) {
            return 'ランナー一塁。進塁を狙うか長打を狙うか戦略を決めましょう';
          } else {
            return '走者なし。出塁を目指しましょう';
          }
        } else {
          // 守備側の詳細ガイダンス
          if (runners.third && outs < 2) {
            return '得点を防ぐため、投手交代や守備シフトを検討してください';
          } else if (runners.second || runners.third) {
            return '得点圏にランナー。慎重な配球が求められます';
          } else {
            return '守備指示を選択してください';
          }
        }
      case 'at_bat':
        return '打席開始...';
      case 'play_execution':
        return 'プレイ実行中...';
      case 'result_display':
        return '次の打者へ...';
      case 'half_inning_end':
        return `${currentInning}回${isTopHalf ? '表' : '裏'}終了 - チェンジ！`;
      default:
        return '';
    }
  };

  const guidanceMessage = getGuidanceMessage();

  // プレイログのフィルタリングとスタイリング
  const [logFilter, setLogFilter] = useState<number | 'all'>('all');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [maxDisplayLogs, setMaxDisplayLogs] = useState(15);

  const getEventTypeClass = (type: PlayEvent['type']) => {
    switch (type) {
      case 'hit':
        return 'event-hit';
      case 'home_run':
        return 'event-homerun';
      case 'out':
      case 'strikeout':
        return 'event-out';
      case 'walk':
        return 'event-walk';
      case 'error':
        return 'event-error';
      case 'double_play':
        return 'event-doubleplay';
      case 'substitution':
        return 'event-substitution';
      case 'inning_start':
      case 'inning_end':
        return 'event-inning';
      case 'game_start':
      case 'game_end':
        return 'event-game';
      default:
        return 'event-default';
    }
  };

  const filteredPlayLog = useMemo(() => {
    let filtered = playLog;
    if (logFilter !== 'all') {
      filtered = playLog.filter(event => event.inning === logFilter);
    }
    return filtered.slice().reverse();
  }, [playLog, logFilter]);

  const displayedPlayLog = showAllLogs ? filteredPlayLog : filteredPlayLog.slice(0, maxDisplayLogs);

  // イニングフィルタのオプション生成
  const inningFilterOptions = useMemo(() => {
    const innings = new Set(playLog.map(event => event.inning).filter(i => i > 0));
    return Array.from(innings).sort((a, b) => b - a); // 降順
  }, [playLog]);

  return (
    <ErrorBoundary>
      <div className="game-screen">
        {/* タスク11: ヘッダーバー（一時停止・設定・ヘルプボタン）*/}
        <div className="game-header">
          <button className="header-button" onClick={handlePause} title="一時停止 (ESC)">
            ⏸️
          </button>
          <button className="header-button" onClick={() => setShowSettings(true)} title="設定">
            ⚙️
          </button>
          <button className="header-button" onClick={() => setShowHelp(true)} title="ヘルプ">
            ❓
          </button>
        </div>

        <div className="game-container">
          {/* スコアボード */}
          <div className="scoreboard">
            <div className="scoreboard-header">
            <div className="team-name">{awayTeam.teamName}</div>
            <div className="team-name">{homeTeam.teamName}</div>
          </div>
          <div className="scoreboard-scores">
            <div className={`team-score ${score.away > score.home ? 'leading' : ''}`}>{score.away}</div>
            <div className="score-divider">-</div>
            <div className={`team-score ${score.home > score.away ? 'leading' : ''}`}>{score.home}</div>
          </div>
          
          {/* イニング別得点表 */}
          <div className="innings-table">
            <div className="innings-row innings-header">
              <div className="inning-cell team-label"></div>
              {inningsTable.map(inning => (
                <div 
                  key={inning.inning} 
                  className={`inning-cell ${currentInning === inning.inning ? 'current-inning' : ''}`}
                >
                  {inning.inning}
                </div>
              ))}
              <div className="inning-cell total-label">R</div>
            </div>
            <div className="innings-row away-row">
              <div className="inning-cell team-label">{awayTeam.teamName}</div>
              {inningsTable.map(inning => (
                <div 
                  key={inning.inning} 
                  className={`inning-cell ${currentInning === inning.inning && isTopHalf ? 'active-half' : ''}`}
                >
                  {inning.awayScore}
                </div>
              ))}
              <div className="inning-cell total-score">{score.away}</div>
            </div>
            <div className="innings-row home-row">
              <div className="inning-cell team-label">{homeTeam.teamName}</div>
              {inningsTable.map(inning => (
                <div 
                  key={inning.inning} 
                  className={`inning-cell ${currentInning === inning.inning && !isTopHalf ? 'active-half' : ''}`}
                >
                  {inning.homeScore}
                </div>
              ))}
              <div className="inning-cell total-score">{score.home}</div>
            </div>
          </div>
        </div>

        {/* 試合状況 */}
        <div className="game-status">
          <div className="inning-info">
            {currentInning}回{isTopHalf ? '表' : '裏'}
          </div>
          <div className="game-info">
            <div className="info-item">
              <span className="info-label">アウト:</span>
              <span className="info-value">{outs}</span>
            </div>
            <div className="info-item">
              <span className="info-label">攻撃:</span>
              <span className="info-value">{attackingTeam.teamName}</span>
            </div>
            {currentAtBat && (
              <div className="info-item">
                <span className="info-label">打順:</span>
                <span className="info-value batting-order">{attackingTeam.currentBatterIndex + 1}番</span>
              </div>
            )}
          </div>
          
          {/* 重要局面ラベル */}
          {situationLabels.length > 0 && (
            <div className="situation-labels">
              {situationLabels.map((label, index) => (
                <span key={index} className={`situation-label ${label.type}`}>
                  {label.text}
                </span>
              ))}
            </div>
          )}
          
          {/* ガイダンスメッセージ */}
          {guidanceMessage && (
            <div className="guidance-message">
              {guidanceMessage}
            </div>
          )}
        </div>

        {/* 走者表示 */}
        <div className="bases">
          <div className="bases-container">
            <div className={`base second ${runners.second ? 'occupied' : ''}`}>
              <span className="base-symbol">{runners.second ? '●' : '◇'}</span>
              <span className="base-label">二塁</span>
              {runners.second && (
                <span className="runner-name">{runners.second.playerName}</span>
              )}
            </div>
            <div className="bases-row">
              <div className={`base third ${runners.third ? 'occupied' : ''}`}>
                <span className="base-symbol">{runners.third ? '●' : '◇'}</span>
                <span className="base-label">三塁</span>
                {runners.third && (
                  <span className="runner-name">{runners.third.playerName}</span>
                )}
              </div>
              <div className={`base first ${runners.first ? 'occupied' : ''}`}>
                <span className="base-symbol">{runners.first ? '●' : '◇'}</span>
                <span className="base-label">一塁</span>
                {runners.first && (
                  <span className="runner-name">{runners.first.playerName}</span>
                )}
              </div>
            </div>
            {/* 満塁表示 */}
            {runners.first && runners.second && runners.third && (
              <div className="bases-loaded-indicator">
                満塁！
              </div>
            )}
          </div>
        </div>

        {/* 打席情報 */}
        {currentAtBat && (
          <div className="at-bat-display">
            <div className="batter-info">
              <h3>打席</h3>
              <div className="player-name">
                {attackingTeam.currentBatterIndex + 1}番 {currentAtBat.batterName}
              </div>
              <div className="count">
                <span className="count-label">カウント:</span>
                <span className="balls">{currentAtBat.balls}B</span>
                <span className="strikes">{currentAtBat.strikes}S</span>
              </div>
            </div>
            <div className="pitcher-info">
              <h3>投手</h3>
              <div className="player-name">{currentAtBat.pitcherName}</div>
            </div>
          </div>
        )}

        {/* フェーズ表示 */}
        {phase === 'inning_start' && (
          <div className="phase-message">
            <h2>{currentInning}回{isTopHalf ? '表' : '裏'}の攻撃です</h2>
            <p>{attackingTeam.teamName}の攻撃</p>
          </div>
        )}

        {phase === 'awaiting_instruction' && (
          <div className="instruction-panel">
            {isPlayerAttacking ? (
              <OffensiveInstructionMenu onSelectInstruction={handleOffensiveInstruction} />
            ) : (
              <DefensiveInstructionMenu 
                onSelectInstruction={handleDefensiveInstruction}
                onSelectShift={handleShiftChange}
                onSelectPitcher={handlePitcherChange}
              />
            )}
            
            {/* タスク14: CPU思考中の表示 */}
            {!isPlayerAttacking && (
              <div className="cpu-thinking">
                <p>（CPU監督が戦術を検討中...）</p>
              </div>
            )}
          </div>
        )}

        {phase === 'result_display' && (
          <div className="phase-message">
            <h3>次の打者へ...</h3>
          </div>
        )}

        {phase === 'half_inning_end' && (
          <div className="phase-message">
            <h2>チェンジ！</h2>
            <p>{currentInning}回{isTopHalf ? '表' : '裏'}が終了しました</p>
          </div>
        )}

        {/* プレイログ */}
        <div className="play-log">
          <div className="play-log-header">
            <span>プレイログ</span>
            <div className="play-log-controls">
              <select 
                value={logFilter} 
                onChange={(e) => setLogFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="log-filter-select"
              >
                <option value="all">全イニング</option>
                {inningFilterOptions.map(inning => (
                  <option key={inning} value={inning}>
                    {inning}回
                  </option>
                ))}
              </select>
              {filteredPlayLog.length > maxDisplayLogs && (
                <button 
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="log-toggle-button"
                >
                  {showAllLogs ? '最新のみ表示' : `全て表示 (${filteredPlayLog.length}件)`}
                </button>
              )}
            </div>
          </div>
          <div className="play-log-content">
            {displayedPlayLog.length === 0 ? (
              <div className="play-log-empty">プレイログはありません</div>
            ) : (
              displayedPlayLog.map((event, index) => (
                <div 
                  key={`${event.timestamp}-${index}`} 
                  className={`play-log-item ${getEventTypeClass(event.type)}`}
                >
                  <span className="play-log-inning">
                    {event.inning > 0 ? `${event.inning}回${event.isTopHalf ? '表' : '裏'}` : '試合前'}
                  </span>
                  <span className="play-log-description">{event.description}</span>
                  {event.scoreChange && (
                    <span className="play-log-score-change">
                      ({event.scoreChange.away}-{event.scoreChange.home})
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
          </div>
        </div>

        {/* タスク11: モーダルとUI要素 */}
        <Toast messages={messages} onRemove={removeToast} />
        
        <PauseMenu
          isOpen={showPause}
          onClose={() => setShowPause(false)}
          onSaveAndExit={handleSaveAndExit}
          onExitWithoutSave={handleExitWithoutSave}
          onOpenSettings={handleOpenSettings}
          onOpenHelp={handleOpenHelp}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <HelpModal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />

        <ResumeGameDialog
          isOpen={showResumeDialog}
          onResume={() => {
            setShowResumeDialog(false);
            info('前回の試合を再開します');
          }}
          onStartNew={() => {
            setShowResumeDialog(false);
            info('新しい試合を開始します');
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
