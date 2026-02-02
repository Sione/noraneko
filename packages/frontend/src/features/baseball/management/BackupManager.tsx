/**
 * バックアップ管理モーダル
 */

import React, { useState, useEffect } from 'react';
import {
  getBackups,
  restoreFromBackup,
  deleteBackup,
  clearAllBackups,
  createBackup,
} from '../data/playerStorage';
import './BackupManager.css';

interface BackupData {
  timestamp: number;
  players: any[];
  teams: any[];
}

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ isOpen, onClose, onRestore }) => {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen]);
  
  const loadBackups = () => {
    const loadedBackups = getBackups();
    setBackups(loadedBackups);
    
    if (loadedBackups.length === 0) {
      showMessage('バックアップがありません', 'info');
    }
  };
  
  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleCreateBackup = () => {
    createBackup();
    loadBackups();
    showMessage('バックアップを作成しました', 'success');
  };
  
  const handleRestore = (backup: BackupData) => {
    const date = new Date(backup.timestamp).toLocaleString('ja-JP');
    
    if (!confirm(`バックアップ（${date}）から復元しますか？\n現在のデータは失われます。`)) {
      return;
    }
    
    if (restoreFromBackup(backup.timestamp)) {
      showMessage('バックアップから復元しました', 'success');
      setTimeout(() => {
        onRestore();
        onClose();
      }, 1000);
    } else {
      showMessage('復元に失敗しました', 'error');
    }
  };
  
  const handleDelete = (backup: BackupData) => {
    const date = new Date(backup.timestamp).toLocaleString('ja-JP');
    
    if (!confirm(`バックアップ（${date}）を削除しますか？`)) {
      return;
    }
    
    if (deleteBackup(backup.timestamp)) {
      showMessage('バックアップを削除しました', 'success');
      loadBackups();
      if (selectedBackup?.timestamp === backup.timestamp) {
        setSelectedBackup(null);
      }
    } else {
      showMessage('削除に失敗しました', 'error');
    }
  };
  
  const handleClearAll = () => {
    if (!confirm('すべてのバックアップを削除しますか？\nこの操作は取り消せません。')) {
      return;
    }
    
    if (clearAllBackups()) {
      showMessage('すべてのバックアップを削除しました', 'success');
      loadBackups();
      setSelectedBackup(null);
    } else {
      showMessage('削除に失敗しました', 'error');
    }
  };
  
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  const formatSize = (backup: BackupData): string => {
    const size = new Blob([JSON.stringify(backup)]).size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="backup-manager-overlay" onClick={onClose}>
      <div className="backup-manager-modal" onClick={(e) => e.stopPropagation()}>
        <header className="backup-manager-header">
          <h2>バックアップ管理</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </header>
        
        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}
        
        <div className="backup-manager-actions">
          <button onClick={handleCreateBackup} className="btn btn-primary">
            新しいバックアップを作成
          </button>
          <button
            onClick={handleClearAll}
            className="btn btn-danger"
            disabled={backups.length === 0}
          >
            すべて削除
          </button>
        </div>
        
        <div className="backup-manager-content">
          <aside className="backup-list">
            <div className="backup-list-header">
              <h3>バックアップ一覧 ({backups.length}/10)</h3>
            </div>
            
            {backups.length === 0 ? (
              <div className="backup-list-empty">
                <p>バックアップがありません</p>
              </div>
            ) : (
              <div className="backup-list-items">
                {backups.map((backup, index) => (
                  <div
                    key={backup.timestamp}
                    className={`backup-list-item ${
                      selectedBackup?.timestamp === backup.timestamp ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedBackup(backup)}
                  >
                    <div className="backup-item-header">
                      <span className="backup-index">#{index + 1}</span>
                      {index === 0 && <span className="backup-badge">最新</span>}
                    </div>
                    <div className="backup-item-date">
                      {formatDate(backup.timestamp)}
                    </div>
                    <div className="backup-item-info">
                      <span>選手: {backup.players.length}人</span>
                      <span>チーム: {backup.teams.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
          
          <main className="backup-detail">
            {selectedBackup ? (
              <div className="backup-detail-content">
                <h3>バックアップ詳細</h3>
                
                <div className="backup-detail-info">
                  <div className="info-row">
                    <span className="info-label">作成日時:</span>
                    <span className="info-value">{formatDate(selectedBackup.timestamp)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">サイズ:</span>
                    <span className="info-value">{formatSize(selectedBackup)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">選手数:</span>
                    <span className="info-value">{selectedBackup.players.length}人</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">チーム数:</span>
                    <span className="info-value">{selectedBackup.teams.length}</span>
                  </div>
                </div>
                
                <div className="backup-detail-actions">
                  <button
                    onClick={() => handleRestore(selectedBackup)}
                    className="btn btn-primary btn-large"
                  >
                    このバックアップから復元
                  </button>
                  
                  <button
                    onClick={() => handleDelete(selectedBackup)}
                    className="btn btn-danger"
                  >
                    削除
                  </button>
                </div>
                
                <div className="backup-detail-warning">
                  <p>⚠️ 復元を実行すると、現在のデータは失われます</p>
                  <p>復元前に自動的にバックアップが作成されます</p>
                </div>
              </div>
            ) : (
              <div className="backup-detail-empty">
                <p>バックアップを選択してください</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
