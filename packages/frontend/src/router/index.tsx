import { Routes, Route } from 'react-router-dom';
import { TodoList } from '../features/todos';
import { GameBoard } from '../features/baseball/game/GameBoard';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<TodoList />} />
      <Route path="/baseball" element={<GameBoard />} />
    </Routes>
  );
};
