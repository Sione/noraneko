import { Routes, Route } from 'react-router-dom';
import { AppRouter } from './router';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Noraneko TODO</h1>
        <p>シンプルなタスク管理アプリケーション</p>
      </header>
      <main>
        <AppRouter />
      </main>
    </div>
  );
}

export default App;
