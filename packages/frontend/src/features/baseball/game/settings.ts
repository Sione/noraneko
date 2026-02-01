/**
 * ユーザー設定の型定義
 * タスク11.6: アクセシビリティとカスタマイズ
 */
export interface UserSettings {
  /** 表示言語 */
  language: 'ja' | 'en';
  
  /** テーマ */
  theme: 'light' | 'dark' | 'auto';
  
  /** 難易度 */
  difficulty: 'easy' | 'normal' | 'hard';
  
  /** テキスト表示速度（ミリ秒） */
  textSpeed: number;
  
  /** 自動進行を有効にするか */
  autoProgress: boolean;
  
  /** 自動進行の待機時間（ミリ秒） */
  autoProgressDelay: number;
  
  /** サウンド効果を有効にするか */
  soundEnabled: boolean;
  
  /** BGMを有効にするか */
  bgmEnabled: boolean;
  
  /** 音量（0-100） */
  volume: number;
  
  /** アニメーション効果を有効にするか */
  animationEnabled: boolean;
  
  /** チュートリアルを表示するか */
  showTutorial: boolean;
  
  /** AI推奨表示を有効にするか */
  showAIRecommendation: boolean;
  
  /** AI推奨表示までの待機時間（ミリ秒） */
  aiRecommendationDelay: number;
}

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: UserSettings = {
  language: 'ja',
  theme: 'auto',
  difficulty: 'normal',
  textSpeed: 50,
  autoProgress: false,
  autoProgressDelay: 2000,
  soundEnabled: true,
  bgmEnabled: true,
  volume: 70,
  animationEnabled: true,
  showTutorial: true,
  showAIRecommendation: true,
  aiRecommendationDelay: 5000,
};

/**
 * 設定のローカルストレージキー
 */
const SETTINGS_STORAGE_KEY = 'baseball_user_settings';

/**
 * 設定をlocalStorageから読み込む
 */
export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // デフォルト値とマージして、新しい設定項目が追加された場合に対応
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * 設定をlocalStorageに保存する
 */
export function saveSettings(settings: UserSettings): boolean {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    return false;
  }
}

/**
 * 設定をデフォルトに戻す
 */
export function resetSettings(): UserSettings {
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * テーマを適用する
 */
export function applyTheme(theme: 'light' | 'dark' | 'auto') {
  const root = document.documentElement;
  
  if (theme === 'auto') {
    // システムのカラースキーム設定を使用
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

/**
 * テキスト速度を計算（文字間の遅延時間）
 */
export function calculateTextDelay(textSpeed: number): number {
  // textSpeedは0-100の範囲
  // 0: 即座に表示（遅延なし）
  // 50: 標準速度（50ms）
  // 100: 最も遅い（100ms）
  return textSpeed;
}

/**
 * ユーザー設定の難易度をCPU AI難易度にマップ
 * タスク14: CPU戦術AIの実装
 */
export type CPUDifficulty = 'beginner' | 'intermediate' | 'expert';

export function mapDifficultyToCPU(difficulty: 'easy' | 'normal' | 'hard'): CPUDifficulty {
  const map: Record<'easy' | 'normal' | 'hard', CPUDifficulty> = {
    easy: 'beginner',
    normal: 'intermediate',
    hard: 'expert',
  };
  return map[difficulty];
}
