/**
 * 試合詳細画面
 * Requirement 8: 試合履歴と戦績管理
 * AC 11-15: 試合詳細とログの表示
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getGameResult,
  getGameLog,
} from '../history/gameHistoryStorage';
import './GameDetail.css';

/**
 * 試合詳細コンポーネント
 */
export function GameDetail() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const [showFullLog, setShowFullLog] = useState(false);

  // 試合結果とログを取得
  const gameResult = useMemo(() => {
    if (!gameId) return null;
    return getGameResult(gameId);
  }, [gameId]);

  const gameLog = useMemo(() => {
    if (!gameId) return null;
    return getGameLog(gameId);
  }, [gameId]);

  if (!gameResult || !gameLog) {
    return (
      <div className="game-detail">
        <div className="error-message">試合データが見つかりません</div>
        <button onClick={() => navigate('/baseball/history')}>
          履歴一覧に戻る
        </button>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0
      ? `${hours}時間${minutes}分${secs}秒`
      : `${minutes}分${secs}秒`;
  };

  const getGameTypeLabel = () => {
    switch (gameResult.gameType) {
      case 'walk_off':
        return 'サヨナラゲーム';
      case 'extra':
        return '延長戦';
      case 'called':
        return 'コールドゲーム';
      default:
        return '通常試合';
    }
  };

  const getResultLabel = () => {
    if (gameResult.winner === 'home') return '勝利';
    if (gameResult.winner === 'away') return '敗北';
    return '引き分け';
  };

  // イニング別得点を計算
  const inningScores = gameResult.innings.map((inning, index) => {
    const prevAway = index > 0 ? gameResult.innings[index - 1].awayScore : 0;
    const prevHome = index > 0 ? gameResult.innings[index - 1].homeScore : 0;
    return {
      inning: inning.inning,
      awayRuns: inning.awayScore - prevAway,
      homeRuns: inning.homeScore - prevHome,
    };
  });

  return (
    <div className="game-detail">
      {/* ヘッダー */}
      <div className="detail-header">
        <button
          className="back-button"
          onClick={() => navigate('/baseball/history')}
        >
          ← 履歴一覧に戻る
        </button>
        <h1>試合詳細</h1>
      </div>

      {/* 試合基本情報 */}
      <div className="game-info-card">
        <div className="game-date">{formatDate(gameResult.date)}</div>
        <div className="game-type">{getGameTypeLabel()}</div>

        {/* スコア */}
        <div className="score-display">
          <div className="team-score away">
            <div className="team-name">{gameResult.awayTeam.teamName}</div>
            <div className="team-total-score">
              {gameResult.awayTeam.score}
            </div>
          </div>
          <div className="score-vs">-</div>
          <div className="team-score home">
            <div className="team-name">{gameResult.homeTeam.teamName}</div>
            <div className="team-total-score">
              {gameResult.homeTeam.score}
            </div>
          </div>
        </div>

        <div className={`game-result ${gameResult.winner}`}>
          {getResultLabel()}
        </div>

        <div className="game-stats-summary">
          <span>試合時間: {formatTime(gameResult.elapsedSeconds)}</span>
          <span>最終イニング: {gameResult.finalInning}回</span>
        </div>
      </div>

      {/* MVP */}
      {gameResult.mvp && (
        <div className="mvp-card">
          <h3>MVP</h3>
          <div className="mvp-info">
            <div className="mvp-player">{gameResult.mvp.playerName}</div>
            <div className="mvp-reason">{gameResult.mvp.reason}</div>
          </div>
        </div>
      )}

      {/* イニング別スコア */}
      <div className="innings-card">
        <h3>イニング別スコア</h3>
        <div className="innings-table-container">
          <table className="innings-table">
            <thead>
              <tr>
                <th>チーム</th>
                {inningScores.map((inning) => (
                  <th key={inning.inning}>{inning.inning}</th>
                ))}
                <th>計</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="team-label">
                  {gameResult.awayTeam.abbreviation}
                </td>
                {inningScores.map((inning) => (
                  <td key={inning.inning} className="inning-runs">
                    {inning.awayRuns}
                  </td>
                ))}
                <td className="total-runs">{gameResult.awayTeam.score}</td>
              </tr>
              <tr>
                <td className="team-label">
                  {gameResult.homeTeam.abbreviation}
                </td>
                {inningScores.map((inning) => (
                  <td key={inning.inning} className="inning-runs">
                    {inning.homeRuns}
                  </td>
                ))}
                <td className="total-runs">{gameResult.homeTeam.score}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 試合統計 */}
      <div className="stats-card">
        <h3>試合統計</h3>
        <table className="stats-table">
          <thead>
            <tr>
              <th>チーム</th>
              <th>安打</th>
              <th>エラー</th>
              <th>残塁</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{gameResult.awayTeam.teamName}</td>
              <td>{gameResult.awayTeam.hits}</td>
              <td>{gameResult.awayTeam.errors}</td>
              <td>{gameResult.awayTeam.leftOnBase}</td>
            </tr>
            <tr>
              <td>{gameResult.homeTeam.teamName}</td>
              <td>{gameResult.homeTeam.hits}</td>
              <td>{gameResult.homeTeam.errors}</td>
              <td>{gameResult.homeTeam.leftOnBase}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ハイライト */}
      {gameResult.highlights.length > 0 && (
        <div className="highlights-card">
          <h3>ハイライト</h3>
          <div className="highlights-list">
            {gameResult.highlights.map((highlight, index) => (
              <div key={index} className="highlight-item">
                <div className="highlight-inning">
                  {highlight.inning}回{highlight.half === 'top' ? '表' : '裏'}
                </div>
                <div className="highlight-description">
                  {highlight.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* プレイログ */}
      <div className="playlog-card">
        <div className="playlog-header">
          <h3>プレイログ</h3>
          <button
            className="toggle-log-button"
            onClick={() => setShowFullLog(!showFullLog)}
          >
            {showFullLog ? '折りたたむ' : 'すべて表示'}
          </button>
        </div>
        <div className={`playlog-list ${showFullLog ? 'expanded' : ''}`}>
          {gameLog.playLog.map((play, index) => (
            <div key={index} className="playlog-item">
              <div className="playlog-inning">
                {play.inning}回{play.half === 'top' ? '表' : '裏'}
              </div>
              <div className="playlog-description">{play.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
