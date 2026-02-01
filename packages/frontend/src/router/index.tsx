import { Routes, Route } from 'react-router-dom';
import { TodoList } from '../features/todos';
import { GameBoard } from '../features/baseball/game/GameBoard';
import { GameHistory } from '../features/baseball/history/GameHistory';
import { GameDetail } from '../features/baseball/history/GameDetail';
import PlayerManagement from '../features/baseball/management/PlayerManagement';
import TeamManagement from '../features/baseball/management/TeamManagement';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<TodoList />} />
      <Route path="/baseball" element={<GameBoard />} />
      <Route path="/baseball/history" element={<GameHistory />} />
      <Route path="/baseball/history/:gameId" element={<GameDetail />} />
      <Route path="/baseball/players" element={<PlayerManagement />} />
      <Route path="/baseball/teams" element={<TeamManagement />} />
    </Routes>
  );
};
