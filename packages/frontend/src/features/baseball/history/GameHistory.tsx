/**
 * 試合履歴一覧画面
 * Requirement 8: 試合履歴と戦績管理
 * AC 6-10: 履歴一覧の表示とページネーション
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllGames,
  calculateOverallRecord,
} from '../history/gameHistoryStorage';
import {
  filterGames,
  calculateRecentRecord,
  calculateTrendAnalysis,
} from '../history/gameHistoryUtils';
import type {
  GameResult,
  GameHistoryFilter,
} from '../types/gameHistory';
import './GameHistory.css';

const PAGE_SIZE = 10;

/**
 * 試合履歴一覧コンポーネント
 */
export function GameHistory() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<GameHistoryFilter>({
    period: 'all',
    result: 'all',
  });

  // 全試合を取得
  const allGames = useMemo(() => getAllGames(), []);

  // フィルタリングされた試合
  const filteredGames = useMemo(
    () => filterGames(allGames, filter),
    [allGames, filter]
  );

  // ページネーション
  const totalPages = Math.ceil(filteredGames.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentGames = filteredGames.slice(startIndex, endIndex);

  // 通算成績
  const overallRecord = useMemo(
    () => calculateOverallRecord(filteredGames),
    [filteredGames]
  );

  // 最近の成績
  const recentRecord = useMemo(
    () => calculateRecentRecord(filteredGames, 10),
    [filteredGames]
  );

  // トレンド分析
  const trendAnalysis = useMemo(
    () => calculateTrendAnalysis(filteredGames, 10),
    [filteredGames]
  );

  const handleGameClick = (gameId: string) => {
    navigate(`/baseball/history/${gameId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilter: Partial<GameHistoryFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
    setCurrentPage(1);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
  };

  return (
    <div className="game-history">
      <div className="history-header">
        <h1>試合履歴</h1>
        <button
          className="back-button"
          onClick={() => navigate('/baseball')}
        >
          メインメニューに戻る
        </button>
      </div>

      {/* 通算成績サマリー */}
      <div className="overall-record">
        <h2>通算成績</h2>
        <div className="record-grid">
          <div className="record-item">
            <span className="record-label">試合数</span>
            <span className="record-value">{overallRecord.totalGames}</span>
          </div>
          <div className="record-item">
            <span className="record-label">勝利</span>
            <span className="record-value win">{overallRecord.wins}</span>
          </div>
          <div className="record-item">
            <span className="record-label">敗北</span>
            <span className="record-value lose">
              {overallRecord.losses}
            </span>
          </div>
          <div className="record-item">
            <span className="record-label">引分</span>
            <span className="record-value">{overallRecord.draws}</span>
          </div>
          <div className="record-item">
            <span className="record-label">勝率</span>
            <span className="record-value">
              {overallRecord.winRate.toFixed(3)}
            </span>
          </div>
          <div className="record-item">
            <span className="record-label">平均得点</span>
            <span className="record-value">
              {overallRecord.avgRunsPerGame.toFixed(2)}
            </span>
          </div>
          <div className="record-item">
            <span className="record-label">平均失点</span>
            <span className="record-value">
              {overallRecord.avgRunsAllowedPerGame.toFixed(2)}
            </span>
          </div>
          <div className="record-item">
            <span className="record-label">最多連勝</span>
            <span className="record-value">
              {overallRecord.longestWinStreak}
            </span>
          </div>
        </div>

        {/* 現在の連勝/連敗 */}
        {overallRecord.currentStreak.type !== 'none' && (
          <div className="current-streak">
            <span className="streak-label">
              {overallRecord.currentStreak.type === 'win'
                ? '現在の連勝'
                : '現在の連敗'}
              :
            </span>
            <span
              className={`streak-value ${overallRecord.currentStreak.type}`}
            >
              {overallRecord.currentStreak.count}
            </span>
          </div>
        )}
      </div>

      {/* 最近の成績 */}
      <div className="recent-record">
        <h2>最近10試合</h2>
        <div className="recent-stats">
          <span className="recent-item">
            {recentRecord.wins}勝 {recentRecord.losses}敗{' '}
            {recentRecord.draws}分
          </span>
          <span className="recent-item">
            勝率: {recentRecord.winRate.toFixed(3)}
          </span>
          <span className="recent-item">
            平均得点: {trendAnalysis.avgRunsPerGame.toFixed(2)}
          </span>
          <span className="recent-item">
            平均失点: {trendAnalysis.avgRunsAllowedPerGame.toFixed(2)}
          </span>
        </div>
      </div>

      {/* フィルタ */}
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="period-filter">期間</label>
          <select
            id="period-filter"
            value={filter.period || 'all'}
            onChange={(e) =>
              handleFilterChange({
                period: e.target.value as GameHistoryFilter['period'],
              })
            }
          >
            <option value="all">全期間</option>
            <option value="last7days">過去7日間</option>
            <option value="last30days">過去30日間</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="result-filter">勝敗</label>
          <select
            id="result-filter"
            value={filter.result || 'all'}
            onChange={(e) =>
              handleFilterChange({
                result: e.target.value as GameHistoryFilter['result'],
              })
            }
          >
            <option value="all">すべて</option>
            <option value="win">勝利のみ</option>
            <option value="lose">敗北のみ</option>
            <option value="draw">引分のみ</option>
          </select>
        </div>

        <div className="filter-info">
          表示中: {filteredGames.length}試合 / 全{allGames.length}試合
        </div>
      </div>

      {/* 試合一覧 */}
      {currentGames.length === 0 ? (
        <div className="no-games">試合履歴がありません</div>
      ) : (
        <>
          <div className="games-list">
            <table className="games-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>対戦相手</th>
                  <th>スコア</th>
                  <th>結果</th>
                  <th>試合時間</th>
                  <th>イニング</th>
                </tr>
              </thead>
              <tbody>
                {currentGames.map((game) => (
                  <tr
                    key={game.gameId}
                    className={`game-row ${game.winner === 'home' ? 'win' : game.winner === 'away' ? 'lose' : 'draw'}`}
                    onClick={() => handleGameClick(game.gameId)}
                  >
                    <td>{formatDate(game.date)}</td>
                    <td>{game.awayTeam.teamName}</td>
                    <td className="score-cell">
                      <span className="home-score">
                        {game.homeTeam.score}
                      </span>
                      <span className="score-separator">-</span>
                      <span className="away-score">
                        {game.awayTeam.score}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`result-badge ${game.winner === 'home' ? 'win' : game.winner === 'away' ? 'lose' : 'draw'}`}
                      >
                        {game.winner === 'home'
                          ? '勝'
                          : game.winner === 'away'
                            ? '敗'
                            : '分'}
                      </span>
                      {game.gameType === 'walk_off' && (
                        <span className="game-type-badge">
                          サヨナラ
                        </span>
                      )}
                      {game.gameType === 'extra' && (
                        <span className="game-type-badge">延長</span>
                      )}
                    </td>
                    <td>{formatTime(game.elapsedSeconds)}</td>
                    <td>{game.finalInning}回</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                前へ
              </button>
              <span className="page-info">
                {currentPage} / {totalPages} ページ
              </span>
              <button
                className="page-button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
