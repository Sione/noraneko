import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { resetGame } from '../game/gameSlice';
import { saveGameResult } from '../history/gameHistoryStorage';
import type { GameResult, GameLog } from '../types/gameHistory';
import './GameEnd.css';

/**
 * GameEnd - 試合終了画面
 */
export function GameEnd() {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.game);
  const { score, homeTeam, awayTeam, elapsedSeconds, playLog, currentInning } = gameState;
  const [saveMessage, setSaveMessage] = useState<string>('');

  if (!homeTeam || !awayTeam) {
    return <div>試合データが見つかりません</div>;
  }

  const homeScore = score.home;
  const awayScore = score.away;
  const winner =
    homeScore > awayScore
      ? homeTeam.teamName
      : homeScore < awayScore
        ? awayTeam.teamName
        : null;
  const isDraw = homeScore === awayScore;

  // 試合時間の計算
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const timeString =
    hours > 0
      ? `${hours}時間${minutes}分${seconds}秒`
      : `${minutes}分${seconds}秒`;

  // 最終イベント（試合終了メッセージ）を取得
  const finalEvent = playLog
    .slice()
    .reverse()
    .find((event) => event.type === 'game_end');

  // 試合結果を保存
  // AC 1-5: 試合結果とハイライトを永続化する
  useEffect(() => {
    const saveResult = () => {
      try {
        // ゲームタイプを判定
        let gameType: GameResult['gameType'] = 'regular';
        if (finalEvent?.description.includes('サヨナラ')) {
          gameType = 'walk_off';
        } else if (currentInning > 9) {
          gameType = 'extra';
        } else if (finalEvent?.description.includes('コールド')) {
          gameType = 'called';
        }

        // ハイライトを抽出
        const highlights = playLog
          .filter(
            (event) =>
              event.type === 'home_run' ||
              event.type === 'substitution' ||
              event.type === 'double_play' ||
              event.type === 'game_end'
          )
          .map((event) => ({
            inning: event.inning,
            half: (event.isTopHalf ? 'top' : 'bottom') as 'top' | 'bottom',
            type: event.type as any,
            description: event.description,
            timestamp: Date.now(),
          }));

        // 試合結果を作成
        const gameResult: GameResult = {
          gameId: `game-${Date.now()}`,
          date: new Date(),
          timestamp: Date.now(),
          awayTeam: {
            teamName: awayTeam.teamName,
            abbreviation: awayTeam.abbreviation,
            score: awayScore,
            hits: awayTeam.hits,
            errors: awayTeam.errors,
            leftOnBase: awayTeam.leftOnBase,
            roster: awayTeam.lineup.map(p => p.id), // AC 9.33: 出場選手IDを記録
          },
          homeTeam: {
            teamName: homeTeam.teamName,
            abbreviation: homeTeam.abbreviation,
            score: homeScore,
            hits: homeTeam.hits,
            errors: homeTeam.errors,
            leftOnBase: homeTeam.leftOnBase,
            roster: homeTeam.lineup.map(p => p.id), // AC 9.33: 出場選手IDを記録
          },
          winner:
            homeScore > awayScore
              ? 'home'
              : homeScore < awayScore
                ? 'away'
                : 'draw',
          gameType,
          finalInning: currentInning,
          elapsedSeconds,
          innings: score.innings,
          highlights,
          mvp: gameState.mvp
            ? {
                playerName: gameState.mvp.playerName,
                playerId: gameState.mvp.playerId,
                reason: gameState.mvp.reason,
              }
            : undefined,
        };

        // ログを作成
        const gameLog: GameLog = {
          gameId: gameResult.gameId,
          playLog: playLog.map((event) => ({
            type: event.type,
            description: event.description,
            inning: event.inning,
            half: (event.isTopHalf ? 'top' : 'bottom') as 'top' | 'bottom',
            timestamp: Date.now(),
          })),
        };

        // 保存
        const success = saveGameResult(gameResult, gameLog);
        if (success) {
          setSaveMessage('試合結果を保存しました');
        } else {
          setSaveMessage('試合結果の保存に失敗しました');
        }
      } catch (error) {
        console.error('試合結果の保存エラー:', error);
        setSaveMessage('試合結果の保存に失敗しました');
      }
    };

    saveResult();
  }, []);

  const handleBackToMenu = () => {
    dispatch(resetGame());
  };

  return (
    <div className="game-end">
      <div className="game-end-container">
        <div className="game-end-header">
          <h1 className="game-end-title">試合終了</h1>
          {finalEvent && (
            <p className="game-end-message">{finalEvent.description}</p>
          )}
        </div>

        {/* 最終スコア */}
        <div className="final-score">
          <div className="final-score-header">
            <h2>最終スコア</h2>
          </div>
          <div className="final-score-display">
            <div className={`team-score-card ${winner === awayTeam.teamName ? 'winner' : ''}`}>
              <div className="team-name">{awayTeam.teamName}</div>
              <div className="team-final-score">{awayScore}</div>
              {winner === awayTeam.teamName && <div className="winner-badge">勝者</div>}
            </div>
            <div className="score-separator">-</div>
            <div className={`team-score-card ${winner === homeTeam.teamName ? 'winner' : ''}`}>
              <div className="team-name">{homeTeam.teamName}</div>
              <div className="team-final-score">{homeScore}</div>
              {winner === homeTeam.teamName && <div className="winner-badge">勝者</div>}
            </div>
          </div>
          {isDraw && <div className="draw-message">引き分け</div>}
        </div>

        {/* MVP表示 (タスク10.3) */}
        {gameState.mvp && (
          <div className="mvp-section">
            <h3>MVP</h3>
            <div className="mvp-display">
              <div className="mvp-name">{gameState.mvp.playerName}</div>
              <div className="mvp-reason">{gameState.mvp.reason}</div>
            </div>
          </div>
        )}

        {/* 試合統計 */}
        <div className="game-stats">
          <h3>試合統計</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">試合時間</span>
              <span className="stat-value">{timeString}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{awayTeam.teamName} 安打</span>
              <span className="stat-value">{awayTeam.hits}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{homeTeam.teamName} 安打</span>
              <span className="stat-value">{homeTeam.hits}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{awayTeam.teamName} エラー</span>
              <span className="stat-value">{awayTeam.errors}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{homeTeam.teamName} エラー</span>
              <span className="stat-value">{homeTeam.errors}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{awayTeam.teamName} 残塁</span>
              <span className="stat-value">{awayTeam.leftOnBase}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{homeTeam.teamName} 残塁</span>
              <span className="stat-value">{homeTeam.leftOnBase}</span>
            </div>
          </div>
        </div>

        {/* イニング別スコア */}
        <div className="inning-scores">
          <h3>イニング別スコア</h3>
          <div className="innings-table">
            <div className="innings-header">
              <div className="innings-label">チーム</div>
              {score.innings.map((inning) => (
                <div key={inning.inning} className="inning-number">
                  {inning.inning}
                </div>
              ))}
              <div className="innings-total">計</div>
            </div>
            <div className="innings-row">
              <div className="innings-team">{awayTeam.abbreviation}</div>
              {score.innings.map((inning, index) => {
                const prevScore = index > 0 ? score.innings[index - 1].awayScore : 0;
                const runs = inning.awayScore - prevScore;
                return (
                  <div key={inning.inning} className="inning-score">
                    {runs}
                  </div>
                );
              })}
              <div className="innings-total-score">{awayScore}</div>
            </div>
            <div className="innings-row">
              <div className="innings-team">{homeTeam.abbreviation}</div>
              {score.innings.map((inning, index) => {
                const prevScore = index > 0 ? score.innings[index - 1].homeScore : 0;
                const runs = inning.homeScore - prevScore;
                return (
                  <div key={inning.inning} className="inning-score">
                    {runs}
                  </div>
                );
              })}
              <div className="innings-total-score">{homeScore}</div>
            </div>
          </div>
        </div>

        {/* 個人成績サマリー (タスク10.3) */}
        <div className="player-stats-summary">
          <h3>個人成績</h3>
          
          {/* 打者成績 */}
          <div className="batting-stats">
            <h4>打者成績</h4>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>選手名</th>
                  <th>チーム</th>
                  <th>打数</th>
                  <th>安打</th>
                  <th>打点</th>
                  <th>得点</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...awayTeam.lineup.map(p => ({ ...p, teamAbbr: awayTeam.abbreviation })),
                  ...homeTeam.lineup.map(p => ({ ...p, teamAbbr: homeTeam.abbreviation }))
                ]
                  .filter(p => p.position !== 'P' && (p.atBats || 0) > 0)
                  .sort((a, b) => {
                    // 打点優先、次に安打数でソート
                    const rbisA = a.rbis || 0;
                    const rbisB = b.rbis || 0;
                    if (rbisB !== rbisA) return rbisB - rbisA;
                    return (b.hits || 0) - (a.hits || 0);
                  })
                  .map(player => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>{player.teamAbbr}</td>
                      <td>{player.atBats || 0}</td>
                      <td>{player.hits || 0}</td>
                      <td>{player.rbis || 0}</td>
                      <td>{player.runs || 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* 投手成績 */}
          <div className="pitching-stats">
            <h4>投手成績</h4>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>選手名</th>
                  <th>チーム</th>
                  <th>投球数</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...awayTeam.lineup.map(p => ({ ...p, teamAbbr: awayTeam.abbreviation })),
                  ...homeTeam.lineup.map(p => ({ ...p, teamAbbr: homeTeam.abbreviation }))
                ]
                  .filter(p => p.position === 'P' && (p.currentPitchCount || 0) > 0)
                  .sort((a, b) => (b.currentPitchCount || 0) - (a.currentPitchCount || 0))
                  .map(player => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>{player.teamAbbr}</td>
                      <td>{player.currentPitchCount || 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="game-end-actions">
          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('失敗') ? 'error' : 'success'}`}>
              {saveMessage}
            </div>
          )}
          <div>
            <button className="action-button primary" onClick={handleBackToMenu}>
              メインメニューに戻る
            </button>
            <button 
              className="action-button secondary" 
              onClick={() => window.location.href = '/baseball/history'}
            >
              試合履歴を見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
