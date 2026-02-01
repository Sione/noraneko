# Requirements Document

## Project Description (Input)
プレイヤーが監督となってプレイ毎に指示を出し勝利を目指す、テキストベースの野球ゲーム

## Introduction
本ドキュメントは、テキストベースの野球監督シミュレーションゲームの要件を定義します。プレイヤーは監督として試合中のプレイ毎に戦術的指示を出し、チームを勝利に導きます。

## Requirements

### Requirement 1: 試合開始とゲームフロー
**Objective:** プレイヤー（監督）として、試合を開始し進行させたい、試合の基本的な流れを体験できるようにするため

#### Acceptance Criteria

**試合の初期化と開始**
1. When プレイヤーがメインメニューで新規試合を選択する、the Game System shall 対戦チーム選択画面を表示する
2. When プレイヤーが対戦チームを選択する、the Game System shall ホーム/ビジターの選択オプションを提示する
3. When 試合設定が完了する、the Game System shall 初期化された試合状態（スコア0-0、1回表、両チームの先発メンバー）を表示する
4. The Game System shall 試合開始時に両チームの先発投手と1番打者を自動的に設定する
5. When 試合が開始される、the Game System shall 「プレイボール！」などの試合開始メッセージを表示する

**イニング進行管理**
6. When 各イニングが開始される、the Game System shall 現在のイニング（回/表裏）、攻撃チーム、守備チームを明確に表示する
7. When 表の攻撃が始まる、the Game System shall 攻撃側の打順トップから打席に入れる
8. When アウトカウントが3になる、the Game System shall 攻守交代を実行し次の半イニング（裏または次回表）に進む
9. When 裏の攻撃が終了する、the Game System shall イニング終了を表示し次の回に進む
10. The Game System shall イニング間で両チームの現在の得点を更新して表示する

**試合の終了条件**
11. When 9回裏が終了し得点差がある、the Game System shall 試合終了を宣言し勝者を表示する
12. When 9回表終了後に後攻チームがリードしている、the Game System shall 9回裏を実施せずに試合終了とする
13. When 9イニングが完了し得点が同点である、the Game System shall 延長10回に突入することを表示する
14. When 延長戦である、the Game System shall 最大イニング数（例：12回）まで試合を続行する
15. If 延長戦が最大イニングに達し同点である、then the Game System shall 引き分けとして試合を終了する

**特殊な試合終了条件**
16. When 後攻チームが9回裏（または延長裏）にサヨナラ勝ちする、the Game System shall その時点で試合を終了させる
17. When コールドゲーム条件（5回以降で10点差など）を満たす、the Game System shall コールドゲームとして試合を終了する
18. The Game System shall 試合終了時に試合時間（プレイ時間）を表示する

### Requirement 2: プレイ毎の監督指示システム
**Objective:** 監督として、各プレイで戦術的指示を出したい、試合結果に影響を与えられるようにするため

#### Acceptance Criteria

**攻撃側の基本指示**
1. When 打席が開始される、the Game System shall 利用可能な指示オプション（通常打撃、バント、ヒットエンドラン、盗塁、待て）をメニュー形式で表示する
2. When プレイヤーが「通常打撃」を選択する、the Game System shall 打者の通常能力で打席を実行する
3. When プレイヤーが指示を選択する、the Game System shall 選択された指示を確定しプレイを実行する
4. The Game System shall 各指示オプションに簡潔な説明文（成功率の目安、リスクなど）を付ける
5. When プレイヤーが指示選択に時間をかけすぎる、the Game System shall タイムアウトせず待機し続ける

**ランナーがいる場合の追加指示**
6. While ランナーが塁上にいる、the Game System shall 走者関連の指示（盗塁、エンドラン、スクイズ）を選択肢に追加する
7. When ランナーが一塁のみにいる、the Game System shall 盗塁とエンドランを有効化する
8. When ランナーが三塁にいる、the Game System shall スクイズバントを選択肢に追加する
9. When 複数のランナーがいる、the Game System shall ダブルスチール（二重盗塁）を選択肢に追加する
10. If ランナーがいない状態で走者関連指示が選ばれる、then the Game System shall 無効な指示として警告を表示する

**守備側の指示**
11. When 守備側の監督のターンである、the Game System shall 守備指示メニュー（投手交代、守備シフト、敬遠）を表示する
12. When プレイヤーが「投手交代」を選択する、the Game System shall ブルペンの投手一覧と各投手の疲労度を表示する
13. When プレイヤーが「敬遠」を選択する、the Game System shall 打者に四球を与えランナーを一塁に進める
14. When プレイヤーが「守備シフト」を選択する、the Game System shall 利用可能なシフト（右打ちシフト、極端シフトなど）を表示する
15. The Game System shall 守備指示が実行された後に攻撃側の打席を再開する

**特殊な状況での指示制限**
16. When カウントが2ストライクである、the Game System shall バント系の指示の成功率を低下させる
17. When ツーアウトである、the Game System shall 盗塁の推奨度を下げる警告を表示する（実行は可能）
18. When 走者の走力が低い、the Game System shall 盗塁指示に対してリスク警告を表示する
19. If 試合が大差で負けている、then the Game System shall 敬遠指示を推奨しない警告を表示する

**指示実行のフィードバック**
20. When 指示が実行される、the Game System shall 指示内容（例：「バント指示！」）を表示する
21. When プレイ結果が出る、the Game System shall 指示の成否と結果（成功/失敗、得点への影響）をテキストで説明する
22. When 指示が失敗する、the Game System shall 失敗の理由（選手能力不足、運が悪かったなど）を簡潔に説明する
23. The Game System shall 各プレイの実行結果を試合ログに記録する

### Requirement 3: プレイ結果の判定とシミュレーション
**Objective:** システムとして、監督の指示に基づいてリアルな野球プレイを再現したい、ゲームの没入感を高めるため

#### Acceptance Criteria

**基本的なプレイ判定ロジック**
1. When プレイが実行される、the Game System shall 選手能力（打率、走力など）と指示内容を組み合わせてプレイ結果を確率的に判定する
2. The Game System shall 乱数生成器を使用して結果の不確実性を再現する
3. When 打撃プレイが実行される、the Game System shall ヒット（単打、二塁打、三塁打、本塁打）、アウト、四球、三振、ファウルフライなどの結果候補から選択する
4. The Game System shall 各結果の発生確率を選手能力に応じて動的に計算する
5. When 結果が決定される、the Game System shall 試合状態（スコア、アウトカウント、ランナー）を更新する

