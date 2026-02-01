/**
 * 選手編集コンポーネント
 */

import React, { useState, useEffect } from 'react';
import { Player, Position, Hand } from '../types';
import {
  createNewPlayer,
  generateRandomPlayer,
  createPlayerFromTemplate,
  calculateOverallRating,
  getAbilityColorClass,
} from '../data/playerUtils';
import './PlayerEditor.css';

interface PlayerEditorProps {
  player: Player | null; // null の場合は新規作成
  onSave: (player: Player) => void;
  onCancel: () => void;
}

const PlayerEditor: React.FC<PlayerEditorProps> = ({ player, onSave, onCancel }) => {
  const [editingPlayer, setEditingPlayer] = useState<Player>(
    player || createNewPlayer('新しい選手', 'CF')
  );
  
  const isCreating = !player;
  const overall = calculateOverallRating(editingPlayer);
  
  useEffect(() => {
    if (player) {
      setEditingPlayer(player);
    }
  }, [player]);
  
  const handleChange = (field: string, value: any) => {
    setEditingPlayer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleBattingChange = (field: keyof Player['batting'], value: number) => {
    setEditingPlayer((prev) => ({
      ...prev,
      batting: {
        ...prev.batting,
        [field]: value,
      },
    }));
  };
  
  const handlePitchingChange = (
    field: keyof NonNullable<Player['pitching']>,
    value: number
  ) => {
    setEditingPlayer((prev) => ({
      ...prev,
      pitching: prev.pitching
        ? {
            ...prev.pitching,
            [field]: value,
          }
        : undefined,
    }));
  };
  
  const handleRunningChange = (field: keyof Player['running'], value: number) => {
    setEditingPlayer((prev) => ({
      ...prev,
      running: {
        ...prev.running,
        [field]: value,
      },
    }));
  };
  
  const handleFieldingChange = (field: keyof Player['fielding'], value: any) => {
    setEditingPlayer((prev) => ({
      ...prev,
      fielding: {
        ...prev.fielding,
        [field]: value,
      },
    }));
  };
  
  const handlePositionChange = (newPosition: Position) => {
    setEditingPlayer((prev) => {
      const updated = { ...prev, position: newPosition };
      
      // 投手の場合、投手能力を追加
      if (newPosition === 'P' && !updated.pitching) {
        updated.pitching = {
          stuff: 50,
          movement: 50,
          control: 50,
          stamina: 50,
          groundBallPct: 50,
          velocity: 50,
          holdRunners: 50,
        };
        updated.pitcherHand = updated.batterHand;
      }
      
      // 捕手の場合、捕手能力を追加
      if (newPosition === 'C') {
        if (!updated.fielding.catcherAbility) {
          updated.fielding.catcherAbility = 50;
        }
        if (!updated.fielding.catcherArm) {
          updated.fielding.catcherArm = 50;
        }
      }
      
      // ポジション適性を更新
      updated.fielding.positionRatings = {
        ...updated.fielding.positionRatings,
        [newPosition]: 'C',
      };
      
      return updated;
    });
  };
  
  const handleRandomGenerate = () => {
    if (!confirm('すべての能力値をランダムに生成しますか？現在の値は失われます。')) {
      return;
    }
    
    const randomPlayer = generateRandomPlayer(editingPlayer.position);
    setEditingPlayer({
      ...editingPlayer,
      batting: randomPlayer.batting,
      pitching: randomPlayer.pitching,
      running: randomPlayer.running,
      fielding: randomPlayer.fielding,
    });
  };
  
  const handleApplyTemplate = (templateType: string) => {
    if (
      !confirm(
        'テンプレートを適用しますか？現在のポジションと能力値は変更されます。'
      )
    ) {
      return;
    }
    
    const templatePlayer = createPlayerFromTemplate(editingPlayer.name, templateType);
    setEditingPlayer({
      ...editingPlayer,
      position: templatePlayer.position,
      batterHand: templatePlayer.batterHand,
      pitcherHand: templatePlayer.pitcherHand,
      batting: templatePlayer.batting,
      pitching: templatePlayer.pitching,
      running: templatePlayer.running,
      fielding: templatePlayer.fielding,
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!editingPlayer.name.trim()) {
      alert('選手名を入力してください');
      return;
    }
    
    onSave(editingPlayer);
  };
  
  const renderAbilityInput = (
    label: string,
    value: number,
    onChange: (value: number) => void
  ) => (
    <div className="ability-input-row">
      <label className="ability-input-label">{label}</label>
      <div className="ability-input-controls">
        <input
          type="range"
          min="1"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="ability-input-range"
        />
        <input
          type="number"
          min="1"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="ability-input-number"
        />
        <span className={`ability-value ${getAbilityColorClass(value)}`}>
          {value}
        </span>
      </div>
    </div>
  );
  
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  
  return (
    <div className="player-editor">
      <header className="player-editor-header">
        <h2>{isCreating ? '選手の新規作成' : `${editingPlayer.name}を編集`}</h2>
        <div className="player-editor-overall">
          <span>総合評価:</span>
          <span className={`overall-value ${getAbilityColorClass(overall)}`}>
            {overall}
          </span>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="player-editor-form">
        {/* 基本情報 */}
        <section className="editor-section">
          <h3>基本情報</h3>
          
          <div className="form-group">
            <label>選手名 *</label>
            <input
              type="text"
              value={editingPlayer.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>ポジション</label>
            <select
              value={editingPlayer.position}
              onChange={(e) => handlePositionChange(e.target.value as Position)}
            >
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>利き手（打）</label>
            <select
              value={editingPlayer.batterHand}
              onChange={(e) => handleChange('batterHand', e.target.value as Hand)}
            >
              <option value="right">右打ち</option>
              <option value="left">左打ち</option>
            </select>
          </div>
          
          {editingPlayer.position === 'P' && (
            <div className="form-group">
              <label>利き手（投）</label>
              <select
                value={editingPlayer.pitcherHand || 'right'}
                onChange={(e) => handleChange('pitcherHand', e.target.value as Hand)}
              >
                <option value="right">右投げ</option>
                <option value="left">左投げ</option>
              </select>
            </div>
          )}
          
          <div className="form-actions-inline">
            <button
              type="button"
              onClick={handleRandomGenerate}
              className="btn btn-secondary"
            >
              ランダム生成
            </button>
            <div className="template-selector">
              <label>テンプレート:</label>
              <button
                type="button"
                onClick={() => handleApplyTemplate('powerHitter')}
                className="btn btn-sm"
              >
                パワーヒッター
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('contactHitter')}
                className="btn btn-sm"
              >
                コンタクトヒッター
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('speedster')}
                className="btn btn-sm"
              >
                俊足
              </button>
              {editingPlayer.position === 'P' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('acePitcher')}
                    className="btn btn-sm"
                  >
                    エース投手
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('closerPitcher')}
                    className="btn btn-sm"
                  >
                    クローザー
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
        
        {/* 打撃能力 */}
        <section className="editor-section">
          <h3>打撃能力</h3>
          {renderAbilityInput('Contact（コンタクト）', editingPlayer.batting.contact, (v) =>
            handleBattingChange('contact', v)
          )}
          {renderAbilityInput('BABIP', editingPlayer.batting.babip, (v) =>
            handleBattingChange('babip', v)
          )}
          {renderAbilityInput(
            'Gap Power（ギャップ長打力）',
            editingPlayer.batting.gapPower,
            (v) => handleBattingChange('gapPower', v)
          )}
          {renderAbilityInput('HR Power（本塁打力）', editingPlayer.batting.hrPower, (v) =>
            handleBattingChange('hrPower', v)
          )}
          {renderAbilityInput(
            'Eye/Discipline（選球眼）',
            editingPlayer.batting.eye,
            (v) => handleBattingChange('eye', v)
          )}
          {renderAbilityInput(
            'Avoid K\'s（三振回避）',
            editingPlayer.batting.avoidKs,
            (v) => handleBattingChange('avoidKs', v)
          )}
          {renderAbilityInput('vs LHP（対左投手）', editingPlayer.batting.vsLHP, (v) =>
            handleBattingChange('vsLHP', v)
          )}
          {renderAbilityInput('vs RHP（対右投手）', editingPlayer.batting.vsRHP, (v) =>
            handleBattingChange('vsRHP', v)
          )}
        </section>
        
        {/* 投手能力 */}
        {editingPlayer.pitching && (
          <section className="editor-section">
            <h3>投手能力</h3>
            {renderAbilityInput('Stuff（球威）', editingPlayer.pitching.stuff, (v) =>
              handlePitchingChange('stuff', v)
            )}
            {renderAbilityInput(
              'Movement（変化球）',
              editingPlayer.pitching.movement,
              (v) => handlePitchingChange('movement', v)
            )}
            {renderAbilityInput(
              'Control（制球力）',
              editingPlayer.pitching.control,
              (v) => handlePitchingChange('control', v)
            )}
            {renderAbilityInput(
              'Stamina（スタミナ）',
              editingPlayer.pitching.stamina,
              (v) => handlePitchingChange('stamina', v)
            )}
            {renderAbilityInput(
              'Ground Ball %（ゴロ率）',
              editingPlayer.pitching.groundBallPct,
              (v) => handlePitchingChange('groundBallPct', v)
            )}
            {renderAbilityInput(
              'Velocity（球速）',
              editingPlayer.pitching.velocity,
              (v) => handlePitchingChange('velocity', v)
            )}
            {renderAbilityInput(
              'Hold Runners（牽制）',
              editingPlayer.pitching.holdRunners,
              (v) => handlePitchingChange('holdRunners', v)
            )}
          </section>
        )}
        
        {/* 走塁能力 */}
        <section className="editor-section">
          <h3>走塁能力</h3>
          {renderAbilityInput('Speed（走力）', editingPlayer.running.speed, (v) =>
            handleRunningChange('speed', v)
          )}
          {renderAbilityInput(
            'Stealing Ability（盗塁能力）',
            editingPlayer.running.stealingAbility,
            (v) => handleRunningChange('stealingAbility', v)
          )}
          {renderAbilityInput(
            'Stealing Aggr（盗塁積極性）',
            editingPlayer.running.stealingAggr,
            (v) => handleRunningChange('stealingAggr', v)
          )}
          {renderAbilityInput(
            'Baserunning（走塁技術）',
            editingPlayer.running.baserunning,
            (v) => handleRunningChange('baserunning', v)
          )}
        </section>
        
        {/* 守備能力 */}
        <section className="editor-section">
          <h3>守備能力</h3>
          {renderAbilityInput(
            'Infield Range（内野守備範囲）',
            editingPlayer.fielding.infieldRange,
            (v) => handleFieldingChange('infieldRange', v)
          )}
          {renderAbilityInput(
            'Outfield Range（外野守備範囲）',
            editingPlayer.fielding.outfieldRange,
            (v) => handleFieldingChange('outfieldRange', v)
          )}
          {renderAbilityInput(
            'Infield Error（内野エラー率）',
            editingPlayer.fielding.infieldError,
            (v) => handleFieldingChange('infieldError', v)
          )}
          {renderAbilityInput(
            'Outfield Error（外野エラー率）',
            editingPlayer.fielding.outfieldError,
            (v) => handleFieldingChange('outfieldError', v)
          )}
          {renderAbilityInput(
            'Infield Arm（内野肩力）',
            editingPlayer.fielding.infieldArm,
            (v) => handleFieldingChange('infieldArm', v)
          )}
          {renderAbilityInput(
            'Outfield Arm（外野肩力）',
            editingPlayer.fielding.outfieldArm,
            (v) => handleFieldingChange('outfieldArm', v)
          )}
          {renderAbilityInput(
            'Turn DP（併殺処理）',
            editingPlayer.fielding.turnDP,
            (v) => handleFieldingChange('turnDP', v)
          )}
          {editingPlayer.position === 'C' && (
            <>
              {renderAbilityInput(
                'Catcher Ability（捕手能力）',
                editingPlayer.fielding.catcherAbility || 50,
                (v) => handleFieldingChange('catcherAbility', v)
              )}
              {renderAbilityInput(
                'Catcher Arm（捕手肩力）',
                editingPlayer.fielding.catcherArm || 50,
                (v) => handleFieldingChange('catcherArm', v)
              )}
            </>
          )}
          {renderAbilityInput(
            'Sacrifice Bunt（犠打バント）',
            editingPlayer.fielding.sacrificeBunt,
            (v) => handleFieldingChange('sacrificeBunt', v)
          )}
          {renderAbilityInput(
            'Bunt for Hit（セーフティバント）',
            editingPlayer.fielding.buntForHit,
            (v) => handleFieldingChange('buntForHit', v)
          )}
        </section>
        
        {/* フォームアクション */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isCreating ? '作成' : '保存'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerEditor;
