import { Routes, Route } from 'react-router-dom';
import { TodoList } from '../features/todos';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<TodoList />} />
    </Routes>
  );
};
