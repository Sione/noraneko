import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { startTeamSetup, resetGame } from '../game/gameSlice';
import { TeamSetup } from './TeamSetup';
import { LineupEdit } from './LineupEdit';
import { GameScreen } from './GameScreen';
import { GameEnd } from './GameEnd';
import './GameBoard.css';

/**
 * GameBoard - メインメニュー
 */
export function MainMenu() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleNewGame = () => {
    dispatch(resetGame());
    dispatch(startTeamSetup());
  };

  const handleHistory = () => {
    navigate('/baseball/history');
  };

  const handlePlayerManagement = () => {
    navigate('/baseball/players');
  };

  const handleTeamManagement = () => {
    navigate('/baseball/teams');
  };

  return (
    <div className="main-menu">
      <div className="main-menu-container">
        <h1 className="game-title">野球監督シミュレーション</h1>
        <div className="menu-options">
          <button className="menu-button" onClick={handleNewGame}>
            新規試合
          </button>
          <button className="menu-button" onClick={handleHistory}>
            試合履歴
          </button>
          <button className="menu-button" onClick={handlePlayerManagement}>
            選手管理
          </button>
          <button className="menu-button" onClick={handleTeamManagement}>
            チーム管理
          </button>
          <button className="menu-button" disabled>
            設定
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * GameBoard - ゲームのメインコンポーネント
 */
export function GameBoard() {
  const phase = useAppSelector((state) => state.game.phase);

  // フェーズに応じて表示を切り替え
  switch (phase) {
    case 'idle':
      return <MainMenu />;
    case 'team_setup':
      return <TeamSetup />;
    case 'lineup_edit':
      return <LineupEdit />;
    case 'inning_start':
    case 'at_bat':
    case 'awaiting_instruction':
    case 'play_execution':
    case 'result_display':
    case 'half_inning_end':
    case 'inning_end':
      return <GameScreen />;
    case 'game_end':
      return <GameEnd />;
    case 'paused':
      return <div>一時停止画面（実装予定）</div>;
    default:
      return <MainMenu />;
  }
}
