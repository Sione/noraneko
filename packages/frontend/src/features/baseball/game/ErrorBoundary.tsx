import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - エラー境界コンポーネント
 * タスク11.2: システムエラーと自動保存
 * 
 * Requirement 7 AC 6-10:
 * - システムエラー発生時の緊急保存
 * - エラーログの記録
 * - 復旧確認ダイアログ
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラーが発生したことを記録
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー情報を状態に保存
    this.setState({
      error,
      errorInfo,
    });

    // エラーログをlocalStorageに記録（AC 7）
    this.logError(error, errorInfo);

    // 試合状態を緊急保存（AC 6）
    this.emergencySave();

    // 親コンポーネントに通知
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('エラーが発生しました:', error, errorInfo);
  }

  /**
   * エラーログをlocalStorageに記録
   */
  private logError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };

      // 既存のエラーログを取得
      const existingLogs = localStorage.getItem('baseball_error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      // 新しいエラーログを追加（最大50件まで保持）
      logs.unshift(errorLog);
      if (logs.length > 50) {
        logs.pop();
      }

      localStorage.setItem('baseball_error_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('エラーログの保存に失敗しました:', e);
    }
  }

  /**
   * 試合状態を緊急保存
   */
  private emergencySave() {
    try {
      // Reduxストアの状態を取得して保存
      const storeState = localStorage.getItem('persist:root');
      if (storeState) {
        const emergencySave = {
          timestamp: new Date().toISOString(),
          state: storeState,
        };
        localStorage.setItem('baseball_emergency_save', JSON.stringify(emergencySave));
        console.log('緊急保存が完了しました');
      }
    } catch (e) {
      console.error('緊急保存に失敗しました:', e);
    }
  }

  /**
   * エラー状態をリセット
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * 緊急保存から復元
   */
  private handleRestore = () => {
    try {
      const emergencySave = localStorage.getItem('baseball_emergency_save');
      if (emergencySave) {
        const { state } = JSON.parse(emergencySave);
        localStorage.setItem('persist:root', state);
        window.location.reload();
      }
    } catch (e) {
      console.error('復元に失敗しました:', e);
      alert('復元に失敗しました。ページを再読み込みしてください。');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-boundary-icon">⚠️</div>
            <h1>エラーが発生しました</h1>
            <p className="error-message">
              予期しないエラーが発生しました。試合状態は自動的に保存されています。
            </p>
            
            {this.state.error && (
              <details className="error-details">
                <summary>エラー詳細</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="error-button error-button-primary"
              >
                続行を試みる
              </button>
              <button 
                onClick={this.handleRestore}
                className="error-button error-button-secondary"
              >
                前回の試合を復元
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="error-button error-button-tertiary"
              >
                メインメニューに戻る
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
