import { PlayerInGame } from '../types';
import {
  calculateOverallRating,
  getAbilityColor,
  getAbilityGrade,
  getConditionLabel,
  getFatigueLabel,
} from './playerAbilityUtils';
import './PlayerDisplay.css';

/**
 * PlayerDisplay - 試合中の選手情報表示
 * タスク8.4: 試合中の選手表示
 */

interface PlayerDisplayProps {
  player: PlayerInGame;
  isPitcher?: boolean;
  showDetailedStats?: boolean;
}

export function PlayerDisplay({
  player,
  isPitcher = false,
  showDetailedStats = false,
}: PlayerDisplayProps) {
  const overall = calculateOverallRating(player);
  const overallColor = getAbilityColor(overall);
  const overallGrade = getAbilityGrade(overall);

  const conditionLabel = getConditionLabel(player.condition);
  const fatigueLabel = getFatigueLabel(player.fatigue);

  // 打率の計算
  const battingAverage =
    player.atBats && player.atBats > 0
      ? (player.hits || 0) / player.atBats
      : 0.0;

  return (
    <div className="player-display">
      <div className="player-header">
        <div className="player-basic-info">
          <span className="player-position">{player.position}</span>
          <span className="player-name">{player.name}</span>
          <span className="player-hand">
            {player.batterHand === 'left'
              ? '左'
              : player.batterHand === 'right'
              ? '右'
              : '両'}
            {isPitcher && player.pitcherHand && (
              <>
                /
                {player.pitcherHand === 'left'
                  ? '左投'
                  : player.pitcherHand === 'right'
                  ? '右投'
                  : '両投'}
              </>
            )}
          </span>
        </div>
        <div className="player-overall">
          <span className="overall-label">総合</span>
          <span className="overall-value" style={{ color: overallColor }}>
            {overall}
          </span>
          <span className="overall-grade" style={{ color: overallColor }}>
            {overallGrade}
          </span>
        </div>
      </div>

      <div className="player-condition">
        <span className="condition-item">
          <span className="condition-label">調子</span>
          <span className="condition-value">{conditionLabel}</span>
        </span>
        <span className="condition-item">
          <span className="condition-label">疲労</span>
          <span className="condition-value">{fatigueLabel}</span>
        </span>
        {isPitcher && player.currentPitchCount !== undefined && (
          <span className="condition-item">
            <span className="condition-label">球数</span>
            <span className="condition-value">{player.currentPitchCount}</span>
          </span>
        )}
      </div>

      {showDetailedStats && (
        <div className="player-stats">
          {isPitcher && player.pitching ? (
            <div className="pitcher-abilities">
              <div className="ability-row">
                <span className="ability-label">球威</span>
                <span
                  className="ability-value"
                  style={{ color: getAbilityColor(player.pitching.stuff) }}
                >
                  {player.pitching.stuff}
                </span>
              </div>
              <div className="ability-row">
                <span className="ability-label">変化</span>
                <span
                  className="ability-value"
                  style={{ color: getAbilityColor(player.pitching.movement) }}
                >
                  {player.pitching.movement}
                </span>
              </div>
              <div className="ability-row">
                <span className="ability-label">制球</span>
                <span
                  className="ability-value"
                  style={{ color: getAbilityColor(player.pitching.control) }}
                >
                  {player.pitching.control}
                </span>
              </div>
              <div className="ability-row">
                <span className="ability-label">スタミナ</span>
                <span
                  className="ability-value"
                  style={{ color: getAbilityColor(player.pitching.stamina) }}
                >
                  {player.pitching.stamina}
                </span>
              </div>
            </div>
          ) : (
            <div className="batter-abilities">
              <div className="ability-row">
                <span className="ability-label">ミート</span>
                <span
                  className="ability-value"
                  style={{ color: getAbilityColor(player.batting.contact) }}
                >
                  {player.batting.contact}
                </span>
              </div>
              <div className="ability-row">
                <span className="ability-label">パワー</span>
                <span
                  className="ability-value"
                  style={{ color: getAbilityColor(player.batting.hrPower) }}
                >
                  {player.batting.hrPower}
                </span>
              </div>
              <div className="ability-row">
                <span className="ability-label">選球眼</span>
                <span
                  className="ability-value"
                  style={{ color: getAbilityColor(player.batting.eye) }}
                >
                  {player.batting.eye}
                </span>
              </div>
              <div className="ability-row">
                <span className="ability-label">走力</span>
                <span
                  className="ability-value"
                  style={{ color: getAbilityColor(player.running.speed) }}
                >
                  {player.running.speed}
                </span>
              </div>
            </div>
          )}

          <div className="game-stats">
            <div className="stat-row">
              <span className="stat-label">打数</span>
              <span className="stat-value">{player.atBats || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">安打</span>
              <span className="stat-value">{player.hits || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">打率</span>
              <span className="stat-value">{battingAverage.toFixed(3)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">打点</span>
              <span className="stat-value">{player.rbis || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">得点</span>
              <span className="stat-value">{player.runs || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MatchupDisplay - 投打対決の表示
 */
interface MatchupDisplayProps {
  batter: PlayerInGame;
  pitcher: PlayerInGame;
}

export function MatchupDisplay({ batter, pitcher }: MatchupDisplayProps) {
  const batterOverall = calculateOverallRating(batter);
  const pitcherOverall = calculateOverallRating(pitcher);

  // 左右の有利不利を判定
  const isAdvantage =
    batter.batterHand !== 'switch' &&
    batter.batterHand !== pitcher.pitcherHand;

  return (
    <div className="matchup-display">
      <div className="matchup-header">
        <h3 className="matchup-title">投打対決</h3>
      </div>

      <div className="matchup-content">
        <div className="matchup-batter">
          <PlayerDisplay player={batter} showDetailedStats={false} />
          {isAdvantage && (
            <div className="advantage-badge">有利な組み合わせ</div>
          )}
        </div>

        <div className="matchup-vs">VS</div>

        <div className="matchup-pitcher">
          <PlayerDisplay player={pitcher} isPitcher showDetailedStats={false} />
        </div>
      </div>

      <div className="matchup-summary">
        <div className="matchup-stat">
          <span className="matchup-stat-label">打者総合</span>
          <span
            className="matchup-stat-value"
            style={{ color: getAbilityColor(batterOverall) }}
          >
            {batterOverall}
          </span>
        </div>
        <div className="matchup-stat">
          <span className="matchup-stat-label">投手総合</span>
          <span
            className="matchup-stat-value"
            style={{ color: getAbilityColor(pitcherOverall) }}
          >
            {pitcherOverall}
          </span>
        </div>
      </div>
    </div>
  );
}