**打撃結果の詳細判定**
6. When 通常打撃が実行される、the Game System shall 打者のContact能力とBABIP能力を組み合わせてヒット確率を計算する
7. When ヒットが出る、the Game System shall 打者のGap Power（二塁打・三塁打）とHR Power（本塁打）に基づいて単打/二塁打/三塁打/本塁打を判定する
8. When アウトになる、the Game System shall 投手のGround Ball %とAvoid K's能力に基づいてゴロアウト、フライアウト、三振などのアウト種類を判定する
9. When 投手の疲労度が高い、the Game System shall 投手のStuffとControlを減衰させることで打者有利に確率を補正する
10. When 打者のコンディションが好調である、the Game System shall Contact、Gap Power、HR Power等の打撃能力値を5-10%上昇させる

**バント系プレイの判定**
11. When バント指示が出される、the Game System shall 成功率を通常打撃の打率とは独立した専用ロジックで計算する
12. When バントが成功する、the Game System shall ランナーを進塁させ打者をアウトにする
13. When バントが失敗する、the Game System shall ファウルまたは打ち損じによるアウトとして処理する
14. When スクイズが試みられる、the Game System shall 成功時に三塁ランナーを得点させる
15. If スクイズが失敗する、then the Game System shall 三塁ランナーをアウトにするリスクを適用する

**走塁プレイの判定**
16. When 盗塁が試みられる、the Game System shall ランナーの走力、投手のクイック能力、捕手の肩力を総合的に評価する
17. When 盗塁が成功する、the Game System shall ランナーを次の塁に進める
18. When 盗塁が失敗する、the Game System shall ランナーをアウトにしアウトカウントを増加させる
19. When エンドランが実行される、the Game System shall 打者が打った結果とランナーの走塁を連動させる
20. If エンドランで打者がゴロを打つ、then the Game System shall ランナーの進塁成功率を通常より高く設定する

**ランナー進塁の判定**
21. When ヒットが出る、the Game System shall 打球の種類（単打/長打）と塁上のランナー位置に応じて進塁を判定する
22. When 単打が出る、the Game System shall 一塁・二塁ランナーは確実に進塁、三塁ランナーは確率的に本塁到達を判定する
23. When 二塁打が出る、the Game System shall 全ランナーを最低2塁分進塁させる
24. When 本塁打が出る、the Game System shall 打者と全ランナーを得点させる
25. When タイムリーヒットで得点が入る、the Game System shall 得点を加算しスコアボードを更新する

**守備プレイとアウトの判定**
26. When ゴロが打たれる、the Game System shall 守備側の守備力に基づいてエラー発生の可否を判定する
27. When ダブルプレー機会（ランナー一塁でゴロ）が発生する、the Game System shall 確率的にダブルプレーを判定する
28. When フライが打たれる、the Game System shall タッチアップの可能性を判定する
29. If 守備エラーが発生する、then the Game System shall ランナーを余分に進塁させる
30. The Game System shall 全てのプレイ結果を自然な日本語のテキストで実況形式で表示する

### Requirement 4: 選手とチーム情報の管理
**Objective:** 監督として、選手やチームの状態を詳細に把握したい、Out of the Park Baseball 26のような深みのある選手能力システムで適切な指示判断ができるようにするため

#### 選手能力の完全リストと影響

**打撃能力（野手）**
1. **Contact（コンタクト能力）** [1-100]
   - 影響: ヒット確率とBABIP（インプレー打球のヒット率）を決定。値が高いほどバットに当てやすく、ヒットが出やすい。
   
2. **BABIP（BABIP能力）** [1-100]
   - 影響: インプレーの打球がヒットになる確率を決定。値が高いほど運に左右されにくく安定したヒット率を維持。
   
3. **Gap Power（ギャップ長打力）** [1-100]
   - 影響: 二塁打・三塁打の発生率を決定。値が高いほど外野の間を抜ける長打が増える。
   
4. **Home Run Power（本塁打力）** [1-100]
   - 影響: 本塁打の発生率を決定。Gap Powerとは独立した能力で、値が高いほどホームランが出やすい。
   
5. **Eye / Discipline（選球眼）** [1-100]
   - 影響: 四球の獲得率を決定。値が高いほどボール球を見極め、出塁率が向上する。
   
6. **Avoid K's（三振回避能力）** [1-100]
   - 影響: 三振の発生率を決定。値が高いほど三振が減り、ボールインプレーの機会が増える。
   
7. **vs LHP（対左投手成績）** [修正値]
   - 影響: 左投手との対戦時に上記打撃能力に補正を適用。値が高いほど左投手に強い。
   
8. **vs RHP（対右投手成績）** [修正値]
   - 影響: 右投手との対戦時に上記打撃能力に補正を適用。値が高いほど右投手に強い。

**投手能力**
9. **Stuff（球威）** [1-100]
   - 影響: 奪三振率に直接影響。値が高いほど空振りを奪いやすく、被安打率も低下。
   
10. **Movement（変化球）** [1-100]
    - 影響: 被安打率と被本塁打率を決定。値が高いほど打者のタイミングを外し、芯で捉えられにくい。
    
11. **Control（制球力）** [1-100]
    - 影響: 与四球率を決定。値が高いほどストライクゾーンに投げ込め、無駄な走者を出さない。
    
12. **Stamina（スタミナ）** [1-100]
    - 影響: 登板可能投球数と疲労蓄積速度を決定。値が高いほど長いイニングを投げられ、疲労による能力低下が遅い。
    
13. **Ground Ball %（ゴロ率）** [1-100]
    - 影響: 打球がゴロになる確率を決定。値が高いほどゴロが増え、本塁打を防ぎ、ダブルプレーの機会が増える。
    
14. **Velocity（球速）** [データ参照値]
    - 影響: 球威（Stuff）への補正要素として機能。値が高いほどStuffに正の補正がかかる。
    
15. **Hold Runners（牽制能力）** [1-100]
    - 影響: 盗塁阻止率と牽制によるランナーの釘付け効果を決定。値が高いほど盗塁されにくい。

**走塁・盗塁能力**
16. **Speed（走力）** [1-100]
    - 影響: 進塁判定、三塁打の発生率、内野安打の確率、一塁到達時間に影響。値が高いほど速く走れる。
    
17. **Stealing Ability（盗塁能力）** [1-100]
    - 影響: 盗塁成功率を決定。Speedとは独立した能力で、値が高いほどスタートが良く盗塁成功しやすい。
    
18. **Stealing Aggressiveness（盗塁積極性）** [1-100]
    - 影響: AI操作時に盗塁を試みる頻度を決定。プレイヤー操作時は参考情報として表示。
    
