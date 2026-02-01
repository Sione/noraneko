import { useState, useEffect } from 'react';
import { hasSavedGame, getSavedGameTimestamp } from './autoSave';
import './ResumeGameDialog.css';

interface ResumeGameDialogProps {
  isOpen: boolean;
  onResume: () => void;
  onStartNew: () => void;
}

/**
 * ResumeGameDialog - 試合再開確認ダイアログ
 * タスク11.2, 11.3: システムエラーと自動保存、中断/再開フロー
 * 
 * Requirement 7 AC 8, 14:
 * - 再起動時の復旧確認ダイアログ
 * - 試合状態の復元
 */
export function ResumeGameDialog({
  isOpen,
  onResume,
  onStartNew,
}: ResumeGameDialogProps) {
  const [savedTimestamp, setSavedTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      const timestamp = getSavedGameTimestamp();
      setSavedTimestamp(timestamp);
    }
  }, [isOpen]);

  if (!isOpen || !hasSavedGame()) return null;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'たった今';
    } else if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays === 1) {
      return '昨日';
    } else {
      return `${diffDays}日前`;
    }
  };

  return (
    <div className="resume-dialog-overlay">
      <div className="resume-dialog">
        <div className="resume-dialog-header">
          <h2>試合を再開しますか？</h2>
        </div>

        <div className="resume-dialog-content">
          <div className="resume-info">
            <div className="resume-icon">💾</div>
            <p>
              保存された試合が見つかりました。
              <br />
              {savedTimestamp && (
                <span className="resume-timestamp">
                  保存日時: {formatTimestamp(savedTimestamp)}
                </span>
              )}
            </p>
          </div>

          <div className="resume-actions">
            <button className="resume-button resume-button-resume" onClick={onResume}>
              <span className="button-icon">▶️</span>
              <div className="button-content">
                <span className="button-label">試合を再開</span>
                <span className="button-description">前回の続きからプレイします</span>
              </div>
            </button>

            <button className="resume-button resume-button-new" onClick={onStartNew}>
              <span className="button-icon">🆕</span>
              <div className="button-content">
                <span className="button-label">新しい試合を開始</span>
                <span className="button-description">保存データは削除されます</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * カスタムフック: 試合再開ダイアログの管理
 */
export function useResumeGameDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // アプリ起動時に保存データがあるかチェック
    if (hasSavedGame()) {
      setIsOpen(true);
    }
  }, []);

  const handleResume = () => {
    setIsOpen(false);
    // 保存データを復元する処理は呼び出し側で実装
  };

  const handleStartNew = () => {
    setIsOpen(false);
    // 新しい試合を開始する処理は呼び出し側で実装
  };

  return {
    isOpen,
    handleResume,
    handleStartNew,
    closeDialog: () => setIsOpen(false),
  };
}
