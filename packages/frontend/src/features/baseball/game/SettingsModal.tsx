import { useState, useEffect } from 'react';
import { UserSettings, loadSettings, saveSettings, resetSettings, applyTheme } from './settings';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal - 設定モーダルコンポーネント
 * タスク11.6: アクセシビリティとカスタマイズ
 * 
 * Requirement 7 AC 26-30:
 * - 表示言語/テーマ/難易度の設定
 * - 設定の永続化
 */
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(loadSettings());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      // モーダルを開いたときに最新の設定を読み込む
      setSettings(loadSettings());
      setHasUnsavedChanges(false);
      setSaveStatus('idle');
    }
  }, [isOpen]);

  const handleChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    
    const success = saveSettings(settings);
    
    if (success) {
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      
      // テーマを適用
      applyTheme(settings.theme);
      
      // 保存成功メッセージを一時的に表示
      setTimeout(() => {
        if (saveStatus === 'saved') {
          setSaveStatus('idle');
        }
      }, 2000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleReset = () => {
    if (window.confirm('設定を初期値に戻しますか？この操作は取り消せません。')) {
      const defaultSettings = resetSettings();
      setSettings(defaultSettings);
      setHasUnsavedChanges(false);
      setSaveStatus('idle');
      applyTheme(defaultSettings.theme);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('保存されていない変更があります。破棄して閉じますか？')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={handleClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>設定</h2>
          <button className="settings-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="settings-modal-content">
          {/* 表示設定 */}
          <section className="settings-section">
            <h3>表示設定</h3>
            
            <div className="settings-item">
              <label htmlFor="language">表示言語</label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value as 'ja' | 'en')}
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="settings-item">
              <label htmlFor="theme">テーマ</label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value as 'light' | 'dark' | 'auto')}
              >
                <option value="light">ライト</option>
                <option value="dark">ダーク</option>
                <option value="auto">自動（システム設定に従う）</option>
              </select>
            </div>

            <div className="settings-item">
              <label htmlFor="animationEnabled">
                <input
                  type="checkbox"
                  id="animationEnabled"
                  checked={settings.animationEnabled}
                  onChange={(e) => handleChange('animationEnabled', e.target.checked)}
                />
                <span>アニメーション効果を有効にする</span>
              </label>
            </div>
          </section>

          {/* ゲーム設定 */}
          <section className="settings-section">
            <h3>ゲーム設定</h3>
            
            <div className="settings-item">
              <label htmlFor="difficulty">難易度</label>
              <select
                id="difficulty"
                value={settings.difficulty}
                onChange={(e) => handleChange('difficulty', e.target.value as 'easy' | 'normal' | 'hard')}
              >
                <option value="easy">初級（簡単）</option>
                <option value="normal">中級（標準）</option>
                <option value="hard">上級（難しい）</option>
              </select>
              <small>CPUチームの戦術判断の精度に影響します</small>
            </div>

            <div className="settings-item">
              <label htmlFor="showTutorial">
                <input
                  type="checkbox"
                  id="showTutorial"
                  checked={settings.showTutorial}
                  onChange={(e) => handleChange('showTutorial', e.target.checked)}
                />
                <span>チュートリアルを表示する</span>
              </label>
            </div>

            <div className="settings-item">
              <label htmlFor="showAIRecommendation">
                <input
                  type="checkbox"
                  id="showAIRecommendation"
                  checked={settings.showAIRecommendation}
                  onChange={(e) => handleChange('showAIRecommendation', e.target.checked)}
                />
                <span>AI推奨を表示する</span>
              </label>
              <small>一定時間操作しない場合にAIの推奨指示を表示します</small>
            </div>

            {settings.showAIRecommendation && (
              <div className="settings-item settings-item-indented">
                <label htmlFor="aiRecommendationDelay">
                  AI推奨表示までの待機時間: {(settings.aiRecommendationDelay / 1000).toFixed(1)}秒
                </label>
                <input
                  type="range"
                  id="aiRecommendationDelay"
                  min="3000"
                  max="10000"
                  step="500"
                  value={settings.aiRecommendationDelay}
                  onChange={(e) => handleChange('aiRecommendationDelay', parseInt(e.target.value))}
                />
              </div>
            )}
          </section>

          {/* テキスト表示設定 */}
          <section className="settings-section">
            <h3>テキスト表示</h3>
            
            <div className="settings-item">
              <label htmlFor="textSpeed">
                テキスト速度: {settings.textSpeed === 0 ? '即座に表示' : `${settings.textSpeed}ms`}
              </label>
              <input
                type="range"
                id="textSpeed"
                min="0"
                max="100"
                step="10"
                value={settings.textSpeed}
                onChange={(e) => handleChange('textSpeed', parseInt(e.target.value))}
              />
              <small>0に設定すると即座に全文を表示します</small>
            </div>

            <div className="settings-item">
              <label htmlFor="autoProgress">
                <input
                  type="checkbox"
                  id="autoProgress"
                  checked={settings.autoProgress}
                  onChange={(e) => handleChange('autoProgress', e.target.checked)}
                />
                <span>自動進行を有効にする</span>
              </label>
              <small>テキスト表示後、自動的に次に進みます</small>
            </div>

            {settings.autoProgress && (
              <div className="settings-item settings-item-indented">
                <label htmlFor="autoProgressDelay">
                  自動進行の待機時間: {(settings.autoProgressDelay / 1000).toFixed(1)}秒
                </label>
                <input
                  type="range"
                  id="autoProgressDelay"
                  min="1000"
                  max="5000"
                  step="500"
                  value={settings.autoProgressDelay}
                  onChange={(e) => handleChange('autoProgressDelay', parseInt(e.target.value))}
                />
              </div>
            )}
          </section>

          {/* 投球表示設定 */}
          <section className="settings-section">
            <h3>投球表示</h3>

            <div className="settings-item">
              <label htmlFor="pitchDisplayMode">表示モード</label>
              <select
                id="pitchDisplayMode"
                value={settings.pitchDisplayMode}
                onChange={(e) => handleChange('pitchDisplayMode', e.target.value as 'detail' | 'summary')}
              >
                <option value="detail">詳細（1球ごとに表示）</option>
                <option value="summary">簡易（最終結果のみ表示）</option>
              </select>
            </div>

            <div className="settings-item">
              <label htmlFor="pitchDisplaySpeed">表示速度</label>
              <select
                id="pitchDisplaySpeed"
                value={settings.pitchDisplaySpeed}
                onChange={(e) => handleChange('pitchDisplaySpeed', e.target.value as 'instant' | 'normal' | 'slow')}
              >
                <option value="instant">即座表示</option>
                <option value="normal">通常表示（0.5秒）</option>
                <option value="slow">ゆっくり表示（1.5秒）</option>
              </select>
            </div>
          </section>

          {/* サウンド設定 */}
          <section className="settings-section">
            <h3>サウンド設定</h3>
            
            <div className="settings-item">
              <label htmlFor="soundEnabled">
                <input
                  type="checkbox"
                  id="soundEnabled"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                />
                <span>効果音を有効にする</span>
              </label>
            </div>

            <div className="settings-item">
              <label htmlFor="bgmEnabled">
                <input
                  type="checkbox"
                  id="bgmEnabled"
                  checked={settings.bgmEnabled}
                  onChange={(e) => handleChange('bgmEnabled', e.target.checked)}
                />
                <span>BGMを有効にする</span>
              </label>
            </div>

            <div className="settings-item">
              <label htmlFor="volume">
                音量: {settings.volume}%
              </label>
              <input
                type="range"
                id="volume"
                min="0"
                max="100"
                step="5"
                value={settings.volume}
                onChange={(e) => handleChange('volume', parseInt(e.target.value))}
              />
            </div>
          </section>
        </div>

        <div className="settings-modal-footer">
          <div className="settings-status">
            {saveStatus === 'saving' && <span className="status-saving">保存中...</span>}
            {saveStatus === 'saved' && <span className="status-saved">✓ 保存しました</span>}
            {saveStatus === 'error' && <span className="status-error">保存に失敗しました</span>}
            {hasUnsavedChanges && saveStatus === 'idle' && <span className="status-unsaved">未保存の変更があります</span>}
          </div>
          <div className="settings-actions">
            <button 
              className="settings-button settings-button-reset" 
              onClick={handleReset}
            >
              初期値に戻す
            </button>
            <button 
              className="settings-button settings-button-cancel" 
              onClick={handleClose}
            >
              キャンセル
            </button>
            <button 
              className="settings-button settings-button-save" 
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