19. **Baserunning（走塁技術）** [1-100]
    - 影響: 追加進塁の成否と走塁ミス（過走、タッグアウト）の回避率を決定。値が高いほど賢い走塁判断ができる。

**バント能力**
20. **Sacrifice Bunt（犠打バント能力）** [1-100]
    - 影響: 送りバントの成功率を決定。値が高いほど確実にランナーを進められる。
    
21. **Bunt for Hit（セーフティバント能力）** [1-100]
    - 影響: バントヒットの成功率を決定。Speedと組み合わせて判定され、値が高いほどセーフティバントが成功しやすい。

**守備能力（野手）**
22. **Infield Range（内野守備範囲）** [1-100]
    - 影響: 内野ゴロに追いつける範囲を決定。値が高いほど広範囲の打球を処理でき、ヒット性の当たりをアウトにできる。
    
23. **Outfield Range（外野守備範囲）** [1-100]
    - 影響: 外野フライに追いつける範囲を決定。値が高いほど広範囲をカバーし、長打を防げる。
    
24. **Infield Error（内野エラー率）** [1-100]
    - 影響: 内野守備時のエラー発生率を決定。値が高いほどエラーが少ない（100に近いほど確実）。
    
25. **Outfield Error（外野エラー率）** [1-100]
    - 影響: 外野守備時のエラー発生率を決定。値が高いほどエラーが少ない（100に近いほど確実）。
    
26. **Infield Arm（内野肩力）** [1-100]
    - 影響: 内野からの送球判定（併殺、刺殺）に影響。値が高いほど強肩で、ランナーをアウトにしやすい。
    
27. **Outfield Arm（外野肩力）** [1-100]
    - 影響: 外野からの送球判定（タッチアップ阻止、進塁阻止）に影響。値が高いほど遠投が効き、ランナーの進塁を防げる。
    
28. **Turn Double Play（併殺処理能力）** [1-100]
    - 影響: ダブルプレー成功率を決定。主に二塁手・遊撃手が使用し、値が高いほど確実にゲッツーを取れる。

**捕手専用能力**
29. **Catcher Ability（捕手総合能力）** [1-100]
    - 影響: 配球判断とフレーミング（際どい球をストライクにする能力）に影響。値が高いほど投手の能力を引き出せる。
    
30. **Catcher Arm（捕手肩力）** [1-100]
    - 影響: 盗塁阻止率と牽制悪送球率を決定。値が高いほど盗塁を刺しやすく、送球ミスが少ない。

**守備適性**
31. **Position Rating（ポジション適性）** [A/B/C/D/F]
    - 影響: 各守備位置での能力発揮度を決定。主ポジション以外では能力が減衰（A=100%, B=90%, C=75%, D=60%, F=40%）。

**コンディションと状態**
32. **Condition（コンディション）** [絶好調/好調/普通/不調/絶不調]
    - 影響: 絶好調時は全打撃能力+10～15%、好調時は+5%、不調時は-10～15%、絶不調時は-15～20%。
    
33. **Fatigue（疲労度）** [新鮮/普通/疲労/限界]
    - 影響: 投手の場合、疲労度に応じてStuffとControlが段階的に低下（疲労=-10%、限界=-20%）。野手の場合、連戦時に全能力が微減。
    
34. **Pitcher Fatigue by Pitch Count（投球数疲労）** [投球数]
    - 影響: 0-50球=新鮮、51-75球=普通、76-100球=疲労（Stuff-5～10%, Control-10～15%）、101球以上=限界（Stuff-15～20%, Control-20～25%）。

**打者タイプ分類（派生情報）**
35. **Hitter Type（打者タイプ）**
    - パワーヒッター: HR Power 70+、Contact 60未満
    - コンタクトヒッター: Contact 70+、HR Power 60未満
    - バランス型: Contact 65+、Gap/HR Power 65+
    - 影響: 戦術選択時の推奨度に影響（パワーヒッターにはバント非推奨など）。

**投手タイプ分類（派生情報）**
36. **Pitcher Role（投手役割）**
    - 先発投手: Stamina 70+、得意球種3つ
    - リリーフ投手: Stamina 60未満、得意球種2つ、短期間で高Stuffを維持
    - 影響: 登板可能イニング数と疲労回復速度が異なる。

**利き腕・打席による補正**
37. **Batter Hand（打者の利き手）** [左/右/スイッチ]
    - 影響: 左打者は一塁到達時間が0.2秒短く、バント成功率+5～10%。投手との左右組み合わせでvs LHP/RHP補正が適用される。
    
38. **Pitcher Hand（投手の利き腕）** [左/右]
    - 影響: 打者との左右組み合わせで打者の対左右能力補正が適用される（右投手vs左打者など）。

#### Acceptance Criteria

**打撃能力の詳細データ（OOTP26準拠）**
1. The Game System shall 各野手の「コンタクト能力」（Contact）を1-100スケールで保持し、ヒット確率とBABIPに影響させる
2. The Game System shall 各野手の「BABIP能力」を保持し、インプレーの打球がヒットになる確率を決定する
3. The Game System shall 各野手の「ギャップ長打力」（Gap Power）を保持し、二塁打・三塁打の発生率に影響させる
4. The Game System shall 各野手の「本塁打力」（Home Run Power）を保持し、本塁打の発生率を独立して決定する
5. The Game System shall 各野手の「選球眼」（Eye/Discipline）を保持し、四球の獲得率に影響させる
6. The Game System shall 各野手の「三振回避能力」（Avoid K's）を保持し、三振の発生率を決定する
7. When 打撃判定が実行される、the Game System shall Contact、BABIP、Gap Power、HR Powerを組み合わせて最終的な打撃結果を決定する
8. The Game System shall 各打者の対左投手成績（vs LHP）と対右投手成績（vs RHP）を分離して保持する
9. When 投手と打者の左右の組み合わせを判定する、the Game System shall 該当する対左右能力値を適用する
10. The Game System shall 各打者の「打者タイプ」（Hitter Type：パワーヒッター、コンタクトヒッター、バランス型）を分類する

**投手能力の詳細データ（OOTP26準拠）**
11. The Game System shall 各投手の「球威」（Stuff）を保持し、奪三振率に直接影響させる
12. The Game System shall 各投手の「変化球」（Movement）を保持し、被安打率と被本塁打率に影響させる
13. The Game System shall 各投手の「制球力」（Control）を保持し、与四球率を決定する
14. The Game System shall 各投手の「スタミナ」を保持し、登板可能投球数と疲労蓄積速度を決定する
15. The Game System shall 各投手の「ゴロ率」（Ground Ball %）を保持し、打球がゴロになる確率を決定する
16. The Game System shall 各投手の「球速」（Velocity）をデータとして保持する（球威への補正要素として機能）
17. The Game System shall 各投手の「牽制能力」（Hold Runners）を保持し、盗塁阻止率に影響させる
18. The Game System shall 各投手の「最も得意な3球種」（先発）または「2球種」（リリーフ）を記録し球威計算に使用する
19. When 投手が連投する、the Game System shall 前回登板からの日数に応じてStuffとControlを減衰させる
20. The Game System shall 先発投手とリリーフ投手で異なる能力評価ロジックを適用する

