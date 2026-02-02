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
  const [originalPlayer] = useState<Player | null>(player); // 元の値を保持
  
  const isCreating = !player;
  const overall = calculateOverallRating(editingPlayer);
  const originalOverall = originalPlayer ? calculateOverallRating(originalPlayer) : 0;
  
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
    
    // AC 9.28-29: 変更確認ダイアログ（編集時のみ）
    if (!isCreating && originalPlayer) {
      const changes: string[] = [];
      
      // 基本情報の変更
      if (editingPlayer.name !== originalPlayer.name) {
        changes.push(`名前: ${originalPlayer.name} → ${editingPlayer.name}`);
      }
      if (editingPlayer.position !== originalPlayer.position) {
        changes.push(`ポジション: ${originalPlayer.position} → ${editingPlayer.position}`);
      }
      
      // 総合評価の変更
      const ovrDiff = overall - originalOverall;
      if (ovrDiff !== 0) {
        changes.push(`総合評価: ${originalOverall} → ${overall} (${ovrDiff > 0 ? '+' : ''}${ovrDiff})`);
      }
      
      if (changes.length > 0) {
        const confirmMessage = 
          `以下の変更を保存しますか？\n\n${changes.join('\n')}\n\n主要な能力値変更は詳細画面で確認できます。`;
        
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }
    
    onSave(editingPlayer);
  };
  
  // AC 9.27: 変更差分を計算するヘルパー
  const getAbilityDiff = (currentValue: number, fieldPath: string): number => {
    if (!originalPlayer || isCreating) return 0;
    
    // fieldPathから元の値を取得
    const pathParts = fieldPath.split('.');
    let originalValue: any = originalPlayer;
    
    for (const part of pathParts) {
      originalValue = originalValue?.[part];
    }
    
    if (typeof originalValue === 'number') {
      return currentValue - originalValue;
    }
    
    return 0;
  };
  
  const renderAbilityInput = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    fieldPath: string = '' // 変更差分表示用
  ) => {
    const diff = getAbilityDiff(value, fieldPath);
    
    return (
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
            {!isCreating && diff !== 0 && (
              <span className={`ability-diff ${diff > 0 ? 'diff-positive' : 'diff-negative'}`}>
                {diff > 0 ? '+' : ''}{diff}
              </span>
            )}
          </span>
        </div>
      </div>
    );
  };
  
  const positions: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  
  return (
    <div className="player-editor">
      <header className="player-editor-header">
        <h2>{isCreating ? '選手の新規作成' : `${editingPlayer.name}を編集`}</h2>
        <div className="player-editor-overall">
          <span>総合評価:</span>
          <span className={`overall-value overall-large ${getAbilityColorClass(overall)}`}>
            {overall}
          </span>
          <span className="overall-type">
            {editingPlayer.position === 'P' 
              ? '投手' 
              : editingPlayer.batting.contact >= 70 && editingPlayer.batting.hrPower < 60
              ? 'コンタクト型'
              : editingPlayer.batting.hrPower >= 70 && editingPlayer.batting.contact < 60
              ? 'パワー型'
              : editingPlayer.running.speed >= 80
              ? '俊足型'
              : 'バランス型'}
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
            handleBattingChange('contact', v), 'batting.contact'
          )}
          {renderAbilityInput('BABIP', editingPlayer.batting.babip, (v) =>
            handleBattingChange('babip', v), 'batting.babip'
          )}
          {renderAbilityInput(
            'Gap Power（ギャップ長打力）',
            editingPlayer.batting.gapPower,
            (v) => handleBattingChange('gapPower', v), 'batting.gapPower'
          )}
          {renderAbilityInput('HR Power（本塁打力）', editingPlayer.batting.hrPower, (v) =>
            handleBattingChange('hrPower', v), 'batting.hrPower'
          )}
          {renderAbilityInput(
            'Eye/Discipline（選球眼）',
            editingPlayer.batting.eye,
            (v) => handleBattingChange('eye', v), 'batting.eye'
          )}
          {renderAbilityInput(
            'Avoid K\'s（三振回避）',
            editingPlayer.batting.avoidKs,
            (v) => handleBattingChange('avoidKs', v), 'batting.avoidKs'
          )}
          {renderAbilityInput('vs LHP（対左投手）', editingPlayer.batting.vsLHP, (v) =>
            handleBattingChange('vsLHP', v), 'batting.vsLHP'
          )}
          {renderAbilityInput('vs RHP（対右投手）', editingPlayer.batting.vsRHP, (v) =>
            handleBattingChange('vsRHP', v), 'batting.vsRHP'
          )}
        </section>
        
        {/* 投手能力 */}
        {editingPlayer.pitching && (
          <section className="editor-section">
            <h3>投手能力</h3>
            {renderAbilityInput('Stuff（球威）', editingPlayer.pitching.stuff, (v) =>
              handlePitchingChange('stuff', v), 'pitching.stuff'
            )}
            {renderAbilityInput(
              'Movement（変化球）',
              editingPlayer.pitching.movement,
              (v) => handlePitchingChange('movement', v), 'pitching.movement'
            )}
            {renderAbilityInput(
              'Control（制球力）',
              editingPlayer.pitching.control,
              (v) => handlePitchingChange('control', v), 'pitching.control'
            )}
            {renderAbilityInput(
              'Stamina（スタミナ）',
              editingPlayer.pitching.stamina,
              (v) => handlePitchingChange('stamina', v), 'pitching.stamina'
            )}
            {renderAbilityInput(
              'Ground Ball %（ゴロ率）',
              editingPlayer.pitching.groundBallPct,
              (v) => handlePitchingChange('groundBallPct', v), 'pitching.groundBallPct'
            )}
            {renderAbilityInput(
              'Velocity（球速）',
              editingPlayer.pitching.velocity,
              (v) => handlePitchingChange('velocity', v), 'pitching.velocity'
            )}
            {renderAbilityInput(
              'Hold Runners（牽制）',
              editingPlayer.pitching.holdRunners,
              (v) => handlePitchingChange('holdRunners', v), 'pitching.holdRunners'
            )}
          </section>
        )}
        
        {/* 走塁能力 */}
        <section className="editor-section">
          <h3>走塁能力</h3>
          {renderAbilityInput('Speed（走力）', editingPlayer.running.speed, (v) =>
            handleRunningChange('speed', v), 'running.speed'
          )}
          {renderAbilityInput(
            'Stealing Ability（盗塁能力）',
            editingPlayer.running.stealingAbility,
            (v) => handleRunningChange('stealingAbility', v), 'running.stealingAbility'
          )}
          {renderAbilityInput(
            'Stealing Aggr（盗塁積極性）',
            editingPlayer.running.stealingAggr,
            (v) => handleRunningChange('stealingAggr', v), 'running.stealingAggr'
          )}
          {renderAbilityInput(
            'Baserunning（走塁技術）',
            editingPlayer.running.baserunning,
            (v) => handleRunningChange('baserunning', v), 'running.baserunning'
          )}
        </section>
        
        {/* 守備能力 */}
        <section className="editor-section">
          <h3>守備能力</h3>
          {renderAbilityInput(
            'Infield Range（内野守備範囲）',
            editingPlayer.fielding.infieldRange,
            (v) => handleFieldingChange('infieldRange', v), 'fielding.infieldRange'
          )}
          {renderAbilityInput(
            'Outfield Range（外野守備範囲）',
            editingPlayer.fielding.outfieldRange,
            (v) => handleFieldingChange('outfieldRange', v), 'fielding.outfieldRange'
          )}
          {renderAbilityInput(
            'Infield Error（内野エラー率）',
            editingPlayer.fielding.infieldError,
            (v) => handleFieldingChange('infieldError', v), 'fielding.infieldError'
          )}
          {renderAbilityInput(
            'Outfield Error（外野エラー率）',
            editingPlayer.fielding.outfieldError,
            (v) => handleFieldingChange('outfieldError', v), 'fielding.outfieldError'
          )}
          {renderAbilityInput(
            'Infield Arm（内野肩力）',
            editingPlayer.fielding.infieldArm,
            (v) => handleFieldingChange('infieldArm', v), 'fielding.infieldArm'
          )}
          {renderAbilityInput(
            'Outfield Arm（外野肩力）',
            editingPlayer.fielding.outfieldArm,
            (v) => handleFieldingChange('outfieldArm', v), 'fielding.outfieldArm'
          )}
          {renderAbilityInput(
            'Turn DP（併殺処理）',
            editingPlayer.fielding.turnDP,
            (v) => handleFieldingChange('turnDP', v), 'fielding.turnDP'
          )}
          {editingPlayer.position === 'C' && (
            <>
              {renderAbilityInput(
                'Catcher Ability（捕手能力）',
                editingPlayer.fielding.catcherAbility || 50,
                (v) => handleFieldingChange('catcherAbility', v), 'fielding.catcherAbility'
              )}
              {renderAbilityInput(
                'Catcher Arm（捕手肩力）',
                editingPlayer.fielding.catcherArm || 50,
                (v) => handleFieldingChange('catcherArm', v), 'fielding.catcherArm'
              )}
            </>
          )}
          {renderAbilityInput(
            'Sacrifice Bunt（犠打バント）',
            editingPlayer.fielding.sacrificeBunt,
            (v) => handleFieldingChange('sacrificeBunt', v), 'fielding.sacrificeBunt'
          )}
          {renderAbilityInput(
            'Bunt for Hit（セーフティバント）',
            editingPlayer.fielding.buntForHit,
            (v) => handleFieldingChange('buntForHit', v), 'fielding.buntForHit'
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
