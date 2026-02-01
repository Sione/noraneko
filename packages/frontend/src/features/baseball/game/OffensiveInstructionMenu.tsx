import { useMemo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { InstructionOption, OffensiveInstruction } from '../types';
import './OffensiveInstructionMenu.css';

/**
 * OffensiveInstructionMenu - 攻撃指示メニュー
 * Requirement 2.1: 攻撃指示メニューと有効条件
 */

interface OffensiveInstructionMenuProps {
  onSelectInstruction: (instruction: OffensiveInstruction) => void;
}

export function OffensiveInstructionMenu({ onSelectInstruction }: OffensiveInstructionMenuProps) {
  const gameState = useAppSelector((state) => state.game);
  const { runners, currentAtBat, homeTeam, awayTeam, isTopHalf } = gameState;

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
  const hasRunnerOnSecond = runners.second !== null;
  const hasRunnerOnThird = runners.third !== null;
  const hasAnyRunner = hasRunnerOnFirst || hasRunnerOnSecond || hasRunnerOnThird;
  const hasMultipleRunners = [hasRunnerOnFirst, hasRunnerOnSecond, hasRunnerOnThird].filter(Boolean).length >= 2;

  // 指示オプションを生成
  const instructionOptions: InstructionOption[] = useMemo(() => {
    const options: InstructionOption[] = [
      {
        type: 'normal_swing',
        label: '通常打撃',
        description: '打者の通常能力で打席を実行します',
        enabled: true,
        successRate: batter ? `打率 ${(batter.batting.contact / 100 * 0.3).toFixed(3)}` : undefined,
      },
      {
        type: 'wait',
        label: '待て',
        description: 'ボールを見極めて四球を狙います',
        enabled: true,
        successRate: batter ? `選球眼 ${batter.batting.eye}` : undefined,
      },
    ];

    // バント（基本条件：常に表示するが、走者がいない場合は警告を表示）
    options.push({
      type: 'bunt',
      label: 'バント',
      description: '送りバントでランナーを進塁させます',
      enabled: true,
      warning: !hasAnyRunner ? 'ランナーがいません' : undefined,
      successRate: batter ? `バント能力 ${batter.fielding.sacrificeBunt}` : undefined,
    });

    // 盗塁（一塁ランナーがいる場合のみ有効）
    if (hasRunnerOnFirst) {
      options.push({
        type: 'steal',
        label: '盗塁',
        description: '一塁ランナーが二塁への盗塁を試みます',
        enabled: true,
        warning: gameState.outs === 2 ? 'ツーアウトです（推奨度低）' : undefined,
      });
    } else {
      options.push({
        type: 'steal',
        label: '盗塁',
        description: '一塁ランナーが必要です',
        enabled: false,
        warning: '一塁にランナーがいません',
      });
    }

    // ヒットエンドラン（一塁ランナーがいる場合のみ有効）
    if (hasRunnerOnFirst) {
      options.push({
        type: 'hit_and_run',
        label: 'ヒットエンドラン',
        description: 'ランナーが打撃と同時にスタートを切ります',
        enabled: true,
        successRate: batter ? `コンタクト ${batter.batting.contact}` : undefined,
      });
    } else {
      options.push({
        type: 'hit_and_run',
        label: 'ヒットエンドラン',
        description: '一塁ランナーが必要です',
        enabled: false,
        warning: '一塁にランナーがいません',
      });
    }

    // スクイズ（三塁ランナーがいる場合のみ有効）
    if (hasRunnerOnThird) {
      options.push({
        type: 'squeeze',
        label: 'スクイズ',
        description: '三塁ランナーが本塁を狙います',
        enabled: true,
        warning: gameState.outs === 2 ? 'ツーアウトです（リスク高）' : undefined,
        successRate: batter ? `バント能力 ${batter.fielding.sacrificeBunt}` : undefined,
      });
    } else {
      options.push({
        type: 'squeeze',
        label: 'スクイズ',
        description: '三塁ランナーが必要です',
        enabled: false,
        warning: '三塁にランナーがいません',
      });
    }

    // ダブルスチール（複数ランナーがいる場合のみ有効）
    if (hasMultipleRunners) {
      options.push({
        type: 'double_steal',
        label: 'ダブルスチール',
        description: '複数のランナーが同時に盗塁を試みます',
        enabled: true,
        warning: gameState.outs === 2 ? 'ツーアウトです（リスク高）' : undefined,
      });
    } else {
      options.push({
        type: 'double_steal',
        label: 'ダブルスチール',
        description: '複数のランナーが必要です',
        enabled: false,
        warning: '走者が不足しています',
      });
    }

    return options;
  }, [batter, hasRunnerOnFirst, hasRunnerOnThird, hasAnyRunner, hasMultipleRunners, gameState.outs, runners]);

  const handleSelectInstruction = (option: InstructionOption) => {
    if (!option.enabled) {
      return;
    }

    // 警告がある場合は確認
    if (option.warning) {
      const confirmed = window.confirm(`${option.warning}\n\nこの指示を実行しますか？`);
      if (!confirmed) {
        return;
      }
    }

    onSelectInstruction(option.type as OffensiveInstruction);
  };

  return (
    <div className="offensive-instruction-menu">
      <h3 className="instruction-menu-title">攻撃指示を選択してください</h3>
      
      {currentAtBat && (
        <div className="current-situation">
          <div className="batter-info-summary">
            <span className="batter-name">{currentAtBat.batterName}</span>
            <span className="batter-count">
              {currentAtBat.balls}B {currentAtBat.strikes}S
            </span>
          </div>
          <div className="runners-summary">
            <span className="runner-label">走者:</span>
            {!hasAnyRunner && <span className="no-runners">なし</span>}
            {hasRunnerOnFirst && <span className="runner-base">一塁</span>}
            {hasRunnerOnSecond && <span className="runner-base">二塁</span>}
            {hasRunnerOnThird && <span className="runner-base">三塁</span>}
          </div>
        </div>
      )}

      <div className="instruction-options">
        {instructionOptions.map((option) => (
          <button
            key={option.type}
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
        <p>※各指示の成功率は選手能力と状況によって変動します</p>
      </div>
    </div>
  );
}