**走塁・盗塁能力（OOTP26準拠）**
21. The Game System shall 各選手の「走力」（Speed）を保持し、進塁判定と三塁打の発生率に影響させる
22. The Game System shall 各選手の「盗塁能力」（Stealing Ability）を走力とは独立して保持し、盗塁成功率を決定する
23. The Game System shall 各選手の「盗塁積極性」（Stealing Aggressiveness）を保持し、盗塁を試みる頻度を決定する
24. The Game System shall 各選手の「走塁技術」（Baserunning）を保持し、追加進塁の成否と走塁ミスの回避率に影響させる
25. When 盗塁判定を行う、the Game System shall 走者のStealing Ability、投手のHold Runners、捕手のCatcher Armを総合評価する
26. When ランナーが進塁機会を得る、the Game System shall SpeedとBaserunningを組み合わせて追加進塁の可否を判定する
27. The Game System shall 左打者の一塁到達時間を右打者より0.2秒短く設定する

**バント能力（OOTP26準拠）**
28. The Game System shall 各選手の「犠打バント能力」（Sacrifice Bunt）を保持し、送りバント成功率を決定する
29. The Game System shall 各選手の「セーフティバント能力」（Bunt for Hit）を保持し、バントヒット成功率を決定する
30. When セーフティバントが試みられる、the Game System shall Bunt for Hit能力とSpeedを組み合わせて判定する
31. When 左打者がバントする、the Game System shall 一塁への距離が近いため成功率を5-10%上昇させる

**守備能力（OOTP26準拠）**
32. The Game System shall 各選手の「内野守備範囲」（Infield Range）と「外野守備範囲」（Outfield Range）を分離して保持する
33. The Game System shall 各選手の「内野エラー率」（Infield Error）と「外野エラー率」（Outfield Error）を保持する（高いほどエラーが少ない）
34. The Game System shall 各選手の「内野肩力」（Infield Arm）と「外野肩力」（Outfield Arm）を保持し、送球判定に使用する
35. The Game System shall 各選手の「併殺処理能力」（Turn Double Play）を保持し、ダブルプレー成功率に影響させる
36. The Game System shall 捕手専用能力として「捕手総合能力」（Catcher Ability）を保持し、配球とフレーミングに影響させる
37. The Game System shall 捕手専用能力として「捕手肩力」（Catcher Arm）を保持し、盗塁阻止率と牽制悪送球率を決定する
38. When 守備機会が発生する、the Game System shall 選手のポジション適性（主ポジション/サブポジション）に応じてペナルティを適用する
39. When 打球判定を行う、the Game System shall 守備側のRangeで打球に追いつけるか判定し、Errorでエラーの有無を判定する
40. The Game System shall 各守備位置に適性レーティング（A/B/C/D/F）を付与し、不慣れなポジションでは能力を減衰させる

**コンディションと選手状態管理**
41. The Game System shall 各選手の試合中コンディション（絶好調/好調/普通/不調/絶不調）を5段階で保持する
42. When 選手が絶好調状態である、the Game System shall 全打撃能力を10-15%上昇させる
43. When 選手が不調状態である、the Game System shall 全打撃能力を10-15%低下させる
44. The Game System shall コンディションを試合結果（ヒット、アウト）に応じて確率的に変動させる
45. The Game System shall 各選手の疲労度を保持し、連戦や長時間出場で能力を減衰させる

**チーム編成とロースター管理**
46. The Game System shall 各チームに先発メンバー9名とベンチ選手5名以上を配置する
47. When プレイヤーがチーム情報を要求する、the Game System shall スターティングラインナップ（打順、守備位置、選手名、主要能力値）を表示する
48. When 試合開始前である、the Game System shall プレイヤーに打順編集機能を提供する
49. When 打順を編集する、the Game System shall ドラッグ&ドロップまたは番号入力で打順を入れ替えられるようにする
50. If プレイヤーが不適切な守備配置（投手以外を投手に配置など）を試みる、then the Game System shall 警告を表示し修正を促す
51. The Game System shall 推奨打順機能を提供し、選球眼の高い選手を1-2番、長打力のある選手を3-5番に自動配置する
52. When プレイヤーが「推奨打順」を選択する、the Game System shall 各選手のContact、Eye、Gap/HR Powerを評価し最適な打順を生成する

**試合中の選手情報表示**
53. When 打者が打席に入る、the Game System shall 打者名、打順、打率、今試合の成績（打数-安打数）、対左右投手成績を表示する
54. When プレイヤーが打者詳細を要求する、the Game System shall Contact、Gap Power、HR Power、Eye、Avoid K'sの5能力値を表示する
55. When プレイヤーが打者詳細を要求する、the Game System shall 現在のコンディション状態とその影響を明示する
56. When 投手が登板中である、the Game System shall 投手名、投球数、被安打数、奪三振数、与四球数を表示する
57. When プレイヤーが投手詳細を要求する、the Game System shall Stuff、Movement、Control、Stamina、疲労度を表示する
58. The Game System shall 各打席前に投手と打者の左右の組み合わせを表示する（例：「右投手 vs 左打者」）

**投手の疲労管理システム（詳細化）**
59. The Game System shall 投手の現在投球数をリアルタイムで追跡する
60. The Game System shall 投手の疲労度を以下の段階で分類する：「新鮮」（0-50球）、「普通」（51-75球）、「疲労」（76-100球）、「限界」（101球以上）
61. When 投手が「疲労」状態になる、the Game System shall Stuffを5-10%、Controlを10-15%低下させる
62. When 投手が「限界」状態になる、the Game System shall Stuffを15-20%、Controlを20-25%低下させる
63. If 投手の投球数が個人のStamina閾値を超える、then the Game System shall 追加で能力を5%ずつ低下させる
64. When 投手の疲労度が「疲労」以上に達する、the Game System shall 監督に「投手が疲れています」と警告メッセージを表示する
65. If 投手の投球数が100球を超える、then the Game System shall 「投手交代を検討してください」と推奨警告を表示する
66. When 投手交代が実行される、the Game System shall 新投手の疲労度を「新鮮」状態で初期化する
67. The Game System shall リリーフ投手の登板可能イニング数をStaminaに基づいて制限する（低Stamina=1-2イニング、高Stamina=3-4イニング）

