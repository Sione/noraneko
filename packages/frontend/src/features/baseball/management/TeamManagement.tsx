/**
 * チーム管理コンポーネント
 */

import React, { useState, useEffect } from 'react';
import { Team, Player } from '../types';
import { loadTeams, saveTeams } from '../data/playerStorage';
import { loadPlayers } from '../data/playerStorage';
import './TeamManagement.css';

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // メッセージ
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    const loadedTeams = loadTeams();
    const loadedPlayers = loadPlayers();
    setTeams(loadedTeams);
    setPlayers(loadedPlayers);
    
    if (loadedTeams.length === 0) {
      showMessage('チームデータがありません。新規作成してください。', 'info');
    } else {
      showMessage(`${loadedTeams.length}チームをロードしました`, 'success');
    }
  };
  
  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleCreateTeam = () => {
    const name = prompt('チーム名を入力してください:');
    if (!name || !name.trim()) return;
    
    const abbreviation = prompt('略称を入力してください (3文字):');
    if (!abbreviation || !abbreviation.trim()) return;
    
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase().slice(0, 3),
      roster: [],
      defaultLineup: [],
      bench: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const newTeams = [...teams, newTeam];
    setTeams(newTeams);
    saveTeams(newTeams);
    setSelectedTeam(newTeam);
    showMessage(`${newTeam.name}を作成しました`, 'success');
  };
  
  const handleDeleteTeam = (team: Team) => {
    if (!confirm(`本当に「${team.name}」を削除しますか？`)) {
      return;
    }
    
    const newTeams = teams.filter((t) => t.id !== team.id);
    setTeams(newTeams);
    saveTeams(newTeams);
    
    // 選手のteamIdをクリア
    const updatedPlayers = players.map((p) =>
      p.teamId === team.id ? { ...p, teamId: null } : p
    );
    setPlayers(updatedPlayers);
    
    showMessage(`${team.name}を削除しました`, 'success');
    setSelectedTeam(null);
  };
  
  const getTeamPlayers = (teamId: string): Player[] => {
    return players.filter((p) => p.teamId === teamId);
  };
  
  const getFreePlayers = (): Player[] => {
    return players.filter((p) => !p.teamId);
  };
  
  return (
    <div className="team-management">
      <header className="team-management-header">
        <h1>チーム管理</h1>
        <div className="header-actions">
          <button onClick={handleCreateTeam} className="btn btn-primary">
            新規チーム作成
          </button>
        </div>
      </header>
      
      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}
      
      <div className="team-management-content">
        {/* チーム一覧 */}
        <aside className="team-list-sidebar">
          <div className="team-list-header">
            <span>{teams.length}チーム</span>
          </div>
          
          <div className="team-list-items">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`team-list-item ${
                  selectedTeam?.id === team.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="team-name">{team.name}</div>
                <div className="team-abbr">{team.abbreviation}</div>
                <div className="team-roster-count">
                  {getTeamPlayers(team.id).length}人
                </div>
              </div>
            ))}
          </div>
        </aside>
        
        {/* チーム詳細 */}
        <main className="team-detail-area">
          {selectedTeam ? (
            <div className="team-detail">
              <header className="team-detail-header">
                <div className="team-detail-title">
                  <h2>{selectedTeam.name}</h2>
                  <span className="team-detail-abbr">{selectedTeam.abbreviation}</span>
                </div>
                <div className="team-detail-actions">
                  <button
                    onClick={() => handleDeleteTeam(selectedTeam)}
                    className="btn btn-danger"
                  >
                    削除
                  </button>
                </div>
              </header>
              
              <div className="team-detail-content">
                <section className="team-roster-section">
                  <h3>ロースター ({getTeamPlayers(selectedTeam.id).length}人)</h3>
                  
                  <div className="roster-list">
                    {getTeamPlayers(selectedTeam.id).map((player) => (
                      <div key={player.id} className="roster-player-item">
                        <span className="player-position">{player.position}</span>
                        <span className="player-name">{player.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  {getTeamPlayers(selectedTeam.id).length === 0 && (
                    <p className="empty-message">
                      ロースターが空です。選手管理から選手を追加してください。
                    </p>
                  )}
                </section>
                
                <section className="free-agents-section">
                  <h3>フリーエージェント ({getFreePlayers().length}人)</h3>
                  
                  <div className="free-agents-list">
                    {getFreePlayers().map((player) => (
                      <div key={player.id} className="free-agent-item">
                        <span className="player-position">{player.position}</span>
                        <span className="player-name">{player.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  {getFreePlayers().length === 0 && (
                    <p className="empty-message">
                      フリーエージェントがいません。
                    </p>
                  )}
                </section>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>チームを選択してください</p>
              <p>または</p>
              <button onClick={handleCreateTeam} className="btn btn-primary">
                新規チーム作成
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeamManagement;
