/**
 * タスク11: エラーハンドリングとユーザビリティ
 * 統合エクスポート
 */

// 11.1 入力エラー対応
export {
  validateOffensiveInstruction,
  validateDefensiveInstruction,
  formatValidationError,
  getErrorSeverity,
} from './validation';
export type { ValidationError } from './validation';

export { Toast, useToast } from './Toast';
export type { ToastMessage } from './Toast';

// 11.2 システムエラーと自動保存
export { ErrorBoundary } from './ErrorBoundary';

export {
  autoSaveGame,
  loadSavedGame,
  hasSavedGame,
  clearSavedGame,
  getSavedGameTimestamp,
  isSavedGameStale,
  startAutoSaveInterval,
  saveOnInningEnd,
  saveOnGameEnd,
} from './autoSave';
export type { SavedGameState } from './autoSave';

export { ResumeGameDialog, useResumeGameDialog } from './ResumeGameDialog';

// 11.3 中断/再開フロー
export { PauseMenu } from './PauseMenu';

// 11.4 操作ガイドとヘルプ
export { HelpModal } from './HelpModal';

// 11.6 アクセシビリティとカスタマイズ
export {
  loadSettings,
  saveSettings,
  resetSettings,
  applyTheme,
  calculateTextDelay,
  DEFAULT_SETTINGS,
} from './settings';
export type { UserSettings } from './settings';

export { SettingsModal } from './SettingsModal';