**選手交代システム（詳細化）**
68. When プレイヤーが選手交代メニューを開く、the Game System shall ベンチメンバー一覧を能力値と共に表示する
69. When プレイヤーが代打を選択する、the Game System shall ベンチの野手から選択可能な選手を表示する
70. When プレイヤーが守備固めを選択する、the Game System shall 現在の守備位置に適性がある選手を表示する
71. When 代打が起用される、the Game System shall その打席のみ代打が打ち、次の守備から正式に交代するか確認する
72. When 野手が交代する、the Game System shall 交代後の打順位置を自動的に引き継ぐ
73. When 投手交代が実行される、the Game System shall DHを採用していない場合、新投手が打順に入ることを確認する
74. The Game System shall 一度交代した選手は再出場できないルールを厳格に適用する
75. If プレイヤーが既に交代済みの選手を再び起用しようとする、then the Game System shall 「この選手は既に交代しています」とエラー表示する

**能力値の可視化とスカウト評価**
76. The Game System shall 全ての能力値を1-100スケールで統一表示する
77. The Game System shall 能力値を色分けで表現する：青（90+：傑出）、緑（70-89：優秀）、黄（50-69：平均）、橙（30-49：平均以下）、赤（1-29：劣悪）
78. When 選手詳細を表示する、the Game System shall 各能力値に色付きバーまたは記号を添えて視覚化する
79. The Game System shall 総合評価（Overall Rating）を主要能力の加重平均で自動計算する
80. When 打者の総合評価を計算する、the Game System shall Contact（30%）、Gap/HR Power（40%）、Eye（15%）、Speed（15%）で加重する
81. When 投手の総合評価を計算する、the Game System shall Stuff（40%）、Movement（35%）、Control（25%）で加重する

**統計とトレンド追跡**
82. The Game System shall 各選手の試合中成績（打数、安打、打点、得点、盗塁など）をリアルタイムで更新する
83. The Game System shall 投手の試合中成績（投球回、被安打、奪三振、与四球、失点、自責点）をリアルタイムで更新する
84. When 試合が終了する、the Game System shall 全選手の個人成績を試合結果と共に保存する
85. The Game System shall シーズン通算成績（複数試合）を集計し表示するオプションを提供する

### Requirement 5: 試合状況の可視化
**Objective:** 監督として、現在の試合状況を一目で把握したい、戦術的判断を素早く行えるようにするため

#### Acceptance Criteria

**スコアボード表示**
1. The Game System shall スコアボード（両チームの得点、イニング、アウトカウント、ボールカウント）を画面上部に常時表示する
2. The Game System shall イニング別の得点経過を表形式で表示する（例：1回=0, 2回=2, 3回=0...）
3. When 得点が入る、the Game System shall スコアボードをリアルタイムで更新し視覚的に強調する
4. The Game System shall 現在の打順位置（何番打者か）をスコアボード付近に表示する
5. When イニングが変わる、the Game System shall イニング表示を更新し攻守交代を明示する

**ランナー状況の表示**
6. The Game System shall 塁上のランナー状態を記号（例：●=ランナーあり、○=塁なし）またはテキストで表現する
7. When ランナーが塁に出る、the Game System shall 該当する塁の表示を即座に更新する
8. When ランナーが進塁または得点する、the Game System shall ランナー表示をアニメーション風のテキスト演出で更新する
9. The Game System shall ランナーがいる塁に選手名を表示するオプションを提供する
10. When 満塁状態になる、the Game System shall 「満塁！」などの状況説明を強調表示する

**プレイ実況と結果表示**
11. When プレイが実行される、the Game System shall 打席の流れ（投球、打撃、結果）を自然な日本語で実況形式で表示する
12. When プレイ結果が出る、the Game System shall 何が起きたか（ヒット、アウト、得点など）を明確に説明する
13. When 得点が入る、the Game System shall 「○○選手のタイムリーヒット！△△選手が生還！」などの臨場感ある実況を表示する
14. When 重要なプレイ（三振、ホームラン、ダブルプレー）が発生する、the Game System shall 特別な強調表示と効果音的な記号（！！！）を使用する
15. The Game System shall 各プレイの結果を色分けまたは記号で視覚的に区別する（例：ヒット=青、アウト=灰色）

**重要局面の強調**
16. When 得点圏にランナーがいる、the Game System shall 「チャンス！」「ピンチ！」などの状況ラベルを表示する
17. When クリーンナップ打者（3-5番）が打席に入る、the Game System shall 「強打者登場」などの注意喚起を表示する
18. When ツーアウトで攻撃チームに最後のチャンスである、the Game System shall 「ラストチャンス！」と表示する
19. When 試合終盤（7回以降）で僅差である、the Game System shall 「接戦！」や点差を強調表示する
20. When サヨナラのチャンスである、the Game System shall 「サヨナラのチャンス！」と大きく表示する

**プレイ履歴とログ**
21. The Game System shall 試合中の全プレイを時系列で記録する
22. When プレイヤーがログを要求する、the Game System shall 過去のプレイ履歴をスクロール可能なリストで表示する
23. When プレイヤーが特定イニングのログを確認する、the Game System shall そのイニングのプレイのみをフィルタ表示する
24. The Game System shall ログに各プレイの時刻、打者名、結果、スコア変動を含める
25. When 試合が長時間になる、the Game System shall ログの最大表示件数を制限し古いログは圧縮する

**視覚的なユーザビリティ**
26. The Game System shall 現在の状況（攻撃中/守備中、指示待ちなど）を明確に表示する
27. The Game System shall テキストベースでありながら見やすいレイアウト（罫線、スペース、改行）を使用する
28. When 画面が情報過多になる、the Game System shall 必須情報のみを前面に表示し詳細は要求時に表示する
29. The Game System shall 色や太字（可能な環境では）を使って情報の重要度を視覚的に表現する
30. The Game System shall 常に次に何をすべきか（指示選択、確認など）をガイドメッセージで表示する

### Requirement 6: ゲームの勝敗判定
**Objective:** システムとして、試合の勝敗を正しく判定したい、野球のルールに従った結果を提供するため

#### Acceptance Criteria

**通常の試合終了判定**
1. When 9回裏が終了し得点差がある、the Game System shall リードしているチームを勝者として判定する
2. When 9回表終了後に後攻チームがリードしている、the Game System shall 9回裏を実施せずに試合終了とする
3. When 試合が終了する、the Game System shall 「試合終了！」のメッセージと最終スコアを大きく表示する
4. When 試合が終了する、the Game System shall 勝利チームと敗北チームを明示する
5. The Game System shall 試合終了時に両チームの最終成績（ヒット数、エラー数、残塁数）を表示する

