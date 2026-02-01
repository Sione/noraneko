/**
 * 選手詳細表示コンポーネント
 */

import React from 'react';
import { Player } from '../types';
import {
  calculateOverallRating,
  getHitterType,
  getPitcherType,
  getAbilityColorClass,
} from '../data/playerUtils';
import './PlayerDetail.css';

interface PlayerDetailProps {
  player: Player;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const PlayerDetail: React.FC<PlayerDetailProps> = ({
  player,
  onEdit,
  onDelete,
  onClose,
}) => {
  const overall = calculateOverallRating(player);
  const playerType =
    player.position === 'P' ? getPitcherType(player) : getHitterType(player);
  
  const renderAbility = (label: string, value: number) => (
    <div className="ability-row">
      <span className="ability-label">{label}</span>
      <span className="ability-value-container">
        <span className={`ability-value ${getAbilityColorClass(value)}`}>
          {value}
        </span>
        <div className="ability-bar">
          <div
            className={`ability-bar-fill ${getAbilityColorClass(value)}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </span>
    </div>
  );
  
  return (
    <div className="player-detail">
      <header className="player-detail-header">
        <div className="player-detail-title">
          <h2>{player.name}</h2>
          <span className="player-detail-position">{player.position}</span>
        </div>
        <div className="player-detail-actions">
          <button onClick={onEdit} className="btn btn-primary">
            編集
          </button>
          <button onClick={onDelete} className="btn btn-danger">
            削除
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            閉じる
          </button>
        </div>
      </header>
      
      <div className="player-detail-content">
        {/* 基本情報 */}
        <section className="detail-section">
          <h3>基本情報</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">総合評価</span>
              <span className={`detail-value ${getAbilityColorClass(overall)}`}>
                {overall}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">タイプ</span>
              <span className="detail-value">{playerType}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">利き手（打）</span>
              <span className="detail-value">
                {player.batterHand === 'right' ? '右打ち' : '左打ち'}
              </span>
            </div>
            {player.pitcherHand && (
              <div className="detail-item">
                <span className="detail-label">利き手（投）</span>
                <span className="detail-value">
                  {player.pitcherHand === 'right' ? '右投げ' : '左投げ'}
                </span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">コンディション</span>
              <span className="detail-value">
                {player.condition === 'excellent'
                  ? '絶好調'
                  : player.condition === 'good'
                  ? '好調'
                  : player.condition === 'normal'
                  ? '普通'
                  : player.condition === 'poor'
                  ? '不調'
                  : player.condition === 'terrible'
                  ? '絶不調'
                  : '普通'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">疲労度</span>
              <span className="detail-value">
                {player.fatigue === 'fresh'
                  ? '新鮮'
                  : player.fatigue === 'normal'
                  ? '普通'
                  : player.fatigue === 'tired'
                  ? '疲労'
                  : '限界'}
              </span>
            </div>
          </div>
        </section>
        
        {/* 打撃能力 */}
        <section className="detail-section">
          <h3>打撃能力</h3>
          <div className="abilities-list">
            {renderAbility('Contact（コンタクト）', player.batting.contact)}
            {renderAbility('BABIP', player.batting.babip)}
            {renderAbility('Gap Power（ギャップ長打力）', player.batting.gapPower)}
            {renderAbility('HR Power（本塁打力）', player.batting.hrPower)}
            {renderAbility('Eye/Discipline（選球眼）', player.batting.eye)}
            {renderAbility('Avoid K\'s（三振回避）', player.batting.avoidKs)}
            {renderAbility('vs LHP（対左投手）', player.batting.vsLHP)}
            {renderAbility('vs RHP（対右投手）', player.batting.vsRHP)}
          </div>
        </section>
        
        {/* 投手能力 */}
        {player.pitching && (
          <section className="detail-section">
            <h3>投手能力</h3>
            <div className="abilities-list">
              {renderAbility('Stuff（球威）', player.pitching.stuff)}
              {renderAbility('Movement（変化球）', player.pitching.movement)}
              {renderAbility('Control（制球力）', player.pitching.control)}
              {renderAbility('Stamina（スタミナ）', player.pitching.stamina)}
              {renderAbility('Ground Ball %（ゴロ率）', player.pitching.groundBallPct)}
              {renderAbility('Velocity（球速）', player.pitching.velocity)}
              {renderAbility('Hold Runners（牽制）', player.pitching.holdRunners)}
            </div>
          </section>
        )}
        
        {/* 走塁能力 */}
        <section className="detail-section">
          <h3>走塁能力</h3>
          <div className="abilities-list">
            {renderAbility('Speed（走力）', player.running.speed)}
            {renderAbility('Stealing Ability（盗塁能力）', player.running.stealingAbility)}
            {renderAbility(
              'Stealing Aggr（盗塁積極性）',
              player.running.stealingAggr
            )}
            {renderAbility('Baserunning（走塁技術）', player.running.baserunning)}
          </div>
        </section>
        
        {/* 守備能力 */}
        <section className="detail-section">
          <h3>守備能力</h3>
          <div className="abilities-list">
            {renderAbility('Infield Range（内野守備範囲）', player.fielding.infieldRange)}
            {renderAbility(
              'Outfield Range（外野守備範囲）',
              player.fielding.outfieldRange
            )}
            {renderAbility(
              'Infield Error（内野エラー率）',
              player.fielding.infieldError
            )}
            {renderAbility(
              'Outfield Error（外野エラー率）',
              player.fielding.outfieldError
            )}
            {renderAbility('Infield Arm（内野肩力）', player.fielding.infieldArm)}
            {renderAbility('Outfield Arm（外野肩力）', player.fielding.outfieldArm)}
            {renderAbility('Turn DP（併殺処理）', player.fielding.turnDP)}
            {player.fielding.catcherAbility !== undefined &&
              renderAbility('Catcher Ability（捕手能力）', player.fielding.catcherAbility)}
            {player.fielding.catcherArm !== undefined &&
              renderAbility('Catcher Arm（捕手肩力）', player.fielding.catcherArm)}
            {renderAbility('Sacrifice Bunt（犠打バント）', player.fielding.sacrificeBunt)}
            {renderAbility('Bunt for Hit（セーフティバント）', player.fielding.buntForHit)}
          </div>
        </section>
        
        {/* ポジション適性 */}
        <section className="detail-section">
          <h3>ポジション適性</h3>
          <div className="position-ratings">
            {Object.entries(player.fielding.positionRatings).map(([pos, rating]) => (
              <div key={pos} className="position-rating-item">
                <span className="position-rating-pos">{pos}</span>
                <span className={`position-rating-value rating-${rating}`}>
                  {rating}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlayerDetail;
