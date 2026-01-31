import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchTodosRequest,
  createTodoRequest,
  deleteTodoRequest,
  toggleTodoRequest,
  clearError,
} from '../todosSlice';

export const TodoList = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.todos);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    dispatch(fetchTodosRequest());
  }, [dispatch]);

  const handleCreateTodo = () => {
    if (!newTitle.trim()) return;
    dispatch(
      createTodoRequest({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      })
    );
    setNewTitle('');
    setNewDescription('');
  };

  const handleDeleteTodo = (id: number, title: string) => {
    confirmDialog({
      message: `「${title}」を削除しますか？`,
      header: '削除の確認',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '削除',
      rejectLabel: 'キャンセル',
      acceptClassName: 'p-button-danger',
      accept: () => dispatch(deleteTodoRequest(id)),
    });
  };

  const handleToggleTodo = (id: number) => {
    dispatch(toggleTodoRequest(id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateTodo();
    }
  };

  return (
    <div className="todo-list">
      <ConfirmDialog />

      {error && (
        <Message
          severity="error"
          text={error}
          className="mb-3 w-full"
          style={{ marginBottom: '1rem' }}
        />
      )}

      <Card className="mb-4" style={{ marginBottom: '1.5rem' }}>
        <div className="flex flex-column gap-3">
          <div className="flex flex-column gap-2">
            <label htmlFor="title" className="font-semibold">
              タイトル
            </label>
            <InputText
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="新しいタスクを入力..."
              className="w-full"
            />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="description" className="font-semibold">
              説明（任意）
            </label>
            <InputTextarea
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="タスクの詳細..."
              rows={2}
              className="w-full"
            />
          </div>
          <Button
            label="追加"
            icon="pi pi-plus"
            onClick={handleCreateTodo}
            disabled={!newTitle.trim() || loading}
            className="w-full"
          />
        </div>
      </Card>

      {loading && items.length === 0 ? (
        <div className="flex justify-content-center p-4">
          <ProgressSpinner />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <div className="text-center p-4">
            <i
              className="pi pi-inbox text-4xl mb-3"
              style={{ color: '#999', display: 'block' }}
            />
            <p style={{ color: '#666' }}>タスクがありません。新しいタスクを追加しましょう！</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-column gap-2">
          {items.map((todo) => (
            <Card
              key={todo.id}
              className={`todo-item ${todo.completed ? 'completed' : ''}`}
              style={{
                opacity: todo.completed ? 0.7 : 1,
                backgroundColor: todo.completed ? '#f8f9fa' : 'white',
              }}
            >
              <div className="flex align-items-start gap-3">
                <Checkbox
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  className="mt-1"
                />
                <div className="flex-grow-1">
                  <h3
                    style={{
                      margin: 0,
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? '#999' : '#333',
                    }}
                  >
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p
                      style={{
                        margin: '0.5rem 0 0',
                        color: '#666',
                        fontSize: '0.9rem',
                      }}
                    >
                      {todo.description}
                    </p>
                  )}
                  <small style={{ color: '#999' }}>
                    {new Date(todo.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  onClick={() => handleDeleteTodo(todo.id, todo.title)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
