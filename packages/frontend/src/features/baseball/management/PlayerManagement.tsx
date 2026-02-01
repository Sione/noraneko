/**
 * 選手管理画面
 */

import React, { useState, useEffect } from 'react';
import { Player, Position } from '../types';
import {
  loadPlayers,
  savePlayers,
  exportData,
  importData,
  getBackups,
  restoreFromBackup,
  checkDataIntegrity,
} from '../data/playerStorage';
import {
  calculateOverallRating,
  getHitterType,
  getPitcherType,
  filterPlayers,
  sortPlayers,
  createNewPlayer,
  generateRandomPlayer,
  createPlayerFromTemplate,
  clonePlayer,
} from '../data/playerUtils';
import PlayerEditor from './PlayerEditor';
import PlayerDetail from './PlayerDetail';
import './PlayerManagement.css';

type SortBy = 'name' | 'position' | 'overall';
type SortOrder = 'asc' | 'desc';

const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // フィルター・ソート状態
  const [filterPosition, setFilterPosition] = useState<Position | ''>('');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 50;
  
  // メッセージ
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, []);
  
  // フィルター・ソート適用
  useEffect(() => {
    applyFiltersAndSort();
  }, [players, filterPosition, searchText, sortBy, sortOrder]);
  
  const loadData = () => {
    const loadedPlayers = loadPlayers();
    setPlayers(loadedPlayers);
    
    if (loadedPlayers.length === 0) {
      showMessage('選手データがありません。新規作成してください。', 'info');
    } else {
      showMessage(`${loadedPlayers.length}人の選手をロードしました`, 'success');
    }
  };
  
  const applyFiltersAndSort = () => {
    let result = players;
    
    // フィルタリング
    result = filterPlayers(result, {
      position: filterPosition || undefined,
      searchText: searchText || undefined,
    });
    
    // ソート
    result = sortPlayers(result, sortBy, sortOrder);
    
    setFilteredPlayers(result);
    setCurrentPage(1);
  };
  
  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleCreateNew = () => {
    setSelectedPlayer(null);
    setIsCreating(true);
    setIsEditing(true);
  };
  
  const handleEdit = (player: Player) => {
    setSelectedPlayer(player);
    setIsCreating(false);
    setIsEditing(true);
  };
  
  const handleDelete = (player: Player) => {
    if (!confirm(`本当に「${player.name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }
    
    const newPlayers = players.filter((p) => p.id !== player.id);
    setPlayers(newPlayers);
    savePlayers(newPlayers);
    
    showMessage(`${player.name}を削除しました`, 'success');
    setSelectedPlayer(null);
  };
  
  const handleSave = (player: Player) => {
    let newPlayers: Player[];
    
    if (isCreating) {
      newPlayers = [...players, player];
      showMessage(`${player.name}を作成しました`, 'success');
    } else {
      newPlayers = players.map((p) => (p.id === player.id ? player : p));
      showMessage(`${player.name}を更新しました`, 'success');
    }
    
    setPlayers(newPlayers);
    savePlayers(newPlayers);
    setIsEditing(false);
    setIsCreating(false);
    setSelectedPlayer(player);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    if (isCreating) {
      setSelectedPlayer(null);
    }
  };
  
  const handleExport = () => {
    try {
      const data = exportData(false); // 選手データのみ
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `players_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showMessage(`${players.length}人の選手をエクスポートしました`, 'success');
    } catch (error) {
      showMessage('エクスポートに失敗しました', 'error');
    }
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const result = importData(jsonData, { skipDuplicates: false });
        
        if (result.success) {
          loadData();
          showMessage(
            `${result.imported}人の選手をインポートしました（スキップ: ${result.skipped}人）`,
            'success'
          );
        } else {
          showMessage(`インポート失敗: ${result.errors.join(', ')}`, 'error');
        }
      } catch (error) {
        showMessage('ファイル形式が正しくありません', 'error');
      }
    };
    reader.readAsText(file);
    
    // ファイル入力をリセット
    event.target.value = '';
  };
  
  const handleCheckIntegrity = () => {
    const result = checkDataIntegrity();
    
    if (result.isValid) {
      showMessage('データの整合性チェック: 問題なし', 'success');
    } else {
      showMessage(`データの整合性チェック: エラーあり (${result.errors.length}件)`, 'error');
      console.error('Integrity errors:', result.errors);
    }
  };
  
  const handleRestoreBackup = () => {
    const backups = getBackups();
    
    if (backups.length === 0) {
      showMessage('バックアップが見つかりません', 'error');
      return;
    }
    
    const latestBackup = backups[0];
    const date = new Date(latestBackup.timestamp).toLocaleString('ja-JP');
    
    if (!confirm(`最新のバックアップ（${date}）から復元しますか？現在のデータは失われます。`)) {
      return;
    }
    
    if (restoreFromBackup(latestBackup.timestamp)) {
      loadData();
      showMessage('バックアップから復元しました', 'success');
    } else {
      showMessage('復元に失敗しました', 'error');
    }
  };
  
  // ページネーション
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = filteredPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer);
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  
  const positions: (Position | '')[] = ['', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  
  return (
    <div className="player-management">
      <header className="player-management-header">
        <h1>選手管理</h1>
        <div className="header-actions">
          <button onClick={handleCreateNew} className="btn btn-primary">
            新規作成
          </button>
          <button onClick={handleExport} className="btn btn-secondary">
            エクスポート
          </button>
          <label className="btn btn-secondary">
            インポート
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleCheckIntegrity} className="btn btn-secondary">
            整合性チェック
          </button>
          <button onClick={handleRestoreBackup} className="btn btn-secondary">
            バックアップ復元
          </button>
        </div>
      </header>
      
      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}
      
      <div className="player-management-content">
        {/* サイドバー: フィルター・選手リスト */}
        <aside className="player-list-sidebar">
          <div className="filter-section">
            <h3>フィルター</h3>
            
            <div className="filter-group">
              <label>ポジション</label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value as Position | '')}
              >
                <option value="">すべて</option>
                {positions.slice(1).map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>検索</label>
              <input
                type="text"
                placeholder="選手名で検索..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>並び替え</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                <option value="name">名前</option>
                <option value="position">ポジション</option>
                <option value="overall">総合評価</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
                <option value="asc">昇順</option>
                <option value="desc">降順</option>
              </select>
            </div>
          </div>
          
          <div className="player-list">
            <div className="player-list-header">
              <span>{filteredPlayers.length}人の選手</span>
            </div>
            
            <div className="player-list-items">
              {currentPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`player-list-item ${
                    selectedPlayer?.id === player.id ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setIsEditing(false);
                  }}
                >
                  <div className="player-list-item-main">
                    <span className="player-name">{player.name}</span>
                    <span className="player-position">{player.position}</span>
                  </div>
                  <div className="player-list-item-sub">
                    <span className="player-overall">
                      OVR: {calculateOverallRating(player)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  前へ
                </button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  次へ
                </button>
              </div>
            )}
          </div>
        </aside>
        
        {/* メインコンテンツ: 選手詳細・編集 */}
        <main className="player-detail-area">
          {isEditing ? (
            <PlayerEditor
              player={isCreating ? null : selectedPlayer}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : selectedPlayer ? (
            <PlayerDetail
              player={selectedPlayer}
              onEdit={() => handleEdit(selectedPlayer)}
              onDelete={() => handleDelete(selectedPlayer)}
              onClose={() => setSelectedPlayer(null)}
            />
          ) : (
            <div className="no-selection">
              <p>選手を選択してください</p>
              <p>または</p>
              <button onClick={handleCreateNew} className="btn btn-primary">
                新規作成
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PlayerManagement;
