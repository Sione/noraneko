import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { startGame, setPhase, updateLineup } from '../game/gameSlice';
import { Player } from '../types';
import {
  generateRecommendedLineup,
  evaluateLineup,
  getLineupSlotDescription,
  validateLineup,
} from './lineupUtils';
import { getAbilityColor, calculateOverallRating } from './playerAbilityUtils';
import './GameBoard.css';

/**
 * LineupEdit - 打順編集画面
 * タスク8.3: 打順・ロースター運用
 */
export function LineupEdit() {
  const dispatch = useAppDispatch();
  const homeTeam = useAppSelector((state) => state.game.homeTeam);
  const awayTeam = useAppSelector((state) => state.game.awayTeam);
  const isPlayerHome = useAppSelector((state) => state.game.isPlayerHome);
  const allPlayers = useAppSelector((state) => state.game.allPlayers);

  const playerTeam = isPlayerHome ? homeTeam : awayTeam;
  const opponentTeam = isPlayerHome ? awayTeam : homeTeam;

  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [editedLineupIds, setEditedLineupIds] = useState<string[]>(
    playerTeam?.lineup.map((p) => p.id) || []
  );

  const handleStartGame = () => {
    dispatch(startGame());
  };

  const handleBack = () => {
    dispatch(setPhase('team_setup'));
  };

  const handleEditMode = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedSlot(null);
    setEditedLineupIds(playerTeam?.lineup.map((p) => p.id) || []);
  };

  const handleSaveLineup = () => {
    if (!playerTeam) return;

    // 打順を保存
    dispatch(
      updateLineup({
        isHome: isPlayerHome,
        lineupIds: editedLineupIds,
      })
    );
    setIsEditing(false);
    setSelectedSlot(null);
  };

  const handleGenerateRecommended = () => {
    if (!playerTeam) return;

    // 利用可能な選手リストを取得
    const teamPlayers = allPlayers.filter((p) =>
      [...playerTeam.lineup.map((pl) => pl.id), ...playerTeam.bench.map((pb) => pb.id)].includes(
        p.id
      )
    );

    const recommendedIds = generateRecommendedLineup(teamPlayers);
    setEditedLineupIds(recommendedIds);
  };

  const handleSlotClick = (index: number) => {
    if (!isEditing) return;
    setSelectedSlot(index);
  };

  const handlePlayerSelect = (playerId: string) => {
    if (selectedSlot === null) return;

    const newLineup = [...editedLineupIds];
    
    // 選択された選手が既に打順にいる場合は入れ替え
    const existingIndex = newLineup.indexOf(playerId);
    if (existingIndex !== -1) {
      // 入れ替え
      [newLineup[selectedSlot], newLineup[existingIndex]] = [
        newLineup[existingIndex],
        newLineup[selectedSlot],
      ];
    } else {
      // 新しい選手を配置
      newLineup[selectedSlot] = playerId;
    }

    setEditedLineupIds(newLineup);
    setSelectedSlot(null);
  };

  const getPlayerById = (playerId: string): Player | undefined => {
    return allPlayers.find((p) => p.id === playerId);
  };

  const getEditedLineupPlayers = (): Player[] => {
    return editedLineupIds
      .map((id) => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);
  };

  const getAvailablePlayers = (): Player[] => {
    if (!playerTeam) return [];
    const allTeamPlayerIds = [
      ...playerTeam.lineup.map((p) => p.id),
      ...playerTeam.bench.map((p) => p.id),
    ];
    return allPlayers.filter((p) => allTeamPlayerIds.includes(p.id));
  };

  const lineupEvaluation = evaluateLineup(getEditedLineupPlayers());

  if (!playerTeam || !opponentTeam) {
    return <div>チーム情報が見つかりません</div>;
  }

  return (
    <div className="lineup-edit">
      <div className="lineup-edit-container">
        <div className="lineup-edit-header">
          <h2 className="lineup-edit-title">
            {isEditing ? '打順編集' : '打順確認'}
          </h2>
          <p className="lineup-edit-subtitle">
            {isEditing
              ? '打順を編集して保存してください'
              : '打順を確認して試合を開始してください'}
          </p>
        </div>

        {isEditing && (
          <div className="lineup-actions">
            <button
              className="action-button secondary"
              onClick={handleGenerateRecommended}
            >
              推奨打順を生成
            </button>
            <div className="lineup-evaluation">
              <span>総合: {lineupEvaluation.overall}</span>
              <span>出塁: {lineupEvaluation.onBaseRate}</span>
              <span>長打: {lineupEvaluation.power}</span>
              <span>走力: {lineupEvaluation.speed}</span>
            </div>
          </div>
        )}

        <div className="teams-info">
          <div className="team-info">
            <h3 className="team-info-title">
              {isPlayerHome ? '🏠 ' : ''}
              {playerTeam.teamName}
              {isPlayerHome ? ' (あなた)' : ''}
            </h3>
            <div className="lineup-list">
              {(isEditing ? getEditedLineupPlayers() : playerTeam.lineup).map(
                (player, index) => {
                  const overall = calculateOverallRating(player);
                  const color = getAbilityColor(overall);
                  const isSelected = selectedSlot === index;

                  return (
                    <div
                      key={player.id}
                      className={`lineup-item ${isEditing ? 'editable' : ''} ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => handleSlotClick(index)}
                      style={{
                        cursor: isEditing ? 'pointer' : 'default',
                        borderLeft: isEditing
                          ? `4px solid ${color}`
                          : 'none',
                      }}
                    >
                      <span className="lineup-order">{index + 1}</span>
                      <span className="lineup-position">{player.position}</span>
                      <span className="lineup-name">{player.name}</span>
                      {isEditing && (
                        <span
                          className="lineup-overall"
                          style={{ color: color }}
                        >
                          {overall}
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {isEditing && selectedSlot !== null && (
              <div className="player-selection">
                <h4>
                  {selectedSlot + 1}番打者を選択
                  <span className="slot-description">
                    {getLineupSlotDescription(selectedSlot + 1)}
                  </span>
                </h4>
                <div className="available-players">
                  {getAvailablePlayers().map((player) => {
                    const overall = calculateOverallRating(player);
                    const color = getAbilityColor(overall);
                    const isInLineup = editedLineupIds.includes(player.id);

                    return (
                      <div
                        key={player.id}
                        className={`player-option ${
                          isInLineup ? 'in-lineup' : ''
                        }`}
                        onClick={() => handlePlayerSelect(player.id)}
                      >
                        <span className="player-position">
                          {player.position}
                        </span>
                        <span className="player-name">{player.name}</span>
                        <span
                          className="player-overall"
                          style={{ color: color }}
                        >
                          {overall}
                        </span>
                        {isInLineup && (
                          <span className="lineup-badge">
                            {editedLineupIds.indexOf(player.id) + 1}番
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!isEditing && (
            <>
              <div className="vs-divider">VS</div>

              <div className="team-info">
                <h3 className="team-info-title">
                  {!isPlayerHome ? '🏠 ' : ''}
                  {opponentTeam.teamName}
                  {!isPlayerHome ? ' (あなた)' : ''}
                </h3>
                <div className="lineup-list">
                  {opponentTeam.lineup.map((player, index) => (
                    <div key={player.id} className="lineup-item">
                      <span className="lineup-order">{index + 1}</span>
                      <span className="lineup-position">{player.position}</span>
                      <span className="lineup-name">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lineup-edit-actions">
          {isEditing ? (
            <>
              <button
                className="action-button secondary"
                onClick={handleCancelEdit}
              >
                キャンセル
              </button>
              <button
                className="action-button primary"
                onClick={handleSaveLineup}
              >
                保存
              </button>
            </>
          ) : (
            <>
              <button className="action-button secondary" onClick={handleBack}>
                戻る
              </button>
              <button
                className="action-button secondary"
                onClick={handleEditMode}
              >
                打順編集
              </button>
              <button
                className="action-button primary"
                onClick={handleStartGame}
              >
                試合開始
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
