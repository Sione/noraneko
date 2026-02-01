import { useEffect, useState } from 'react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

/**
 * Toast - 通知メッセージコンポーネント
 * タスク11.1: 入力エラー対応
 * 
 * Requirement 7 AC 4:
 * - 視覚的フィードバック（警告色、アイコン）
 */
export function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="toast-container">
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  message,
  onRemove,
}: {
  message: ToastMessage;
  onRemove: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = message.duration || 5000;
    
    // 自動削除タイマー
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    const removeTimer = setTimeout(() => {
      onRemove(message.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [message, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(message.id);
    }, 300);
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`toast-item toast-${message.type} ${isExiting ? 'toast-exit' : ''}`}
      role="alert"
    >
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message.message}</span>
      <button className="toast-close" onClick={handleClose} aria-label="閉じる">
        ×
      </button>
    </div>
  );
}

/**
 * Toastメッセージを管理するカスタムフック
 */
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (
    type: ToastMessage['type'],
    message: string,
    duration?: number
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  return {
    messages,
    addToast,
    removeToast,
    success: (message: string, duration?: number) =>
      addToast('success', message, duration),
    error: (message: string, duration?: number) =>
      addToast('error', message, duration),
    warning: (message: string, duration?: number) =>
      addToast('warning', message, duration),
    info: (message: string, duration?: number) =>
      addToast('info', message, duration),
  };
}
