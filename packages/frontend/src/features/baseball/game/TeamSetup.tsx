import { useState } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { setTeams, resetGame } from '../game/gameSlice';
import { homeTeam, awayTeam, homePlayers, awayPlayers, getPlayerById } from '../data/sampleData';
import { TeamInGame } from '../types';
import { PlayerInGame } from '../types/player';
import './GameBoard.css';

/**
 * TeamSetup - チーム選択画面
 */
export function TeamSetup() {
  const dispatch = useAppDispatch();
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<'home' | 'away'>('home');
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<'home' | 'away'>('away');
  const [playerSide, setPlayerSide] = useState<'home' | 'away'>('home');

  const handleConfirm = () => {
    // 選択されたチームを取得
    const homeTeamData = selectedHomeTeam === 'home' ? homeTeam : awayTeam;
    const awayTeamData = selectedAwayTeam === 'home' ? homeTeam : awayTeam;

    // TeamInGame形式に変換
    const homeTeamInGame: TeamInGame = {
      teamId: homeTeamData.id,
      teamName: homeTeamData.name,
      abbreviation: homeTeamData.abbreviation,
      lineup: homeTeamData.defaultLineup
        .map((playerId) => {
          const player = getPlayerById(playerId);
          if (!player) return null;
          return {
            ...player,
            currentPitchCount: 0,
            atBats: 0,
            hits: 0,
            runs: 0,
            rbis: 0,
          } as PlayerInGame;
        })
        .filter((p): p is PlayerInGame => p !== null),
      bench: [],
      currentBatterIndex: 0,
      score: 0,
      hits: 0,
      errors: 0,
      leftOnBase: 0,
    };

    const awayTeamInGame: TeamInGame = {
      teamId: awayTeamData.id,
      teamName: awayTeamData.name,
      abbreviation: awayTeamData.abbreviation,
      lineup: awayTeamData.defaultLineup
        .map((playerId) => {
          const player = getPlayerById(playerId);
          if (!player) return null;
          return {
            ...player,
            currentPitchCount: 0,
            atBats: 0,
            hits: 0,
            runs: 0,
            rbis: 0,
          } as PlayerInGame;
        })
        .filter((p): p is PlayerInGame => p !== null),
      bench: [],
      currentBatterIndex: 0,
      score: 0,
      hits: 0,
      errors: 0,
      leftOnBase: 0,
    };

    // Reduxに設定
    dispatch(
      setTeams({
        homeTeam: homeTeamInGame,
        awayTeam: awayTeamInGame,
        isPlayerHome: playerSide === 'home',
        allPlayers: [...homePlayers, ...awayPlayers], // タスク8.3: 全選手データを渡す
      }),
    );
  };

  const handleCancel = () => {
    dispatch(resetGame());
  };

  const isValid = selectedHomeTeam !== selectedAwayTeam;

  return (
    <div className="team-setup">
      <div className="team-setup-container">
        <div className="team-setup-header">
          <h2 className="team-setup-title">チーム選択</h2>
          <p className="team-setup-subtitle">対戦するチームを選択してください</p>
        </div>

        <div className="team-selection">
          <div className="team-select-group">
            <label className="team-select-label">ホームチーム</label>
            <select
              className="team-select"
              value={selectedHomeTeam}
              onChange={(e) => setSelectedHomeTeam(e.target.value as 'home' | 'away')}
            >
              <option value="home">{homeTeam.name}</option>
              <option value="away">{awayTeam.name}</option>
            </select>
          </div>

          <div className="team-select-group">
            <label className="team-select-label">ビジターチーム</label>
            <select
              className="team-select"
              value={selectedAwayTeam}
              onChange={(e) => setSelectedAwayTeam(e.target.value as 'home' | 'away')}
            >
              <option value="home">{homeTeam.name}</option>
              <option value="away">{awayTeam.name}</option>
            </select>
          </div>
        </div>

        {!isValid && (
          <div style={{ color: 'red', textAlign: 'center', marginBottom: '16px' }}>
            同じチームを選択することはできません
          </div>
        )}

        <div className="side-selection">
          <h3 className="side-selection-title">あなたが操作するチームを選択</h3>
          <div className="side-options">
            <button
              className={`side-option ${playerSide === 'home' ? 'selected' : ''}`}
              onClick={() => setPlayerSide('home')}
            >
              ホーム
            </button>
            <button
              className={`side-option ${playerSide === 'away' ? 'selected' : ''}`}
              onClick={() => setPlayerSide('away')}
            >
              ビジター
            </button>
          </div>
        </div>

        <div className="team-setup-actions">
          <button className="action-button secondary" onClick={handleCancel}>
            キャンセル
          </button>
          <button className="action-button primary" onClick={handleConfirm} disabled={!isValid}>
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