**延長戦のルールと判定**
6. When 9イニングが完了し得点が同点である、the Game System shall 「延長戦に突入します」と表示し10回に進む
7. When 延長イニングが開始される、the Game System shall 現在が延長何回目かを明確に表示する
8. The Game System shall 延長戦のルールとして最大12回（設定可能）までを実施する
9. When 延長イニングで得点差がつく、the Game System shall そのイニング終了時に試合を終了する
10. When 延長戦が最大イニング（12回）に達し同点である、the Game System shall 引き分けとして試合を終了する

**サヨナラゲームの判定**
11. When 後攻チームが9回裏（または延長裏）に勝ち越す、the Game System shall その時点で即座にサヨナラ勝ちとして試合を終了する
12. When サヨナラ勝ちが発生する、the Game System shall 「サヨナラ勝ち！」の特別なメッセージを表示する
13. When サヨナラ本塁打が出る、the Game System shall 「サヨナラホームラン！」と大きく演出する
14. The Game System shall サヨナラ時は裏攻撃の途中でも試合を終了させる

**コールドゲームとその他特殊終了**
15. When 5回終了時点で10点以上の得点差がある、the Game System shall コールドゲームの適用を判定する
16. When コールドゲーム条件を満たす、the Game System shall 「コールドゲーム成立」と表示し試合を終了する
17. If プレイヤーが試合中断を選択し保存せずに終了する、then the Game System shall 試合を無効（ノーゲーム）として扱う
18. When 試合が正常終了する、the Game System shall 試合結果を戦績として確定させる

**試合終了後の処理**
19. When 試合が終了する、the Game System shall 試合結果（日時、対戦相手、スコア、勝敗、試合時間）を自動保存する
20. When 試合が終了する、the Game System shall プレイヤーに次のアクション選択肢（新規試合、履歴確認、終了）を提示する
21. When 試合終了後にプレイヤーが「新規試合」を選択する、the Game System shall 新しい試合の初期化画面に遷移する
22. The Game System shall 試合終了時に簡易な試合サマリー（MVP選手、ハイライトプレイ）を表示するオプションを提供する
23. When 引き分けが発生する、the Game System shall 戦績に引き分けとして記録する

**試合統計の集計**
24. The Game System shall 試合終了時に両チームの総打数、安打数、得点、エラー数を集計する
25. The Game System shall 個人成績（打者の打数・安打、投手の投球回・失点）を集計し保存する

### Requirement 7: エラーハンドリングとユーザビリティ
**Objective:** プレイヤーとして、スムーズにゲームを楽しみたい、エラーやミス入力で中断されないようにするため

#### Acceptance Criteria

**入力エラーのハンドリング**
1. If プレイヤーが無効な指示（範囲外の数値、存在しない選択肢）を入力する、then the Game System shall 「無効な入力です。もう一度選択してください」と表示し再選択を促す
2. If プレイヤーが現在の状況で選択できない指示を選ぶ、then the Game System shall 理由を説明し（例：「ランナーがいません」）適切な選択肢を再提示する
3. When 入力エラーが発生する、the Game System shall 試合状態を変更せず同じ場面を維持する
4. The Game System shall 入力エラー時に警告音的な記号（[!]など）を表示する
5. If プレイヤーが連続して3回以上エラー入力する、then the Game System shall ヘルプメッセージや選択肢の詳細説明を表示する

**システムエラーとデータ保護**
6. If システムエラー（例外、クラッシュ）が発生する、then the Game System shall 現在の試合状態を緊急保存する
7. When システムが予期しないエラーで停止する、the Game System shall エラーログをファイルに記録する
8. When ゲーム再起動時にクラッシュ履歴がある、the Game System shall 「前回の試合を復元しますか？」と確認する
9. The Game System shall 自動保存機能を提供し各イニング終了時に試合状態を保存する
10. If データ保存に失敗する、then the Game System shall 「保存に失敗しました」と警告し再試行オプションを提供する

**試合の中断と再開**
11. When プレイヤーが中断（一時停止）を要求する、the Game System shall 試合を一時停止し現在の状態を保持する
12. When 試合が一時停止される、the Game System shall 「再開」「保存して終了」「保存せずに終了」のオプションを表示する
13. When プレイヤーが「保存して終了」を選択する、the Game System shall 試合データを保存しメインメニューに戻る
14. When プレイヤーが次回起動時に「試合を再開」を選択する、the Game System shall 保存された試合状態を正確に復元する
15. The Game System shall 中断前の試合状況（スコア、ランナー、打順、投手）を完全に再現する

**ユーザビリティとガイダンス**
16. The Game System shall すべての指示選択肢に番号を振り数字入力で選択できるようにする
17. The Game System shall 各指示オプションに簡潔な説明文（1行）を付ける
18. When 初回プレイである、the Game System shall 基本的な操作方法を説明するチュートリアルを表示するオプションを提供する
19. When プレイヤーが「ヘルプ」を要求する、the Game System shall ゲームルールと操作方法を表示する
20. The Game System shall 現在選択可能なアクションを常に明示する

**パフォーマンスとレスポンス**
21. The Game System shall プレイ実行から結果表示までの応答時間を1秒以内に保つ
22. When プレイヤーが指示を選択する、the Game System shall 即座に受け付け処理を開始する
23. The Game System shall テキスト表示速度を調整可能にする（即座表示/逐次表示）
24. The Game System shall 長いテキスト出力は適度に区切り「Enterで続行」を表示する
25. The Game System shall プレイのテンポを維持し待機時間を最小化する

**アクセシビリティとカスタマイズ**
26. The Game System shall 表示言語を設定可能にする（日本語/英語など）
27. When プレイヤーが表示設定を変更する、the Game System shall 設定を保存し次回起動時に適用する
28. The Game System shall コンソール/ターミナルの幅に応じてレイアウトを調整する
29. If 表示環境が色表示に非対応である、then the Game System shall 記号や罫線のみで情報を表現する
30. The Game System shall プレイヤーが難易度（選手能力の幅、乱数の振れ幅）を設定できるオプションを提供する

### Requirement 8: 試合履歴と戦績管理
**Objective:** プレイヤー（監督）として、過去の試合結果を振り返りたい、自分の監督成績や戦術の効果を分析できるようにするため

#### Acceptance Criteria

