/**
 * インポート/エクスポート詳細設定ダイアログ
 */

import React, { useState } from 'react';
import { Player, Team } from '../types';
import { exportData, importData, ExportOptions, ImportOptions, ImportResult } from '../data/playerStorage';
import './ImportExportDialog.css';

interface ImportExportDialogProps {
  isOpen: boolean;
  mode: 'import' | 'export';
  players: Player[];
  teams: Team[];
  selectedPlayers?: string[];
  onClose: () => void;
  onImportComplete?: () => void;
}

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  isOpen,
  mode,
  players,
  teams,
  selectedPlayers = [],
  onClose,
  onImportComplete,
}) => {
  // エクスポート設定
  const [exportScope, setExportScope] = useState<'all' | 'team' | 'selected'>('all');
  const [exportTeamId, setExportTeamId] = useState('');
  const [includeTeams, setIncludeTeams] = useState(true);
  
  // インポート設定
  const [importFile, setImportFile] = useState<File | null>(null);
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [validateAbilities, setValidateAbilities] = useState(true);
  
  // 結果表示
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };
  
  const handleExport = () => {
    try {
      const options: ExportOptions = {
        scope: exportScope,
        includeTeams,
      };
      
      if (exportScope === 'team' && exportTeamId) {
        options.teamId = exportTeamId;
      } else if (exportScope === 'selected' && selectedPlayers.length > 0) {
        options.playerIds = selectedPlayers;
      }
      
      const data = exportData(options);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const scopeName = exportScope === 'all' ? 'all' : exportScope === 'team' ? 'team' : 'selected';
      a.download = `baseball_${scopeName}_${timestamp}.json`;
      
      a.click();
      URL.revokeObjectURL(url);
      
      showMessage('エクスポートが完了しました', 'success');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      showMessage('エクスポートに失敗しました', 'error');
      console.error('Export error:', error);
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };
  
  const handleImport = () => {
    if (!importFile) {
      showMessage('ファイルを選択してください', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        
        const options: ImportOptions = {
          overwriteDuplicates,
          skipDuplicates,
          validateAbilities,
          createBackup: true,
        };
        
        const result = importData(jsonData, options);
        setImportResult(result);
        
        if (result.success) {
          showMessage(
            `インポート完了: ${result.imported}人追加、${result.overwritten}人上書き、${result.skipped}人スキップ`,
            'success'
          );
          
          if (onImportComplete) {
            setTimeout(() => {
              onImportComplete();
              onClose();
            }, 2000);
          }
        } else {
          showMessage(`インポート失敗: ${result.errors.length}件のエラー`, 'error');
        }
      } catch (error) {
        showMessage('ファイルの読み込みに失敗しました', 'error');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(importFile);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="import-export-overlay" onClick={onClose}>
      <div className="import-export-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="dialog-header">
          <h2>{mode === 'import' ? 'データのインポート' : 'データのエクスポート'}</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </header>
        
        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}
        
        <div className="dialog-content">
          {mode === 'export' ? (
            // エクスポート設定
            <div className="export-settings">
              <div className="setting-group">
                <label className="setting-label">エクスポート範囲</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="all"
                      checked={exportScope === 'all'}
                      onChange={(e) => setExportScope(e.target.value as any)}
                    />
                    すべての選手
                  </label>
                  
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="team"
                      checked={exportScope === 'team'}
                      onChange={(e) => setExportScope(e.target.value as any)}
                    />
                    特定のチーム
                  </label>
                  
                  {exportScope === 'team' && (
                    <select
                      value={exportTeamId}
                      onChange={(e) => setExportTeamId(e.target.value)}
                      className="team-select"
                    >
                      <option value="">チームを選択...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.roster.length}人)
                        </option>
                      ))}
                    </select>
                  )}
                  
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="selected"
                      checked={exportScope === 'selected'}
                      onChange={(e) => setExportScope(e.target.value as any)}
                      disabled={selectedPlayers.length === 0}
                    />
                    選択した選手 ({selectedPlayers.length}人)
                  </label>
                </div>
              </div>
              
              <div className="setting-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeTeams}
                    onChange={(e) => setIncludeTeams(e.target.checked)}
                  />
                  チーム情報も含める
                </label>
              </div>
              
              <div className="export-preview">
                <h4>エクスポート内容</h4>
                <p>選手: {exportScope === 'all' ? players.length : exportScope === 'selected' ? selectedPlayers.length : '選択してください'}人</p>
                <p>チーム: {includeTeams ? teams.length : 0}</p>
              </div>
            </div>
          ) : (
            // インポート設定
            <div className="import-settings">
              <div className="setting-group">
                <label className="setting-label">ファイル選択</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                {importFile && (
                  <div className="file-info">
                    <span>選択されたファイル: {importFile.name}</span>
                    <span>サイズ: {(importFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
              
              <div className="setting-group">
                <label className="setting-label">重複処理</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={overwriteDuplicates}
                      onChange={(e) => {
                        setOverwriteDuplicates(e.target.checked);
                        if (e.target.checked) setSkipDuplicates(false);
                      }}
                    />
                    重複する選手を上書き
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => {
                        setSkipDuplicates(e.target.checked);
                        if (e.target.checked) setOverwriteDuplicates(false);
                      }}
                    />
                    重複する選手をスキップ
                  </label>
                  
                  <p className="help-text">
                    どちらもチェックしない場合、重複する選手は名前を変更して追加されます
                  </p>
                </div>
              </div>
              
              <div className="setting-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={validateAbilities}
                    onChange={(e) => setValidateAbilities(e.target.checked)}
                  />
                  能力値を厳密に検証（1-100の範囲チェック）
                </label>
              </div>
              
              {importResult && (
                <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
                  <h4>インポート結果</h4>
                  <div className="result-stats">
                    <p>✓ 追加: {importResult.imported}人</p>
                    {importResult.overwritten > 0 && <p>✓ 上書き: {importResult.overwritten}人</p>}
                    {importResult.skipped > 0 && <p>⊘ スキップ: {importResult.skipped}人</p>}
                    {importResult.errors.length > 0 && <p>✗ エラー: {importResult.errors.length}件</p>}
                  </div>
                  
                  {importResult.errors.length > 0 && (
                    <div className="error-list">
                      <h5>エラー詳細:</h5>
                      <ul>
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>
                            <strong>{error.name}</strong>: {error.reason}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>...他{importResult.errors.length - 5}件</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <footer className="dialog-footer">
          <button onClick={onClose} className="btn btn-secondary">
            キャンセル
          </button>
          
          {mode === 'export' ? (
            <button
              onClick={handleExport}
              className="btn btn-primary"
              disabled={exportScope === 'team' && !exportTeamId}
            >
              エクスポート
            </button>
          ) : (
            <button
              onClick={handleImport}
              className="btn btn-primary"
              disabled={!importFile}
            >
              インポート
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ImportExportDialog;
