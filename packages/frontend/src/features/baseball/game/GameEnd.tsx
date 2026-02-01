import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { resetGame } from '../game/gameSlice';
import './GameEnd.css';

/**
 * GameEnd - 試合終了画面
 */
export function GameEnd() {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.game);
  const { score, homeTeam, awayTeam, elapsedSeconds, playLog } = gameState;

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

        {/* アクションボタン */}
        <div className="game-end-actions">
          <button className="action-button primary" onClick={handleBackToMenu}>
            メインメニューに戻る
          </button>
          <button className="action-button secondary" disabled>
            試合履歴を見る（実装予定）
          </button>
        </div>
      </div>
    </div>
  );
}
