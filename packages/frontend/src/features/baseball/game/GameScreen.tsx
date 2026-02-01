import { useEffect } from 'react';
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
import './GameScreen.css';

/**
 * GameScreen - 試合画面
 */
export function GameScreen() {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.game);
  const { phase, currentInning, isTopHalf, outs, score, homeTeam, awayTeam, playLog, currentAtBat, runners } = gameState;

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
  const handleDefensiveInstruction = (instruction: DefensiveInstruction) => {
    const instructionEvent: PlayEvent = {
      timestamp: Date.now(),
      inning: currentInning,
      isTopHalf,
      description: `監督指示: ${getDefensiveInstructionLabel(instruction)}`,
      type: 'at_bat_start',
      source: 'player',
    };
    dispatch(addPlayEvent(instructionEvent));

    // 守備指示の処理（次のタスクで実装予定）
    // 通常守備の場合は何もせず次に進む
    if (instruction === 'normal') {
      // 打席へ進む
      dispatch(startAtBat());
    }
  };

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

  return (
    <div className="game-screen">
      <div className="game-container">
        {/* スコアボード */}
        <div className="scoreboard">
          <div className="scoreboard-header">
            <div className="team-name">{awayTeam.teamName}</div>
            <div className="team-name">{homeTeam.teamName}</div>
          </div>
          <div className="scoreboard-scores">
            <div className="team-score">{score.away}</div>
            <div className="score-divider">-</div>
            <div className="team-score">{score.home}</div>
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
          </div>
        </div>

        {/* 走者表示 */}
        <div className="bases">
          <div className="bases-container">
            <div className={`base second ${runners.second ? 'occupied' : ''}`}>
              {runners.second ? '●' : '◇'}
              <span className="base-label">二塁</span>
            </div>
            <div className="bases-row">
              <div className={`base third ${runners.third ? 'occupied' : ''}`}>
                {runners.third ? '●' : '◇'}
                <span className="base-label">三塁</span>
              </div>
              <div className={`base first ${runners.first ? 'occupied' : ''}`}>
                {runners.first ? '●' : '◇'}
                <span className="base-label">一塁</span>
              </div>
            </div>
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
          <div className="play-log-header">プレイログ</div>
          <div className="play-log-content">
            {playLog
              .slice()
              .reverse()
              .slice(0, 10)
              .map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="play-log-item">
                  <span className="play-log-inning">
                    {event.inning > 0 ? `${event.inning}回${event.isTopHalf ? '表' : '裏'}` : ''}
                  </span>
                  <span className="play-log-description">{event.description}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
