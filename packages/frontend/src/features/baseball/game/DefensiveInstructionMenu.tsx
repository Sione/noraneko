import React, { useMemo, useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { InstructionOption, DefensiveInstruction, DefensiveShift } from '../types';
import { getShiftRecommendation, ShiftRecommendation } from './defensiveShiftEngine';
import './DefensiveInstructionMenu.css';

/**
 * DefensiveInstructionMenu - 守備指示メニュー
 * Requirement 2.2: 守備指示メニューと投手/シフト操作
 */

interface DefensiveInstructionMenuProps {
  onSelectInstruction: (instruction: DefensiveInstruction) => void;
  onSelectShift?: (shift: DefensiveShift) => void;
  onSelectPitcher?: (pitcherId: string) => void;
}

export function DefensiveInstructionMenu({ 
  onSelectInstruction,
  onSelectShift,
  onSelectPitcher 
}: DefensiveInstructionMenuProps) {
  const gameState = useAppSelector((state) => state.game);
  const { runners, currentPitcher, homeTeam, awayTeam, isTopHalf, currentAtBat, score } = gameState;

  // 守備側チームを取得
  const defendingTeam = useMemo(() => {
    return isTopHalf ? homeTeam : awayTeam;
  }, [isTopHalf, homeTeam, awayTeam]);

  // 攻撃側チームを取得
  const attackingTeam = useMemo(() => {
    return isTopHalf ? awayTeam : homeTeam;
  }, [isTopHalf, awayTeam, homeTeam]);

  // 打者情報を取得
  const batter = useMemo(() => {
    if (!attackingTeam || !currentAtBat) return null;
    return attackingTeam.lineup[currentAtBat.batterIndex];
  }, [attackingTeam, currentAtBat]);

  // 走者の状況をチェック
  const hasRunnerOnFirst = runners.first !== null;
  const isFirstBaseOpen = runners.first === null;

  // 投手の疲労度を判定
  const pitcherFatigue = useMemo(() => {
    if (!currentPitcher) return 'fresh';
    const pitchCount = currentPitcher.pitchCount;
    if (pitchCount >= 101) return 'exhausted';
    if (pitchCount >= 76) return 'tired';
    if (pitchCount >= 51) return 'normal';
    return 'fresh';
  }, [currentPitcher]);

  // 点差を計算
  const scoreDiff = Math.abs(score.home - score.away);

  // ブルペン投手リストを取得
  const bullpenPitchers = useMemo(() => {
    if (!defendingTeam) return [];
    return defendingTeam.lineup.filter(
      (p) => p.position === 'P' && p.id !== currentPitcher?.playerId
    );
  }, [defendingTeam, currentPitcher]);

  // 指示オプションを生成
  const instructionOptions: InstructionOption[] = useMemo(() => {
    const options: InstructionOption[] = [
      {
        type: 'normal',
        label: '通常守備',
        description: '特別な指示を出さず通常の守備を行います',
        enabled: true,
      },
    ];

    // 投手交代
    const hasBullpen = bullpenPitchers.length > 0;
    options.push({
      type: 'pitcher_change',
      label: '投手交代',
      description: hasBullpen 
        ? 'ブルペンの投手に交代します' 
        : 'ブルペンに投手がいません',
      enabled: hasBullpen,
      warning: pitcherFatigue === 'exhausted' 
        ? '投手が疲労しています（交代推奨）' 
        : pitcherFatigue === 'tired' 
        ? '投手がやや疲労しています' 
        : undefined,
    });

    // 敬遠
    const batterPower = batter?.batting.hrPower || 0;
    const isStrongBatter = batterPower >= 75;
    options.push({
      type: 'intentional_walk',
      label: '敬遠',
      description: isFirstBaseOpen 
        ? '打者に四球を与えて一塁に進めます' 
        : '一塁に走者がいるため、敬遠は推奨されません',
      enabled: isFirstBaseOpen,
      warning: !isFirstBaseOpen 
        ? '一塁に走者がいます' 
        : scoreDiff >= 5 
        ? '大差がついています（推奨されません）' 
        : isStrongBatter 
        ? '強打者です（検討の余地あり）' 
        : undefined,
    });

    // 守備シフト
    options.push({
      type: 'defensive_shift',
      label: '守備シフト変更',
      description: '打者の傾向に応じて守備位置を変更します',
      enabled: true,
      successRate: batter ? `対象打者: ${batter.name}` : undefined,
    });

    return options;
  }, [bullpenPitchers, isFirstBaseOpen, pitcherFatigue, scoreDiff, batter]);

  // 守備シフトオプション
  const shiftOptions: Array<{ shift: DefensiveShift; label: string; description: string }> = [
    {
      shift: 'normal',
      label: '通常守備',
      description: '標準的な守備配置',
    },
    {
      shift: 'pull_right',
      label: '右打ちシフト',
      description: '内野手を一塁・二塁側に寄せます（左打者向け）',
    },
    {
      shift: 'pull_left',
      label: '左打ちシフト',
      description: '内野手を三塁・遊撃側に寄せます（右打者向け）',
    },
    {
      shift: 'extreme_shift',
      label: '極端シフト',
      description: '内野手3名を引っ張り方向に集中配置',
    },
    {
      shift: 'infield_in',
      label: '前進守備',
      description: '内野手全員を前方に配置（本塁阻止）',
    },
    {
      shift: 'infield_back',
      label: '深守備',
      description: '内野手・外野手全員を後方に配置（長打阻止）',
    },
  ];

  // シフト推奨を取得
  const shiftRecommendation = useMemo(() => {
    if (!batter) return null;
    return getShiftRecommendation(batter, gameState);
  }, [batter, gameState]);

  const [showShiftMenu, setShowShiftMenu] = useState(false);
  const [showPitcherMenu, setShowPitcherMenu] = useState(false);

  const handleSelectInstruction = (option: InstructionOption) => {
    if (!option.enabled) {
      return;
    }

    // 投手交代の場合はサブメニューを表示
    if (option.type === 'pitcher_change') {
      setShowPitcherMenu(true);
      return;
    }

    // 守備シフトの場合はサブメニューを表示
    if (option.type === 'defensive_shift') {
      setShowShiftMenu(true);
      return;
    }

    // 警告がある場合は確認
    if (option.warning) {
      const confirmed = window.confirm(`${option.warning}\n\nこの指示を実行しますか？`);
      if (!confirmed) {
        return;
      }
    }

    onSelectInstruction(option.type as DefensiveInstruction);
  };

  const handleSelectShift = (shift: DefensiveShift) => {
    if (onSelectShift) {
      onSelectShift(shift);
    }
    setShowShiftMenu(false);
  };

  const handleSelectPitcher = (pitcherId: string) => {
    if (onSelectPitcher) {
      onSelectPitcher(pitcherId);
    }
    setShowPitcherMenu(false);
  };

  // 投手交代サブメニュー
  if (showPitcherMenu) {
    return (
      <div className="defensive-instruction-menu">
        <h3 className="instruction-menu-title">投手交代</h3>
        
        <div className="current-pitcher-info">
          <h4>現在の投手</h4>
          {currentPitcher && (
            <div className="pitcher-card current">
              <div className="pitcher-name">{currentPitcher.playerName}</div>
              <div className="pitcher-stats">
                <span>投球数: {currentPitcher.pitchCount}球</span>
                <span className={`fatigue-level ${pitcherFatigue}`}>
                  疲労度: {
                    pitcherFatigue === 'fresh' ? '新鮮' :
                    pitcherFatigue === 'normal' ? '普通' :
                    pitcherFatigue === 'tired' ? '疲労' : '限界'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bullpen-pitchers">
          <h4>ブルペン</h4>
          {bullpenPitchers.length === 0 ? (
            <p className="no-pitchers">ブルペンに投手がいません</p>
          ) : (
            <div className="pitcher-list">
              {bullpenPitchers.map((pitcher) => (
                <button
                  key={pitcher.id}
                  className="pitcher-card selectable"
                  onClick={() => handleSelectPitcher(pitcher.id)}
                >
                  <div className="pitcher-name">{pitcher.name}</div>
                  <div className="pitcher-stats">
                    <span>球威: {pitcher.pitching?.stuff || '-'}</span>
                    <span>制球: {pitcher.pitching?.control || '-'}</span>
                    <span>変化: {pitcher.pitching?.movement || '-'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          className="back-button"
          onClick={() => setShowPitcherMenu(false)}
        >
          戻る
        </button>
      </div>
    );
  }

  // 守備シフトサブメニュー
  if (showShiftMenu) {
    return (
      <div className="defensive-instruction-menu">
        <h3 className="instruction-menu-title">守備シフト選択</h3>
        
        {batter && (
          <div className="batter-info-card">
            <h4>対象打者</h4>
            <div className="batter-name">{batter.name}</div>
            <div className="batter-tendency">
              <span>長打力: {batter.batting.hrPower}</span>
              <span>打撃傾向: {batter.batterHand === 'left' ? '左打者' : '右打者'}</span>
            </div>
            
            {/* シフト推奨表示 (AC 8-15) */}
            {shiftRecommendation && (
              <div className={`shift-recommendation ${shiftRecommendation.confidence}`}>
                <div className="recommendation-header">
                  <span className="recommendation-badge">
                    {shiftRecommendation.confidence === 'high' ? '強く推奨' : 
                     shiftRecommendation.confidence === 'medium' ? '推奨' : '参考'}
                  </span>
                  <span className="recommended-shift">
                    {shiftOptions.find(o => o.shift === shiftRecommendation.recommendedShift)?.label}
                  </span>
                </div>
                <div className="recommendation-reason">{shiftRecommendation.reason}</div>
                {shiftRecommendation.warning && (
                  <div className="recommendation-warning">⚠️ {shiftRecommendation.warning}</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="shift-options">
          {shiftOptions.map((option) => {
            const isRecommended = shiftRecommendation?.recommendedShift === option.shift;
            const isCurrent = gameState.defensiveShift === option.shift;
            
            return (
              <button
                key={option.shift}
                className={`shift-option ${isCurrent ? 'current' : ''} ${isRecommended ? 'recommended' : ''}`}
                onClick={() => handleSelectShift(option.shift)}
              >
                <div className="shift-label">
                  {option.label}
                  {isRecommended && <span className="recommended-badge">推奨</span>}
                </div>
                <div className="shift-description">{option.description}</div>
                {isCurrent && (
                  <div className="current-badge">現在の配置</div>
                )}
              </button>
            );
          })}
        </div>

        <button 
          className="back-button"
          onClick={() => setShowShiftMenu(false)}
        >
          戻る
        </button>
      </div>
    );
  }

  // メインメニュー
  return (
    <div className="defensive-instruction-menu">
      <h3 className="instruction-menu-title">守備指示を選択してください</h3>
      
      {currentPitcher && (
        <div className="current-situation">
          <div className="pitcher-info-summary">
            <span className="pitcher-name">{currentPitcher.playerName}</span>
            <span className="pitcher-count">
              投球数: {currentPitcher.pitchCount}球
            </span>
          </div>
          {pitcherFatigue !== 'fresh' && pitcherFatigue !== 'normal' && (
            <div className={`fatigue-warning ${pitcherFatigue}`}>
              ⚠️ 投手が疲労しています
            </div>
          )}
        </div>
      )}

      <div className="instruction-options">
        {instructionOptions.map((option) => (
          <button
            key={option.type}
            data-type={option.type}
            className={`instruction-option ${!option.enabled ? 'disabled' : ''} ${option.warning ? 'warning' : ''}`}
            onClick={() => handleSelectInstruction(option)}
            disabled={!option.enabled}
          >
            <div className="option-header">
              <span className="option-label">{option.label}</span>
              {option.successRate && (
                <span className="option-success-rate">{option.successRate}</span>
              )}
            </div>
            <div className="option-description">{option.description}</div>
            {option.warning && (
              <div className="option-warning">⚠️ {option.warning}</div>
            )}
          </button>
        ))}
      </div>

      <div className="instruction-note">
        <p>※守備指示は試合状況と選手能力を考慮して選択してください</p>
      </div>
    </div>
  );
}
