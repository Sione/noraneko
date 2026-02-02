/**
 * 選手管理画面
 */

import React, { useState, useEffect } from 'react';
import { Player, Position } from '../types';
import {
  loadPlayers,
  savePlayers,
  loadTeams,
  checkDataIntegrity,
} from '../data/playerStorage';
import { isPlayerInHistory } from '../history/gameHistoryStorage';
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
import BackupManager from './BackupManager';
import ImportExportDialog from './ImportExportDialog';
import './PlayerManagement.css';

type SortBy = 'name' | 'position' | 'overall';
type SortOrder = 'asc' | 'desc';

const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // ダイアログ表示状態
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // フィルター・ソート状態
  const [filterPosition, setFilterPosition] = useState<Position | ''>('');
  const [searchText, setSearchText] = useState('');
  const [filterMinOVR, setFilterMinOVR] = useState<number>(0);
  const [filterMaxOVR, setFilterMaxOVR] = useState<number>(100);
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
  }, [players, filterPosition, searchText, filterMinOVR, filterMaxOVR, sortBy, sortOrder]);
  
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
      minOverall: filterMinOVR > 0 ? filterMinOVR : undefined,
      maxOverall: filterMaxOVR < 100 ? filterMaxOVR : undefined,
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
    // AC 9.33: 試合履歴に含まれているかチェック
    const historyCheck = isPlayerInHistory(player.id);
    
    let confirmMessage = `本当に「${player.name}」を削除しますか？この操作は取り消せません。`;
    
    if (historyCheck.inHistory) {
      confirmMessage = 
        `「${player.name}」は試合履歴に含まれています（${historyCheck.gamesCount}試合に出場）。\n\n` +
        `削除しても履歴は保持されますが、選手データは失われます。\n\n` +
        `本当に削除しますか？`;
    }
    
    if (!confirm(confirmMessage)) {
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
    setShowExportDialog(true);
  };
  
  const handleImport = () => {
    setShowImportDialog(true);
  };
  
  const handleCheckIntegrity = () => {
    const result = checkDataIntegrity();
    
    if (result.isValid) {
      showMessage('データの整合性チェック: 問題なし', 'success');
    } else {
      const errorCount = result.errors.filter((e) => e.severity === 'error').length;
      const warningCount = result.errors.filter((e) => e.severity === 'warning').length;
      
      showMessage(
        `データの整合性チェック: エラー ${errorCount}件、警告 ${warningCount}件`,
        errorCount > 0 ? 'error' : 'info'
      );
      
      console.group('整合性チェック結果');
      console.log('統計:', result.stats);
      console.log('エラー:', result.errors);
      console.log('警告:', result.warnings);
      console.groupEnd();
    }
  };
  
  const handleShowBackupManager = () => {
    setShowBackupManager(true);
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
          <button onClick={handleImport} className="btn btn-secondary">
            インポート
          </button>
          <button onClick={handleCheckIntegrity} className="btn btn-secondary">
            整合性チェック
          </button>
          <button onClick={handleShowBackupManager} className="btn btn-secondary">
            バックアップ管理
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
              <label>総合評価（OVR）範囲</label>
              <div className="ovr-filter-inputs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="最小"
                  value={filterMinOVR || ''}
                  onChange={(e) => setFilterMinOVR(Number(e.target.value) || 0)}
                  className="ovr-filter-input"
                />
                <span>～</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="最大"
                  value={filterMaxOVR === 100 ? '' : filterMaxOVR}
                  onChange={(e) => setFilterMaxOVR(Number(e.target.value) || 100)}
                  className="ovr-filter-input"
                />
              </div>
              {(filterMinOVR > 0 || filterMaxOVR < 100) && (
                <button
                  onClick={() => {
                    setFilterMinOVR(0);
                    setFilterMaxOVR(100);
                  }}
                  className="btn btn-sm filter-reset"
                >
                  リセット
                </button>
              )}
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
      
      {/* バックアップ管理モーダル */}
      <BackupManager
        isOpen={showBackupManager}
        onClose={() => setShowBackupManager(false)}
        onRestore={loadData}
      />
      
      {/* インポートダイアログ */}
      <ImportExportDialog
        isOpen={showImportDialog}
        mode="import"
        players={players}
        teams={loadTeams()}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={loadData}
      />
      
      {/* エクスポートダイアログ */}
      <ImportExportDialog
        isOpen={showExportDialog}
        mode="export"
        players={players}
        teams={loadTeams()}
        selectedPlayers={selectedPlayer ? [selectedPlayer.id] : []}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
};

export default PlayerManagement;
