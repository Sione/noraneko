import { Link } from 'react-router-dom';
import { AppRouter } from './router';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Noraneko TODO</h1>
        <p>シンプルなタスク管理アプリケーション</p>
        <nav style={{ marginTop: '16px' }}>
          <Link to="/" style={{ marginRight: '16px', color: 'white', textDecoration: 'underline' }}>
            TODO
          </Link>
          <Link to="/baseball" style={{ color: 'white', textDecoration: 'underline' }}>
            野球ゲーム
          </Link>
        </nav>
      </header>
      <main>
        <AppRouter />
      </main>
    </div>
  );
}

export default App;