**試合結果の記録と保存**
1. When 試合が正常終了する、the Game System shall 試合結果（試合ID、日時、対戦相手、最終スコア、勝敗、試合時間）を自動的に永続化する
2. The Game System shall 各試合のイニング別得点を詳細データとして保存する
3. When 試合が保存される、the Game System shall 主要なプレイイベント（得点シーン、投手交代、サヨナラなど）をハイライトとして記録する
4. The Game System shall 試合データをJSON形式またはデータベース形式で構造化して保存する
5. When 保存処理が完了する、the Game System shall 「試合結果を保存しました」と確認メッセージを表示する

**履歴一覧の表示**
6. When プレイヤーがメインメニューで「試合履歴」を選択する、the Game System shall 過去の試合一覧を新しい順（降順）に表示する
7. The Game System shall 履歴一覧に各試合の日付、対戦相手、スコア、勝敗を表形式で表示する
8. When 履歴が10件を超える、the Game System shall ページネーション機能を提供する
9. When プレイヤーがページを切り替える、the Game System shall 前の10件/次の10件を表示する
10. The Game System shall 履歴一覧で勝利試合と敗北試合を色分けまたは記号で区別する

**試合詳細の閲覧**
11. When プレイヤーが履歴一覧から特定の試合を選択する、the Game System shall その試合の詳細画面に遷移する
12. When 試合詳細が表示される、the Game System shall 最終スコア、イニング別得点表、試合時間、総安打数を表示する
13. The Game System shall 試合詳細画面に主要プレイのハイライト（タイムリーヒット、ホームラン、投手交代）を時系列で表示する
14. When プレイヤーが詳細ログを要求する、the Game System shall その試合の全プレイ履歴を表示する
15. When プレイヤーが詳細画面から戻る、the Game System shall 履歴一覧に戻る

**通算戦績の集計と表示**
16. The Game System shall 全試合の戦績を集計し総試合数、勝利数、敗北数、引き分け数を計算する
17. The Game System shall 勝率を計算し小数点第3位まで表示する（例：.667）
18. When プレイヤーが戦績画面を開く、the Game System shall 通算成績を見やすくサマリー形式で表示する
19. The Game System shall 最高得点試合、最低失点試合などの記録を「自己ベスト」として表示する
20. The Game System shall 連勝記録、連敗記録を追跡し表示する

**フィルタリングと検索機能**
21. When プレイヤーが戦績フィルタを選択する、the Game System shall 期間指定（過去7日間、過去30日間、全期間）のオプションを表示する
22. When プレイヤーが期間フィルタを適用する、the Game System shall 指定期間内の試合のみを抽出し表示する
23. When プレイヤーが勝敗フィルタを適用する、the Game System shall 勝利試合のみ/敗北試合のみを表示する
24. When プレイヤーが対戦相手で検索する、the Game System shall 特定チームとの対戦成績を抽出表示する
25. The Game System shall フィルタ適用後も通算成績を再計算し表示する

**データの永続化と管理**
26. The Game System shall 履歴データをローカルファイルシステム（例：`~/.baseball_game/history.json`）に保存する
27. When ゲームが起動される、the Game System shall 保存された履歴データを自動的に読み込み復元する
28. If 履歴ファイルが破損している、then the Game System shall エラーを表示し空の履歴からスタートする
29. When 履歴データが存在しない、the Game System shall 新規に履歴ファイルを作成する
30. The Game System shall データのバックアップ機能を提供し手動でエクスポートできるようにする

**履歴の削除と圧縮**
31. When 履歴が100試合を超える、the Game System shall 「古い履歴を整理しますか？」と確認メッセージを表示する
32. When プレイヤーが履歴削除を選択する、the Game System shall 削除する試合の範囲（全て、特定期間、選択した試合）を確認する
33. When プレイヤーが削除を確定する、the Game System shall 該当する履歴を削除し通算成績を再計算する
34. The Game System shall 履歴削除前に「この操作は取り消せません」と警告する
35. When 大量の履歴データがある、the Game System shall 古い試合の詳細ログを圧縮しサマリーのみを保持するオプションを提供する

**統計とトレンド分析**
36. The Game System shall 最近10試合の勝率を計算し「最近の調子」として表示する
37. When 戦績画面が表示される、the Game System shall 得点力（1試合平均得点）と防御力（1試合平均失点）を計算表示する
38. The Game System shall 最も使用した戦術（バント回数、盗塁回数など）を統計として表示する
39. When プレイヤーが統計画面を開く、the Game System shall グラフまたはテキストベースのチャートで戦績推移を表示する
40. The Game System shall 対戦相手別の勝率を集計しランキング形式で表示する

### Requirement 9: 選手とチームのデータ管理
**Objective:** プレイヤーとして、カスタム選手とチームを作成・編集したい、自分好みの野球ゲーム体験をカスタマイズできるようにするため

#### Acceptance Criteria

**選手データの初期化とデフォルト提供**
1. When アプリが初回起動される、the Game System shall `data/default_players.json` から30人以上のデフォルト選手データをロードする
2. The Game System shall デフォルト選手データに両リーグの代表的な選手タイプ（パワーヒッター、俊足、技巧派投手など）を含める
3. When 選手データをロードする、the Game System shall 全能力値が1-100範囲内であることをバリデートする
4. If 選手データのバリデーションエラーが発生する、then the Game System shall エラー詳細（選手名、能力名、無効な値）を表示し、該当選手をスキップする
5. The Game System shall ロード成功時に「○○人の選手をロードしました」と確認メッセージを表示する

**選手一覧と検索機能**
6. When プレイヤーがメインメニューで「選手管理」を選択する、the Game System shall 全選手の一覧を表示する
7. The Game System shall 選手一覧に選手名、ポジション、総合評価（OVR）、所属チームを表示する
8. When プレイヤーが検索フィルタを適用する、the Game System shall ポジション、チーム、能力値範囲で絞り込みを実行する
9. When プレイヤーが並び替えを選択する、the Game System shall 名前、ポジション、総合評価の昇順/降順で並び替える
10. The Game System shall 一覧表示に50人ずつのページネーション機能を提供する

**選手の詳細表示**
11. When プレイヤーが選手一覧から選手を選択する、the Game System shall 選手詳細画面に遷移する
12. When 選手詳細が表示される、the Game System shall OOTP26準拠の全85能力値を分類表示する（打撃10項目、投手10項目、走塁7項目、守備9項目など）
13. The Game System shall 各能力値を色分けで表示する（青=90+、緑=70-89、黄=50-69、橙=30-49、赤=1-29）
14. When 選手詳細画面が表示される、the Game System shall 「編集」「削除」「戻る」のボタンを提供する
15. When プレイヤーが「戻る」を選択する、the Game System shall 選手一覧に戻る

