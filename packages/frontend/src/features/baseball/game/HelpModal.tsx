import { useState } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * HelpModal - ヘルプモーダルコンポーネント
 * タスク11.4: 操作ガイドとヘルプ
 * 
 * Requirement 7 AC 16-20:
 * - ゲームルールと操作方法の表示
 * - 各指示オプションの説明
 */
export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'offense' | 'defense' | 'abilities'>('basic');

  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>ヘルプ</h2>
          <button className="help-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="help-modal-tabs">
          <button
            className={`help-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            基本操作
          </button>
          <button
            className={`help-tab ${activeTab === 'offense' ? 'active' : ''}`}
            onClick={() => setActiveTab('offense')}
          >
            攻撃指示
          </button>
          <button
            className={`help-tab ${activeTab === 'defense' ? 'active' : ''}`}
            onClick={() => setActiveTab('defense')}
          >
            守備指示
          </button>
          <button
            className={`help-tab ${activeTab === 'abilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('abilities')}
          >
            能力値
          </button>
        </div>

        <div className="help-modal-content">
          {activeTab === 'basic' && (
            <div className="help-section">
              <h3>基本的な操作</h3>
              <p>
                このゲームでは、あなたが監督として試合を進行します。
                各プレイで適切な指示を選択し、チームを勝利に導きましょう。
              </p>

              <h4>試合の流れ</h4>
              <ol>
                <li>イニングが開始されます</li>
                <li>打席開始時に攻撃指示または守備指示を選択します</li>
                <li>プレイが実行され、結果が表示されます</li>
                <li>3アウトで攻守交代します</li>
                <li>9回（または延長）終了で試合終了です</li>
              </ol>

              <h4>スコアボードの見方</h4>
              <ul>
                <li><strong>イニング表示:</strong> 現在のイニングと表裏を表示</li>
                <li><strong>アウトカウント:</strong> 現在のアウト数（0-3）</li>
                <li><strong>走者表示:</strong> 各塁の走者状況</li>
                <li><strong>得点表:</strong> イニング別の得点と合計得点</li>
              </ul>

              <h4>重要局面の表示</h4>
              <ul>
                <li><strong>チャンス！/ピンチ！:</strong> 得点圏（二塁または三塁）に走者がいる</li>
                <li><strong>接戦！:</strong> 7回以降で2点差以内</li>
                <li><strong>サヨナラのチャンス！:</strong> 9回裏で後攻チームが逆転可能</li>
                <li><strong>ラストチャンス！:</strong> ツーアウトで走者がいる</li>
              </ul>
            </div>
          )}

          {activeTab === 'offense' && (
            <div className="help-section">
              <h3>攻撃指示</h3>
              
              <div className="help-item">
                <h4>通常打撃</h4>
                <p>
                  最も基本的な指示です。打者が通常の打撃を行います。
                  打者の能力に応じて、ヒットやアウトなどの結果が出ます。
                </p>
                <ul>
                  <li><strong>推奨:</strong> 基本的には常に使用可能</li>
                  <li><strong>注意:</strong> 打者の能力が低い場合、アウトになる確率が高い</li>
                </ul>
              </div>

              <div className="help-item">
                <h4>バント</h4>
                <p>
                  走者を進塁させることを目的とした指示です。
                  打者はアウトになりますが、走者を確実に次の塁に進めることができます。
                </p>
                <ul>
                  <li><strong>推奨:</strong> ノーアウトまたはワンアウトで走者が一塁にいる</li>
                  <li><strong>注意:</strong> ツーアウト時やクリーンナップには非推奨</li>
                  <li><strong>成功率:</strong> 打者のSacrifice Bunt能力に依存</li>
                </ul>
              </div>

              <div className="help-item">
                <h4>盗塁</h4>
                <p>
                  走者が次の塁に向かって走る指示です。
                  成功すれば大きなアドバンテージですが、失敗するとアウトになります。
                </p>
                <ul>
                  <li><strong>推奨:</strong> 走者のStealing Ability/Speed が高い</li>
                  <li><strong>注意:</strong> 捕手のCatcher Armが高いと失敗しやすい</li>
                  <li><strong>注意:</strong> ツーアウト時は非推奨</li>
                </ul>
              </div>

              <div className="help-item">
                <h4>ダブルスチール</h4>
                <p>
                  複数の走者が同時に次の塁を狙う指示です。
                  一塁と三塁、または一塁と二塁の走者が必要です。
                </p>
                <ul>
                  <li><strong>推奨:</strong> 両方の走者の能力が高い</li>
                  <li><strong>注意:</strong> リスクが高いため慎重に判断</li>
                </ul>
              </div>

              <div className="help-item">
                <h4>ヒットエンドラン</h4>
                <p>
                  打者が打つと同時に走者がスタートを切る指示です。
                  成功すれば走者が大きく進塁できます。
                </p>
                <ul>
                  <li><strong>推奨:</strong> 打者のContact能力と走者のSpeed が高い</li>
                  <li><strong>注意:</strong> 打者が空振りすると盗塁失敗のリスク</li>
                </ul>
              </div>

              <div className="help-item">
                <h4>スクイズ</h4>
                <p>
                  三塁走者を得点させるためのバント指示です。
                  成功すれば確実に1点を取ることができます。
                </p>
                <ul>
                  <li><strong>推奨:</strong> ワンアウト以下で三塁に走者がいる</li>
                  <li><strong>注意:</strong> 失敗すると三塁走者がアウトになるリスク</li>
                  <li><strong>成功率:</strong> 打者のSacrifice Bunt能力と走者のSpeed に依存</li>
                </ul>
              </div>

              <div className="help-item">
                <h4>待て</h4>
                <p>
                  投手の疲労を待つか、四球を狙う指示です。
                  （現在は実装予定）
                </p>
              </div>
            </div>
          )}

          {activeTab === 'defense' && (
            <div className="help-section">
              <h3>守備指示</h3>
              
              <div className="help-item">
                <h4>通常守備</h4>
                <p>
                  特別な指示を出さず、通常の守備配置で臨みます。
                </p>
              </div>

              <div className="help-item">
                <h4>投手交代</h4>
                <p>
                  現在の投手を交代させます。
                  疲労度が高い場合や打たれている場合に有効です。
                </p>
                <ul>
                  <li><strong>推奨:</strong> 投手の投球数が100球を超えた</li>
                  <li><strong>推奨:</strong> 投手が多くの失点をしている</li>
                  <li><strong>注意:</strong> 交代した投手は再出場できません</li>
                </ul>
              </div>

              <div className="help-item">
                <h4>敬遠</h4>
                <p>
                  強打者を歩かせて一塁に進める指示です。
                  次打者との対戦を選びます。
                </p>
                <ul>
                  <li><strong>推奨:</strong> 一塁が空いていて強打者が打席</li>
                  <li><strong>注意:</strong> 満塁になると押し出しのリスク</li>
                </ul>
              </div>

              <div className="help-item">
                <h4>守備シフト変更</h4>
                <p>
                  守備位置を変更して打者の傾向に対応します。
                </p>
                <ul>
                  <li><strong>右打ちシフト:</strong> 左打者の引っ張り方向に対応</li>
                  <li><strong>左打ちシフト:</strong> 右打者の引っ張り方向に対応</li>
                  <li><strong>極端シフト:</strong> より極端に片方に寄せる</li>
                  <li><strong>前進守備:</strong> 内野手を前に配置（本塁阻止）</li>
                  <li><strong>深守備:</strong> 内野手・外野手を後ろに配置（長打阻止）</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'abilities' && (
            <div className="help-section">
              <h3>選手能力値</h3>
              
              <h4>打撃能力</h4>
              <ul>
                <li><strong>Contact:</strong> ヒットの出やすさ</li>
                <li><strong>Gap Power:</strong> 二塁打・三塁打の出やすさ</li>
                <li><strong>HR Power:</strong> 本塁打の出やすさ</li>
                <li><strong>Eye/Discipline:</strong> 四球の取りやすさ</li>
                <li><strong>Avoid K's:</strong> 三振のしにくさ</li>
              </ul>

              <h4>投手能力</h4>
              <ul>
                <li><strong>Stuff:</strong> 奪三振率・被安打率</li>
                <li><strong>Movement:</strong> 被安打率・被本塁打率</li>
                <li><strong>Control:</strong> 与四球率</li>
                <li><strong>Stamina:</strong> 登板可能投球数</li>
                <li><strong>Ground Ball %:</strong> ゴロの出やすさ</li>
                <li><strong>Hold Runners:</strong> 盗塁阻止率</li>
              </ul>

              <h4>走塁能力</h4>
              <ul>
                <li><strong>Speed:</strong> 走る速さ・内野安打率</li>
                <li><strong>Stealing Ability:</strong> 盗塁成功率</li>
                <li><strong>Baserunning:</strong> 走塁判断・追加進塁</li>
              </ul>

              <h4>守備能力</h4>
              <ul>
                <li><strong>Infield Range:</strong> 内野守備範囲</li>
                <li><strong>Outfield Range:</strong> 外野守備範囲</li>
                <li><strong>Infield/Outfield Error:</strong> エラー率（高いほど良い）</li>
                <li><strong>Infield/Outfield Arm:</strong> 送球の強さ</li>
                <li><strong>Turn Double Play:</strong> 併殺処理能力</li>
                <li><strong>Catcher Ability:</strong> 捕手の総合能力</li>
                <li><strong>Catcher Arm:</strong> 盗塁阻止率</li>
              </ul>

              <h4>能力値の色分け</h4>
              <ul className="ability-color-guide">
                <li><span className="ability-excellent">青 (90+)</span> - 傑出</li>
                <li><span className="ability-good">緑 (70-89)</span> - 優秀</li>
                <li><span className="ability-average">黄 (50-69)</span> - 平均</li>
                <li><span className="ability-below">橙 (30-49)</span> - 平均以下</li>
                <li><span className="ability-poor">赤 (1-29)</span> - 劣悪</li>
              </ul>
            </div>
          )}
        </div>

        <div className="help-modal-footer">
          <button className="help-button-close" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
