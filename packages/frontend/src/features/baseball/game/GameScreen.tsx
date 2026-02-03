import { useEffect, useState, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  startInning, 
  startAtBat, 
  endAtBat, 
  recordOut, 
  endHalfInning, 
  checkGameEnd, 
  setPhase,
  addScore, 
  checkSayonara,
  addPlayEvent,
  updateRunners,
  updatePitchCount,
  updateAtBatCount,
  restoreGameState,
  applyIntentionalWalk,
  setDefensiveShift,
  changePitcher
} from '../game/gameSlice';
import { OffensiveInstructionMenu } from './OffensiveInstructionMenu';
import { DefensiveInstructionMenu } from './DefensiveInstructionMenu';
import { OffensiveInstruction, DefensiveInstruction, DefensiveShift, PlayEvent, Runner, RunnerState } from '../types';
import { 
  simulateAtBatWithPitchLoop,
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
import { validateOffensiveInstruction, validateDefensiveInstruction, formatValidationError, getErrorSeverity } from './validation';
import { loadSettings, applyTheme, mapDifficultyToCPU, getPitchDisplayDelay } from './settings';
import { autoSaveGame, startAutoSaveInterval, saveOnInningEnd, hasSavedGame, isSavedGameStale, loadSavedGame, clearSavedGame } from './autoSave';
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
  const pitchContinueResolver = useRef<null | (() => void)>(null);
  const pitchContinueTimerRef = useRef<number | null>(null);

  // タスク11: UI状態管理
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showPitchContinue, setShowPitchContinue] = useState(false);
  
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

    if (hasSavedGame()) {
      setShowResumeDialog(true);
      if (isSavedGameStale()) {
        warning('保存データが古くなっています。必要に応じて新規開始してください。');
      }
    }
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

    // half_inning_endフェーズの場合、試合終了判定と攻守交代処理
    if (phase === 'half_inning_end') {
      const timer = setTimeout(() => {
        // 試合終了判定を実行
        dispatch(checkGameEnd());
      }, 3000);
      return () => clearTimeout(timer);
    }

    // half_inning_end_checkedフェーズの場合、攻守交代を実行
    if (phase === 'half_inning_end_checked') {
      const timer = setTimeout(() => {
        dispatch(endHalfInning());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, dispatch]);

  // アウト数が3に到達しているのにフェーズが更新されていない場合の保険
  useEffect(() => {
    if (
      outs >= 3 &&
      phase !== 'half_inning_end' &&
      phase !== 'half_inning_end_checked' &&
      phase !== 'game_end'
    ) {
      dispatch(setPhase('half_inning_end'));
    }
  }, [outs, phase, dispatch]);

  const waitForPitchContinue = (autoProgress: boolean, autoDelay: number) =>
    new Promise<void>((resolve) => {
      let resolved = false;
      const finalize = () => {
        if (resolved) return;
        resolved = true;
        setShowPitchContinue(false);
        if (pitchContinueTimerRef.current !== null) {
          window.clearTimeout(pitchContinueTimerRef.current);
          pitchContinueTimerRef.current = null;
        }
        resolve();
      };

      pitchContinueResolver.current = finalize;
      setShowPitchContinue(true);

      if (autoProgress) {
        pitchContinueTimerRef.current = window.setTimeout(() => {
          finalize();
        }, autoDelay);
      }
    });

  const handlePitchContinue = () => {
    const resolve = pitchContinueResolver.current;
    pitchContinueResolver.current = null;
    if (resolve) resolve();
  };

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

    const findRunnerSpeed = (): { runnerSpeed?: number; runnerName?: string } => {
      const targetRunner =
        runners.first ??
        runners.second ??
        runners.third ??
        null;

      if (!targetRunner) return {};

      const runnerPlayer = gameState.allPlayers.find((player) => player.id === targetRunner.playerId);
      return {
        runnerSpeed: runnerPlayer?.running.speed,
        runnerName: targetRunner.playerName,
      };
    };

    // タスク11.1: 入力検証
    const { runnerSpeed, runnerName } = findRunnerSpeed();
    const validationError = validateOffensiveInstruction(instruction, runners, outs, {
      strikes: currentAtBat.strikes,
      runnerSpeed,
      runnerName,
    });
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

    // 現在の投球数
    const pitchCount = gameState.currentPitcher?.pitchCount || 0;
    const userSettings = loadSettings();
    const pitchDelay = getPitchDisplayDelay(userSettings.pitchDisplaySpeed);
    const showPitchDetail = userSettings.pitchDisplayMode === 'detail';

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

    // タスク3: 1球単位判定ループ
    setTimeout(() => {
      const runPitchLoop = async () => {
        const atBatResult = simulateAtBatWithPitchLoop(
          batter,
          pitcher,
          runners,
          pitchCount,
          instruction
        );

        const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        if (showPitchDetail) {
          for (const pitch of atBatResult.pitches) {
            await wait(pitchDelay);
            dispatch(
              updateAtBatCount({
                balls: pitch.balls,
                strikes: pitch.strikes,
                pitchNumber: pitch.pitchNumber,
              })
            );
            dispatch(updatePitchCount(pitchCount + pitch.pitchNumber));
            const pitchEvent: PlayEvent = {
              timestamp: Date.now(),
              inning: currentInning,
              isTopHalf,
              description: `${pitch.description}（${pitch.balls}-${pitch.strikes}）`,
              type: 'pitch',
              source: 'player',
            };
            dispatch(addPlayEvent(pitchEvent));

            if (userSettings.pitchDisplaySpeed === 'slow') {
              await waitForPitchContinue(userSettings.autoProgress, userSettings.autoProgressDelay);
            }
          }
        } else {
          const lastPitch = atBatResult.pitches[atBatResult.pitches.length - 1];
          dispatch(
            updateAtBatCount({
              balls: lastPitch.balls,
              strikes: lastPitch.strikes,
              pitchNumber: lastPitch.pitchNumber,
            })
          );
          dispatch(updatePitchCount(pitchCount + lastPitch.pitchNumber));

          if (userSettings.pitchDisplaySpeed === 'slow') {
            await wait(pitchDelay);
            await waitForPitchContinue(userSettings.autoProgress, userSettings.autoProgressDelay);
          }
        }

        const resultEvent: PlayEvent = {
          timestamp: Date.now(),
          inning: currentInning,
          isTopHalf,
          description:
            atBatResult.outcome === 'strikeout'
              ? `${batter.name}は三振しました。`
              : atBatResult.outcome === 'walk'
                ? `${batter.name}はフォアボールで出塁しました。`
                : `${batter.name}が打ちました！`,
          type:
            atBatResult.outcome === 'strikeout'
              ? 'strikeout'
              : atBatResult.outcome === 'walk'
                ? 'walk'
                : 'at_bat_start',
          source: 'player',
        };
        dispatch(addPlayEvent(resultEvent));

        if (atBatResult.outcome === 'strikeout') {
          dispatch(recordOut({ description: `${batter.name}は三振しました。`, batterOut: true }));
          return;
        }

        if (atBatResult.outcome === 'walk') {
          const newRunners = { ...runners };
          let pushedHomeRun = false;
          
          if (runners.first) {
            if (runners.second) {
              if (runners.third) {
                pushedHomeRun = true;
              } else {
                newRunners.third = runners.second;
              }
            } else {
              newRunners.second = runners.first;
            }
          }
          newRunners.first = { playerId: batter.id, playerName: batter.name };
          
          if (pushedHomeRun) {
            const scoringTeam = isTopHalf ? 'away' : 'home';
            dispatch(addScore({ team: scoringTeam, points: 1 }));
            setTimeout(() => {
              dispatch(checkSayonara());
            }, 100);
          }
          
          dispatch(updateRunners(newRunners));
          
          setTimeout(() => {
            dispatch(endAtBat());
          }, 1500);
          return;
        }

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

            const newRunners: RunnerState = { first: null, second: null, third: null };
            const scoringTeam = isTopHalf ? 'away' : 'home';

            if (defensiveResult.outcome === 'home_run') {
              if (defensiveResult.runsScored > 0) {
                dispatch(addScore({ team: scoringTeam, points: defensiveResult.runsScored }));
                setTimeout(() => {
                  dispatch(checkSayonara());
                }, 100);
              }
              dispatch(updateRunners(newRunners));
            } else {
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
                  const existingRunner = runners[advance.from];
                  if (existingRunner) {
                    if (advance.to === 'first') {
                      newRunners.first = existingRunner;
                    } else if (advance.to === 'second') {
                      newRunners.second = existingRunner;
                    } else if (advance.to === 'third') {
                      newRunners.third = existingRunner;
                    }
                  }
                }
              }

              if (defensiveResult.runsScored > 0) {
                dispatch(addScore({ team: scoringTeam, points: defensiveResult.runsScored }));
                setTimeout(() => {
                  dispatch(checkSayonara());
                }, 100);
              }

              dispatch(updateRunners(newRunners));
            }

            if (defensiveResult.outsRecorded > 0) {
              const batterOut = defensiveResult.batterOut;
              setTimeout(() => {
                dispatch(
                  recordOut({
                    description: defensiveResult.description,
                    outsRecorded: defensiveResult.outsRecorded,
                    batterOut,
                  })
                );
              }, 1500);
            } else {
              setTimeout(() => {
                dispatch(endAtBat());
              }, 1500);
            }
          }, 1000);
        }
      };

      void runPitchLoop();
    }, 1500);
  };

  // 守備指示を処理
  const handleDefensiveInstruction = (instruction: DefensiveInstruction | null) => {
    // nullの場合は通常守備として扱う
    const actualInstruction = instruction || 'normal';

    const defendingTeam = isTopHalf ? homeTeam : awayTeam;
    const availablePitchers = defendingTeam
      ? [
          ...defendingTeam.lineup.filter((p) => p.position === 'P' && p.id !== gameState.currentPitcher?.playerId),
          ...defendingTeam.bench.filter((p) => p.position === 'P'),
        ].length
      : 0;
    const currentPitchCount = gameState.currentPitcher?.pitchCount || 0;
    const defensiveValidation = validateDefensiveInstruction(
      actualInstruction,
      availablePitchers,
      currentPitchCount
    );
    if (defensiveValidation) {
      const severity = getErrorSeverity(defensiveValidation);
      const message = formatValidationError(defensiveValidation);
      if (severity === 'error') {
        error(message);
        return;
      } else {
        warning(message);
      }
    }
    
    const instructionEvent: PlayEvent = {
      timestamp: Date.now(),
      inning: currentInning,
      isTopHalf,
      description: `監督指示: ${getDefensiveInstructionLabel(actualInstruction)}`,
      type: 'at_bat_start',
      source: 'player',
    };
    dispatch(addPlayEvent(instructionEvent));

    if (actualInstruction === 'intentional_walk') {
      dispatch(applyIntentionalWalk());
      setTimeout(() => {
        dispatch(checkSayonara());
      }, 100);
      setTimeout(() => {
        dispatch(endAtBat());
      }, 1500);
      return;
    }

    // 通常守備の場合は何もせず次に進む
    if (actualInstruction === 'normal') {
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
          dispatch(recordOut({ description: `${batter.name}は三振しました。`, batterOut: true }));
        }, 1500);
      } else if (buntResult.isPopup) {
        // 打ち損じの小フライ（捕手または投手がキャッチ）
        setTimeout(() => {
          dispatch(
            recordOut({
              description: `${batter.name}の打ち損じを捕手が捕球。アウト！`,
              batterOut: true,
            })
          );
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
        // サヨナラ判定を非同期で実行
        setTimeout(() => {
          dispatch(checkSayonara());
        }, 100);
      }

      // 走者の進塁を処理
      const newRunners: RunnerState = { first: null, second: null, third: null };
      const scoringTeam = isTopHalf ? 'away' : 'home';
      let additionalRuns = 0;

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
                additionalRuns++;
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

      // 追加得点がある場合、まとめて加算
      if (additionalRuns > 0) {
        dispatch(addScore({ team: scoringTeam, points: additionalRuns }));
        // サヨナラ判定を非同期で実行
        setTimeout(() => {
          dispatch(checkSayonara());
        }, 100);
      }

      // 走者を更新
      dispatch(updateRunners(newRunners));

      const outsRecorded = defensiveResult.runnersAdvanced.filter((advance) => advance.to === 'out').length;

      // アウトを記録
      if (outsRecorded > 0) {
        setTimeout(() => {
          dispatch(
            recordOut({
              description: defensiveResult.description,
              outsRecorded,
              batterOut: defensiveResult.batterOut,
            })
          );
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
        // サヨナラ判定を非同期で実行
        setTimeout(() => {
          dispatch(checkSayonara());
        }, 100);
      }

      // 走者を更新
      dispatch(updateRunners(newRunners));

      // アウトを記録
      if (outsRecorded > 0) {
        setTimeout(() => {
          dispatch(
            recordOut({
              description: doubleStealResult.commentary,
              outsRecorded,
              batterOut: false,
            })
          );
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
      let scoredRun = false;
      
      if (stealResult.success) {
        // 盗塁成功
        if (stealResult.targetBase === 'home') {
          // 本塁盗塁成功（得点）
          if (currentBase === 'third') newRunners.third = null;
          scoredRun = true;
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

      // 得点があれば加算
      if (scoredRun) {
        dispatch(addScore({ team: scoringTeam, points: 1 }));
        // サヨナラ判定を非同期で実行
        setTimeout(() => {
          dispatch(checkSayonara());
        }, 100);
      }

      dispatch(updateRunners(newRunners));

      // アウトを記録
      if (stealResult.caughtStealing) {
        setTimeout(() => {
          dispatch(recordOut({ description: stealResult.commentary, batterOut: false }));
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
      let scoredRun = false;

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
            scoredRun = true;
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

      // 得点があれば加算
      if (scoredRun) {
        dispatch(addScore({ team: scoringTeam, points: 1 }));
        // サヨナラ判定を非同期で実行
        setTimeout(() => {
          dispatch(checkSayonara());
        }, 100);
      }

      dispatch(updateRunners(newRunners));

      // アウトを記録
      if (outsRecorded > 0) {
        setTimeout(() => {
          dispatch(
            recordOut({
              description: hitAndRunResult.commentary,
              outsRecorded,
              batterOut: battingOutcome === 'out',
            })
          );
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
    
    dispatch(setDefensiveShift(shift));
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

      dispatch(changePitcher({ pitcherId: newPitcher.id }));
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

  const getNextActionLabel = () => {
    switch (phase) {
      case 'awaiting_instruction':
        return isPlayerAttacking ? '攻撃指示を選択してください' : '守備指示を選択してください';
      case 'inning_start':
        return 'イニング開始を待機中';
      case 'at_bat':
      case 'play_execution':
        return 'プレイ進行中';
      case 'result_display':
        return '次の打者へ進行中';
      case 'half_inning_end':
        return '攻守交代の処理中';
      case 'half_inning_end_checked':
        return 'イニング更新中';
      case 'game_end':
        return '試合終了';
      default:
        return '';
    }
  };

  const nextActionLabel = getNextActionLabel();

  const commentarySettings = loadSettings();
  const showPitchInCommentary = commentarySettings.pitchDisplayMode === 'detail';
  const recentCommentary = useMemo(() => {
    const events = showPitchInCommentary
      ? playLog
      : playLog.filter((event) => event.type !== 'pitch');
    return events.slice(-5).reverse();
  }, [playLog, showPitchInCommentary]);

  const getCommentaryClass = (type: PlayEvent['type']) => {
    if (['home_run', 'error', 'double_play', 'game_end'].includes(type)) return 'commentary-item important';
    if (['strikeout', 'walk', 'inning_end'].includes(type)) return 'commentary-item highlight';
    return 'commentary-item';
  };

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
  const [showPitchLogInSidebar, setShowPitchLogInSidebar] = useState(
    loadSettings().pitchDisplayMode === 'detail'
  );
  const [showCompactSidebar, setShowCompactSidebar] = useState(false);

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
    let filtered = showPitchLogInSidebar ? playLog : playLog.filter(event => event.type !== 'pitch');
    if (logFilter !== 'all') {
      filtered = filtered.filter(event => event.inning === logFilter);
    }
    return filtered.slice().reverse();
  }, [playLog, logFilter, showPitchLogInSidebar]);

  const displayedPlayLog = showAllLogs ? filteredPlayLog : filteredPlayLog.slice(0, maxDisplayLogs);

  // イニングフィルタのオプション生成
  const inningFilterOptions = useMemo(() => {
    const innings = new Set(playLog.map(event => event.inning).filter(i => i > 0));
    return Array.from(innings).sort((a, b) => b - a); // 降順
  }, [playLog]);

  // イニング詳細表示の折りたたみ状態
  const [showInningsDetail, setShowInningsDetail] = useState(false);
  // モバイルでのプレイログ折りたたみ状態
  const [playLogCollapsed, setPlayLogCollapsed] = useState(false);

  return (
    <ErrorBoundary>
      <div className="game-screen">
        {/* コンパクトヘッダー（スコアボード統合） */}
        <div className="game-header">
          <div className="header-left">
            <button className="header-button" onClick={handlePause} title="一時停止 (ESC)">
              ⏸️
            </button>
          </div>
          
          <div className="header-center">
            {/* コンパクトスコア表示 */}
            <div className="compact-score">
              <div className="compact-team">
                <span className="compact-team-name">{awayTeam.teamName}</span>
                <span className={`compact-team-score ${score.away > score.home ? 'leading' : ''}`}>
                  {score.away}
                </span>
              </div>
              <span className="compact-divider">-</span>
              <div className="compact-team">
                <span className={`compact-team-score ${score.home > score.away ? 'leading' : ''}`}>
                  {score.home}
                </span>
                <span className="compact-team-name">{homeTeam.teamName}</span>
              </div>
            </div>
            
            {/* イニング・アウト表示 */}
            <div className="compact-status">
              <span className="compact-inning">{currentInning}回{isTopHalf ? '表' : '裏'}</span>
              <div className="compact-outs">
                {[0, 1, 2].map(i => (
                  <span key={i} className={`out-dot ${i < outs ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
          
          <div className="header-right">
            <button className="header-button" onClick={() => setShowSettings(true)} title="設定">
              ⚙️
            </button>
            <button className="header-button" onClick={() => setShowHelp(true)} title="ヘルプ">
              ❓
            </button>
          </div>
        </div>

        {/* イニング詳細（アコーディオン） */}
        <div className="innings-accordion">
          <button 
            className="innings-toggle"
            onClick={() => setShowInningsDetail(!showInningsDetail)}
          >
            <span>イニング詳細</span>
            <span className={`innings-toggle-icon ${showInningsDetail ? 'expanded' : ''}`}>▼</span>
          </button>
          <div className={`innings-content ${showInningsDetail ? 'expanded' : ''}`}>
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
        </div>

        {/* 2カラムレイアウト */}
        <div className="game-layout">
          {/* メインコンテンツ */}
          <div className="game-main">
            <div className="game-container">
              {/* コンパクト試合状況 */}
              <div className="game-status-compact">
                <div className="status-left">
                  {/* コンパクト塁ベース */}
                  <div className="bases-compact">
                    <div className="bases-compact-row">
                      <div className="base-compact-slot">
                        <div className={`base-compact ${runners.second ? 'occupied' : ''}`} title="二塁" />
                        {runners.second && (
                          <span className="base-runner-name" title={runners.second.playerName}>
                            {runners.second.playerName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bases-compact-row">
                      <div className="base-compact-slot">
                        <div className={`base-compact ${runners.third ? 'occupied' : ''}`} title="三塁" />
                        {runners.third && (
                          <span className="base-runner-name" title={runners.third.playerName}>
                            {runners.third.playerName}
                          </span>
                        )}
                      </div>
                      <div className="base-compact-slot">
                        <div className={`base-compact ${runners.first ? 'occupied' : ''}`} title="一塁" />
                        {runners.first && (
                          <span className="base-runner-name" title={runners.first.playerName}>
                            {runners.first.playerName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 満塁インジケータ */}
                  {runners.first && runners.second && runners.third && (
                    <span className="bases-loaded-compact">満塁</span>
                  )}
                  
                  {/* カウント表示（ドット形式） */}
                  {currentAtBat && (
                    <div className="count-display">
                      <div className="count-group">
                        <span className="count-label">B</span>
                        <div className="count-dots">
                          {[0, 1, 2, 3].map(i => (
                            <span key={i} className={`count-dot ball ${i < currentAtBat.balls ? 'active' : ''}`} />
                          ))}
                        </div>
                      </div>
                      <div className="count-group">
                        <span className="count-label">S</span>
                        <div className="count-dots">
                          {[0, 1, 2].map(i => (
                            <span key={i} className={`count-dot strike ${i < currentAtBat.strikes ? 'active' : ''}`} />
                          ))}
                        </div>
                      </div>
                      <div className="count-group">
                        <span className="count-label">O</span>
                        <div className="count-dots">
                          {[0, 1, 2].map(i => (
                            <span key={i} className={`count-dot out ${i < outs ? 'active' : ''}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="status-right">
                  {/* 打者/投手情報（コンパクト） */}
                  {currentAtBat && (
                    <div className="matchup-compact">
                      <div className="matchup-player">
                        <span className="matchup-order">{attackingTeam.currentBatterIndex + 1}番</span>
                        <span className="matchup-name">{currentAtBat.batterName}</span>
                      </div>
                      <span className="matchup-vs">vs</span>
                      <div className="matchup-player">
                        <span className="matchup-label">投</span>
                        <span className="matchup-name">{currentAtBat.pitcherName}</span>
                      </div>
                    </div>
                  )}
                  
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
                </div>
              </div>

              {/* ガイダンスメッセージ */}
              {guidanceMessage && (
                <div className="guidance-message">
                  {guidanceMessage}
                </div>
              )}

              {nextActionLabel && (
                <div className="next-action-message">
                  <span className="next-action-label">次の操作</span>
                  <span className="next-action-text">{nextActionLabel}</span>
                </div>
              )}

              {showPitchContinue && (
                <div className="guidance-message pitch-continue">
                  <span>続行ボタンで次の投球へ進みます</span>
                  <button className="pitch-continue-button" onClick={handlePitchContinue}>
                    続行
                  </button>
                </div>
              )}

              <div className="commentary-panel">
                <div className="commentary-title">実況</div>
                <div className="commentary-list">
                  {recentCommentary.length === 0 ? (
                    <div className="commentary-empty">実況なし</div>
                  ) : (
                    recentCommentary.map((event, index) => (
                      <div key={`${event.timestamp}-${index}`} className={getCommentaryClass(event.type)}>
                        <span className="commentary-inning">
                          {event.inning > 0 ? `${event.inning}回${event.isTopHalf ? '表' : '裏'}` : '試合前'}
                        </span>
                        <span className="commentary-text">{event.description}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

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
                  
                  {/* CPU思考中の表示 */}
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
            </div>
          </div>

          {/* サイドバー（プレイログ） */}
          <div className="game-sidebar">
            <div className="sidebar-toggle">
              <button
                className="sidebar-toggle-button"
                onClick={() => setShowCompactSidebar(!showCompactSidebar)}
              >
                {showCompactSidebar ? 'ログを表示' : 'ログを折りたたむ'}
              </button>
            </div>
            <div className={`play-log ${playLogCollapsed ? 'collapsed' : ''} ${showCompactSidebar ? 'hidden' : ''}`}>
              <div 
                className="play-log-header"
                onClick={() => setPlayLogCollapsed(!playLogCollapsed)}
              >
                <span>プレイログ</span>
                <div className="play-log-controls">
                  <label className="log-pitch-toggle" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={showPitchLogInSidebar}
                      onChange={(e) => setShowPitchLogInSidebar(e.target.checked)}
                    />
                    <span>投球ログ</span>
                  </label>
                  <select 
                    value={logFilter} 
                    onChange={(e) => {
                      e.stopPropagation();
                      setLogFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="log-filter-select"
                  >
                    <option value="all">全て</option>
                    {inningFilterOptions.map(inning => (
                      <option key={inning} value={inning}>
                        {inning}回
                      </option>
                    ))}
                  </select>
                  {filteredPlayLog.length > maxDisplayLogs && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllLogs(!showAllLogs);
                      }}
                      className="log-toggle-button"
                    >
                      {showAllLogs ? '最新' : `全${filteredPlayLog.length}件`}
                    </button>
                  )}
                </div>
              </div>
              <div className="play-log-content">
                {displayedPlayLog.length === 0 ? (
                  <div className="play-log-empty">ログなし</div>
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
                          {event.scoreChange.away}-{event.scoreChange.home}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
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
            const saved = loadSavedGame();
            if (saved?.gameState) {
              dispatch(restoreGameState(saved.gameState));
              success('前回の試合を再開します');
            } else {
              warning('保存データの復元に失敗しました');
            }
            setShowResumeDialog(false);
          }}
          onStartNew={() => {
            clearSavedGame();
            setShowResumeDialog(false);
            info('新しい試合を開始します');
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