**選手の新規作成**
16. When プレイヤーが選手一覧で「新規作成」を選択する、the Game System shall 選手作成フォームを表示する
17. When 選手作成フォームが表示される、the Game System shall 必須項目（名前、ポジション）と能力値入力フィールドを提供する
18. The Game System shall 各能力値にスライダー（1-100）または数値入力を提供する
19. When プレイヤーが能力値を変更する、the Game System shall リアルタイムで総合評価（OVR）を再計算し表示する
20. The Game System shall デフォルト値として全能力値を50（平均）に設定する
21. When プレイヤーが「ランダム生成」を選択する、the Game System shall 指定ポジションに適した能力値をランダムに生成する
22. When プレイヤーが「保存」を選択する、the Game System shall 選手データをバリデートし、有効な場合はデータベースに保存する
23. If 必須項目が未入力である、then the Game System shall 「○○を入力してください」とエラー表示し保存を拒否する
24. When 選手が正常に保存される、the Game System shall 「選手を作成しました（ID: ○○）」と確認メッセージを表示する

**選手の編集**
25. When プレイヤーが選手詳細で「編集」を選択する、the Game System shall 選手編集フォームを表示する
26. When 選手編集フォームが表示される、the Game System shall 現在の能力値をフォームに事前入力する
27. When プレイヤーが能力値を変更する、the Game System shall 変更前との差分を強調表示する（例：「Contact: 75 → 80 (+5)」）
28. When プレイヤーが「保存」を選択する、the Game System shall 変更内容を確認ダイアログで表示する
29. When プレイヤーが変更を確定する、the Game System shall データベースを更新し「選手を更新しました」と表示する
30. When プレイヤーが「キャンセル」を選択する、the Game System shall 変更を破棄し選手詳細に戻る

**選手の削除**
31. When プレイヤーが選手詳細で「削除」を選択する、the Game System shall 「本当に削除しますか？この操作は取り消せません」と確認ダイアログを表示する
32. When プレイヤーが削除を確定する、the Game System shall データベースから選手を削除する
33. If 削除対象の選手が既に試合で使用されている、then the Game System shall 「この選手は試合履歴に含まれています。削除しますか？」と追加警告を表示する
34. When 選手が削除される、the Game System shall 「選手を削除しました」と表示し選手一覧に戻る

**チーム管理機能**
35. When プレイヤーが「チーム管理」を選択する、the Game System shall 全チームの一覧を表示する
36. When プレイヤーが「新規チーム作成」を選択する、the Game System shall チーム作成フォーム（チーム名、略称、ホームスタジアム）を表示する
37. When プレイヤーがチームを選択する、the Game System shall チーム詳細（ロースター、デフォルト打順）を表示する
38. When プレイヤーが「ロースター編集」を選択する、the Game System shall 選手の追加/削除インターフェースを提供する
39. The Game System shall チームに最低9人の野手と2人の投手を要求する
40. When ロースターが編集される、the Game System shall 「変更を保存しました」と確認メッセージを表示する

**データのインポート/エクスポート**
41. When プレイヤーが「データエクスポート」を選択する、the Game System shall エクスポート対象（全選手、特定チーム、選択した選手）を選択させる
42. When エクスポート対象が選択される、the Game System shall JSON形式でファイルに出力する
43. The Game System shall エクスポートファイル名に日時を含める（例：`players_export_2026-01-31.json`）
44. When エクスポートが完了する、the Game System shall 「○○人の選手を ~/baseball_game/exports/ にエクスポートしました」と表示する
45. When プレイヤーが「データインポート」を選択する、the Game System shall ファイル選択ダイアログを表示する
46. When インポートファイルが選択される、the Game System shall JSONフォーマットをバリデートする
47. If インポートファイルが無効な形式である、then the Game System shall 「ファイル形式が正しくありません」とエラー表示する
48. When インポートデータが有効である、the Game System shall 既存データとの重複チェックを実行する
49. If 同名の選手が存在する、then the Game System shall 「上書き」「スキップ」「名前を変更して追加」のオプションを提示する
50. When インポートが完了する、the Game System shall 「○○人の選手をインポートしました（スキップ: ○人）」と表示する

**テンプレートとプリセット機能**
51. The Game System shall 選手作成時に「テンプレート選択」機能を提供する
52. When プレイヤーが「テンプレート選択」を開く、the Game System shall プリセット（パワーヒッター、俊足、エース投手、クローザーなど）を表示する
53. When プレイヤーがテンプレートを選択する、the Game System shall 該当タイプの典型的な能力値をフォームに設定する
54. The Game System shall カスタムテンプレートの保存機能を提供する
55. When プレイヤーがカスタムテンプレートを保存する、the Game System shall テンプレート名を入力させ `~/.baseball_game/templates/` に保存する

**バッチ編集機能**
56. When プレイヤーが選手一覧で複数選手を選択する、the Game System shall 「バッチ編集」ボタンを有効化する
57. When プレイヤーが「バッチ編集」を選択する、the Game System shall 一括操作メニュー（チーム変更、能力値補正、削除）を表示する
58. When バッチで能力値補正が選択される、the Game System shall 全選手に対して一律の増減（例：「全能力+5」）を適用する
59. When バッチ操作が実行される、the Game System shall 影響を受ける選手数を事前に表示し確認を求める
60. When バッチ操作が完了する、the Game System shall 「○○人の選手を更新しました」と表示する

**データ整合性とバックアップ**
61. The Game System shall 選手データの変更前に自動バックアップを作成する
62. The Game System shall バックアップを `~/.baseball_game/backups/` に日時付きで保存する
63. The Game System shall 最大10世代のバックアップを保持し、古いものから自動削除する
64. When プレイヤーが「バックアップから復元」を選択する、the Game System shall 利用可能なバックアップ一覧を表示する
65. When バックアップが選択される、the Game System shall 「現在のデータは失われます。復元しますか？」と確認する
66. When 復元が確定される、the Game System shall バックアップからデータを復元し「データを復元しました」と表示する
67. The Game System shall データベース整合性チェック機能を提供し、起動時に自動実行する
68. If データベース破損が検出される、then the Game System shall 最新のバックアップから自動復元を試みる

**ヘルプとドキュメント**
69. When プレイヤーが選手管理画面で「ヘルプ」を選択する、the Game System shall 選手作成ガイドを表示する
70. The Game System shall ヘルプに各能力値の説明とゲームへの影響を記載する
71. The Game System shall JSON形式のサンプルファイルを `data/sample_player.json` として提供する
72. When プレイヤーが「能力値ガイド」を開く、the Game System shall OOTP26準拠の能力値説明を表示する
