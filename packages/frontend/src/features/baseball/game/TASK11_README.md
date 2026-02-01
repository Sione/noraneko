# タスク11: エラーハンドリングとユーザビリティ

## 概要

Requirement 7「エラーハンドリングとユーザビリティ」の実装です。ユーザーがスムーズにゲームを楽しめるよう、エラー処理、自動保存、設定管理、ヘルプシステムを提供します。

## 主要機能

### 1. 入力エラー対応
- 無効な指示の検証とエラーメッセージ表示
- 理由の説明と代替案の提示
- Toast通知による視覚的フィードバック

### 2. システムエラーと自動保存
- ErrorBoundaryによる例外キャッチ
- エラーログの自動記録
- 30秒ごとの自動保存
- 緊急保存機能
- 試合再開ダイアログ

### 3. 中断/再開フロー
- 一時停止メニュー
- 保存して終了/保存せずに終了
- 試合状態の完全復元

### 4. 操作ガイドとヘルプ
- 包括的なヘルプモーダル
- 4つのセクション（基本操作/攻撃/守備/能力値）
- 各指示の詳細な説明

### 5. レスポンスと表示テンポ
- テキスト速度の調整（0-100ms）
- 自動進行機能
- 即時フィードバック

### 6. アクセシビリティとカスタマイズ
- 表示言語/テーマ/難易度設定
- 音量・効果音・BGMの制御
- ダークモード対応
- レスポンシブデザイン
- モーション軽減対応

## 使用方法

### エラーハンドリングの統合

```typescript
import { ErrorBoundary } from './game/ErrorBoundary';
import { useToast, Toast } from './game/Toast';
import { validateOffensiveInstruction } from './game/validation';

function App() {
  const { messages, removeToast, error, warning } = useToast();

  return (
    <ErrorBoundary>
      <YourGameComponent />
      <Toast messages={messages} onRemove={removeToast} />
    </ErrorBoundary>
  );
}
```

### 入力検証

```typescript
import { validateOffensiveInstruction } from './game/validation';

const validationError = validateOffensiveInstruction(
  instruction,
  runners,
  outs
);

if (validationError) {
  if (getErrorSeverity(validationError) === 'error') {
    // ブロックするエラー
    error(formatValidationError(validationError));
    return;
  } else {
    // 警告のみ
    warning(formatValidationError(validationError));
  }
}
```

### 自動保存

```typescript
import {
  startAutoSaveInterval,
  hasSavedGame,
  loadSavedGame,
} from './game/autoSave';

useEffect(() => {
  // 30秒ごとに自動保存
  const cleanup = startAutoSaveInterval(() => {
    autoSaveGame(gameState);
  });

  return cleanup;
}, [gameState]);
```

### 設定管理

```typescript
import { loadSettings, saveSettings } from './game/settings';
import { SettingsModal } from './game/SettingsModal';

function GameSettings() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>設定</button>
      <SettingsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

### ヘルプとPauseMenu

```typescript
import { HelpModal } from './game/HelpModal';
import { PauseMenu } from './game/PauseMenu';

function GameScreen() {
  const [showHelp, setShowHelp] = useState(false);
  const [showPause, setShowPause] = useState(false);

  return (
    <>
      <button onClick={() => setShowPause(true)}>一時停止</button>
      
      <PauseMenu
        isOpen={showPause}
        onClose={() => setShowPause(false)}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSave={handleExitWithoutSave}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHelp={() => setShowHelp(true)}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </>
  );
}
```

## コンポーネント一覧

### ErrorBoundary
- Reactエラーのキャッチと表示
- 緊急保存
- エラーログの記録
- 復旧オプション

### Toast
- 通知メッセージの表示
- 4種類のタイプ（success/error/warning/info）
- 自動消滅
- アニメーション効果

### SettingsModal
- ユーザー設定の編集
- リアルタイムプレビュー
- 未保存変更の警告
- 初期値に戻す機能

### HelpModal
- タブ切り替え式UI
- 包括的なゲームガイド
- 各指示の詳細説明

### PauseMenu
- 一時停止機能
- 保存/終了オプション
- 設定・ヘルプへのアクセス

### ResumeGameDialog
- 保存データの検出
- 試合再開/新規開始の選択
- 保存日時の表示

## localStorageキー

| キー | 説明 | 形式 |
|------|------|------|
| `baseball_user_settings` | ユーザー設定 | UserSettings JSON |
| `baseball_auto_save` | 自動保存データ | SavedGameState JSON |
| `baseball_emergency_save` | 緊急保存データ | SavedGameState JSON |
| `baseball_error_logs` | エラーログ（最大50件）| ErrorLog[] JSON |

## テーマシステム

### 利用可能なテーマ
- `light`: ライトモード
- `dark`: ダークモード
- `auto`: システム設定に従う

### テーマの適用

```typescript
import { applyTheme } from './game/settings';

// テーマを適用
applyTheme('dark');

// 設定から読み込んで適用
const settings = loadSettings();
applyTheme(settings.theme);
```

### CSSでのテーマ対応

```css
/* ライトモード（デフォルト）*/
.my-component {
  background: white;
  color: #333;
}

/* ダークモード */
[data-theme="dark"] .my-component {
  background: #2c2c2c;
  color: #e0e0e0;
}
```

## レスポンシブ対応

全コンポーネントが768px未満のモバイルデバイスに対応しています。

```css
@media (max-width: 768px) {
  /* モバイル向けスタイル */
}
```

## アクセシビリティ

### 対応内容
- ARIAラベル
- キーボード操作
- スクリーンリーダー対応
- モーション軽減対応

```css
@media (prefers-reduced-motion: reduce) {
  /* アニメーション無効化 */
  .animated-element {
    animation: none;
  }
}
```

## テスト

### 手動テスト項目
1. 入力エラー
   - 無効な指示でエラー表示
   - Toast通知の表示と消滅
   
2. 自動保存
   - 30秒ごとの保存確認
   - 再起動時の復旧ダイアログ
   
3. 設定
   - 各設定の保存と復元
   - テーマの切り替え
   
4. ヘルプ
   - 各タブの表示
   - スクロール動作

## トラブルシューティング

### 設定が保存されない
- ブラウザのlocalStorageが有効か確認
- プライベートブラウジングモードではない確認

### 自動保存が動作しない
- コンソールでエラーログを確認
- localStorage の容量制限に達していないか確認

### テーマが適用されない
- `applyTheme()` が呼び出されているか確認
- CSSファイルが正しく読み込まれているか確認

## 今後の拡張

1. **チュートリアルシステム**
   - ステップバイステップガイド
   - インタラクティブなツールチップ

2. **多言語対応の強化**
   - 現在は日本語のみ
   - 英語版の実装

3. **キーボードショートカット**
   - Escキーでモーダルを閉じる
   - 数字キーで指示選択

4. **パフォーマンス最適化**
   - React.memoの活用
   - 遅延読み込み

## 参考リンク

- [Requirement 7 詳細](../requirements.md#requirement-7)
- [タスク11実装レポート](./TASK11_IMPLEMENTATION_REPORT.md)
