import { useState } from 'react';
import './PauseMenu.css';

interface PauseMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onExitWithoutSave: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

/**
 * PauseMenu - 一時停止メニューコンポーネント
 * タスク11.3: 中断/再開フロー
 * 
 * Requirement 7 AC 11-15:
 * - 一時停止メニュー
 * - 保存して終了/保存せずに終了
 */
export function PauseMenu({
  isOpen,
  onClose,
  onSaveAndExit,
  onExitWithoutSave,
  onOpenSettings,
  onOpenHelp,
}: PauseMenuProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExitWithoutSave = () => {
    setShowExitConfirm(true);
  };

  const confirmExitWithoutSave = () => {
    setShowExitConfirm(false);
    onExitWithoutSave();
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  return (
    <div className="pause-menu-overlay">
      <div className="pause-menu">
        {!showExitConfirm ? (
          <>
            <div className="pause-menu-header">
              <h2>一時停止</h2>
            </div>

            <div className="pause-menu-content">
              <button className="pause-menu-button pause-button-resume" onClick={onClose}>
                <span className="button-icon">▶️</span>
                <div className="button-content">
                  <span className="button-label">試合を再開</span>
                  <span className="button-description">一時停止を解除して試合に戻ります</span>
                </div>
              </button>

              <button className="pause-menu-button pause-button-settings" onClick={onOpenSettings}>
                <span className="button-icon">⚙️</span>
                <div className="button-content">
                  <span className="button-label">設定</span>
                  <span className="button-description">ゲームの設定を変更します</span>
                </div>
              </button>

              <button className="pause-menu-button pause-button-help" onClick={onOpenHelp}>
                <span className="button-icon">❓</span>
                <div className="button-content">
                  <span className="button-label">ヘルプ</span>
                  <span className="button-description">操作方法とルールを確認します</span>
                </div>
              </button>

              <button className="pause-menu-button pause-button-save" onClick={onSaveAndExit}>
                <span className="button-icon">💾</span>
                <div className="button-content">
                  <span className="button-label">保存して終了</span>
                  <span className="button-description">試合を保存してメインメニューに戻ります</span>
                </div>
              </button>

              <button 
                className="pause-menu-button pause-button-exit" 
                onClick={handleExitWithoutSave}
              >
                <span className="button-icon">🚪</span>
                <div className="button-content">
                  <span className="button-label">保存せずに終了</span>
                  <span className="button-description">試合を破棄してメインメニューに戻ります</span>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="pause-menu-header">
              <h2>確認</h2>
            </div>

            <div className="pause-menu-content">
              <div className="exit-confirm-message">
                <p className="exit-warning">⚠️</p>
                <p>
                  保存せずに終了すると、現在の試合内容は失われます。
                  <br />
                  本当に終了しますか？
                </p>
              </div>

              <div className="exit-confirm-actions">
                <button 
                  className="pause-menu-button pause-button-cancel" 
                  onClick={cancelExit}
                >
                  キャンセル
                </button>
                <button 
                  className="pause-menu-button pause-button-confirm-exit" 
                  onClick={confirmExitWithoutSave}
                >
                  保存せずに終了
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
