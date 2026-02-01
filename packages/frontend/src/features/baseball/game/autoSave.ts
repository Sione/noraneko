/**
 * 自動保存ユーティリティ
 * タスク11.2, 11.3: システムエラーと自動保存、中断/再開フロー
 * 
 * Requirement 7 AC 9, 14-15:
 * - 自動保存機能
 * - 試合状態の復元
 */

const AUTO_SAVE_KEY = 'baseball_auto_save';
const AUTO_SAVE_INTERVAL = 30000; // 30秒ごとに自動保存

export interface SavedGameState {
  timestamp: string;
  gameState: any;
  version: string;
}

/**
 * 試合状態を自動保存する
 */
export function autoSaveGame(gameState: any): boolean {
  try {
    const saveData: SavedGameState = {
      timestamp: new Date().toISOString(),
      gameState,
      version: '1.0.0',
    };

    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData));
    console.log('自動保存が完了しました:', saveData.timestamp);
    return true;
  } catch (error) {
    console.error('自動保存に失敗しました:', error);
    return false;
  }
}

/**
 * 保存された試合状態を読み込む
 */
export function loadSavedGame(): SavedGameState | null {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('保存データの読み込みに失敗しました:', error);
  }
  return null;
}

/**
 * 保存された試合があるかチェック
 */
export function hasSavedGame(): boolean {
  return loadSavedGame() !== null;
}

/**
 * 保存された試合を削除する
 */
export function clearSavedGame(): void {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY);
    console.log('保存データを削除しました');
  } catch (error) {
    console.error('保存データの削除に失敗しました:', error);
  }
}

/**
 * 保存データの日時を取得
 */
export function getSavedGameTimestamp(): Date | null {
  const saved = loadSavedGame();
  if (saved) {
    return new Date(saved.timestamp);
  }
  return null;
}

/**
 * 保存データが古いかチェック（24時間以上経過）
 */
export function isSavedGameStale(): boolean {
  const timestamp = getSavedGameTimestamp();
  if (!timestamp) return false;

  const now = new Date();
  const hoursSinceLastSave = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastSave > 24;
}

/**
 * 自動保存インターバルを開始
 */
export function startAutoSaveInterval(saveFunction: () => void): () => void {
  const intervalId = setInterval(saveFunction, AUTO_SAVE_INTERVAL);
  
  // クリーンアップ関数を返す
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * イニング終了時に保存する
 */
export function saveOnInningEnd(gameState: any): void {
  // イニング終了は重要なタイミングなので必ず保存
  autoSaveGame(gameState);
}

/**
 * 試合終了時に保存する
 */
export function saveOnGameEnd(gameState: any): void {
  // 試合終了時は自動保存データをクリア（履歴として別に保存されるため）
  clearSavedGame();
}
