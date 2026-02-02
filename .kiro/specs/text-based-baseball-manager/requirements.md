# Requirements Document

## Project Description (Input)
プレイヤーが監督となってプレイ毎に指示を出し勝利を目指す、ブラウザで動作するWebアプリケーションの野球ゲーム

## Introduction
本ドキュメントは、ブラウザで動作するWebアプリケーションの野球監督シミュレーションゲームの要件を定義します。プレイヤーは監督として試合中のプレイ毎に戦術的指示を出し、チームを勝利に導きます。

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
7. When 表の攻撃が始まる、the Game System shall 攻撃側の打順トップから打席に入れ、打者がアウトになった場合は打席を終えて次の打者を打席に立たせる（攻撃が継続している場合）
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

**打撃結果の詳細判定：打席結果の第一段階**
6. When 通常打撃が実行される、the Game System shall まず投手と打者の対決結果を判定する：「三振」「四球」「インプレー（打球発生）」のいずれかを選択する
7. When 投手と打者の対決を判定する、the Game System shall 投手のStuffとControl、打者のContactとEye/Discipline、Avoid K'sを総合評価する
8. When 三振の発生率を判定する、the Game System shall 投手のStuff値と打者のAvoid K's値の差分に応じて漸進的に補正する：（Stuff - Avoid K's）× 0.4%の補正を適用する
9. When 四球の発生率を判定する、the Game System shall 打者のEye/Discipline値と投手のControl値の差分に応じて漸進的に補正する：（Eye/Discipline - Control）× 0.5%の補正を適用する
10. When 三振が選択される、the Game System shall 打者をアウトとして処理し、守備判定をスキップする
11. When 四球が選択される、the Game System shall 打者を一塁に出塁させ、守備判定をスキップする
12. When インプレーが選択される、the Game System shall 打球種類と打球方向の判定に進む

**打撃結果の詳細判定：打球種類の決定**
13. When インプレーが発生する、the Game System shall 打球種類を「ゴロ」「フライ」「ライナー」のいずれかに決定する
14. When 打球種類を判定する、the Game System shall 投手のGround Ball %、打者のContact能力、Gap/HR Powerを総合評価する
15. When ゴロの発生率を判定する、the Game System shall 投手のGround Ball %値に応じて漸進的に補正する：（Ground Ball % - 50）× 0.35%の補正を適用する
16. When フライの発生率を判定する、the Game System shall 打者のHR Power値に応じて漸進的に補正する：（HR Power - 50）× 0.25%の補正を適用する
17. When ライナーの発生率を判定する、the Game System shall 打者のContact値とGap Power値の平均に応じて漸進的に補正する：（（Contact + Gap Power）/ 2 - 60）× 0.2%の補正を適用する
18. The Game System shall デフォルト打球種類分布を以下に設定する：ゴロ45%、フライ35%、ライナー20%

**打撃結果の詳細判定：打球方向と強さの決定**
19. When 打球種類が決定される、the Game System shall 打球の飛んだ方向を9つのゾーン（「三塁線」「三遊間」「遊撃正面」「二遊間」「一二塁間」「一塁線」「左翼方向」「中堅方向」「右翼方向」）から確率的に決定する（詳細な守備位置特定はAcceptance Criteria 284-304を参照）
20. When 打球方向を決定する、the Game System shall 打者の利き手（左/右）、打者の打球傾向、投手の投球に基づいて各方向の発生確率を調整する
21. When 打者が左打者である、the Game System shall 引っ張り方向（右翼/一二塁間/一塁線）の合計確率を45%、中央方向（中堅/遊撃正面/二遊間）を35%、流し打ち方向（左翼/三遊間/三塁線）を20%に設定する
22. When 打者が右打者である、the Game System shall 引っ張り方向（左翼/三遊間/三塁線）の合計確率を45%、中央方向（中堅/遊撃正面/二遊間）を35%、流し打ち方向（右翼/一二塁間/一塁線）を20%に設定する
23. When 打球の強さを判定する、the Game System shall 打者のContact、Gap Power、HR Power、投手のStuffとMovementを評価し、「弱い」「中程度」「強い」の3段階に分類する
24. When 打球が「強い」と判定される、the Game System shall 打者の総合パワー値（（Gap Power + HR Power）/ 2）に応じて守備処理の難易度と長打の発生確率を漸進的に上昇させる：（総合パワー - 50）× 0.3%の補正を適用する
25. When 打球が「弱い」と判定される、the Game System shall 打者の総合パワー値の逆数に応じて内野安打の発生確率を漸進的に上昇させ長打の発生確率を低下させる：（50 - 総合パワー）× 0.25%の補正を適用する

**打撃結果の詳細判定：守備判定への接続**
26. When 打球種類、方向、強さが決定される、the Game System shall 守備プレイとアウトの判定（Acceptance Criteria 28以降）に処理を引き継ぐ
27. When 守備判定が完了しヒットが確定する、the Game System shall ヒットの種類（単打/二塁打/三塁打/本塁打）を判定する
28. When ヒットの種類を判定する、the Game System shall 打球の種類、方向、強さ、打者のGap PowerとHR Power、守備選手の追跡結果を総合評価する
29. When 外野フライが外野手の守備範囲を大きく超える、the Game System shall 本塁打として処理する
30. When 外野ライナーまたは強いフライが外野の深い位置に落ちる、the Game System shall 二塁打または三塁打として処理する
31. When 三塁打を判定する、the Game System shall 打者のSpeed（走力）値に応じて三塁打確率を漸進的に上昇させる：（Speed - 60）× 0.5%の補正を適用する
32. When 打球が弱く内野を抜ける、the Game System shall 単打として処理する
33. When 打者のSpeed（走力）が高く弱いゴロを打つ、the Game System shall Speed値に応じて内野安打の確率を漸進的に上昇させる：（Speed - 60）× 0.4%の補正を適用する

**打撃結果の詳細判定：投手・打者状態による補正**
34. When 投手の疲労度が高い、the Game System shall 以下の累積的な減衰を適用する：
    - 基本減衰：投球数に応じた漸進的減衰として、Stuff減衰率 = （投球数 - 50）× 0.15%、Control減衰率 = （投球数 - 50）× 0.2%を計算
    - 疲労段階補正：投球数が76-100球（疲労状態）の場合は追加でStuff -5～10%、Control -10～15%を適用
    - 限界段階補正：投球数が101球以上（限界状態）の場合は追加でStuff -15～20%、Control -20～25%を適用
    - 最終能力値 = 基本能力値 × (1 - 基本減衰率) × (1 - 疲労段階補正率) × (1 - 限界段階補正率)
35. When 打者のコンディションが好調である、the Game System shall コンディションレベルに応じて打撃能力値を漸進的に上昇させる：好調度1段階につき全打撃能力値を2.5%上昇させる
36. When 打者のコンディションが不調である、the Game System shall コンディションレベルに応じて打撃能力値を漸進的に低下させる：不調度1段階につき全打撃能力値を3%低下させる
37. When 投手と打者の左右の組み合わせが同じ（右投手vs右打者、左投手vs左打者）、the Game System shall 打者の打撃能力値に対左右能力補正を適用する

**バント系プレイの判定：バント打球の方向決定**
38. When バント指示が出される、the Game System shall 打者のSacrifice Bunt（犠打バント能力）を基準として成功率を計算する
39. When セーフティバントが試みられる、the Game System shall 打者のBunt for Hit（セーフティバント能力）とSpeed（走力）を組み合わせて成功率を計算する
40. When バント打球が発生する、the Game System shall バント打球の方向を「三塁線沿い」「投手正面」「一塁線沿い」のいずれかに決定する
41. When 左打者がバントする、the Game System shall 一塁線沿いの確率を50%、投手正面を30%、三塁線沿いを20%に設定する（一塁に近いため）
42. When 右打者がバントする、the Game System shall 三塁線沿いの確率を40%、投手正面を35%、一塁線沿いを25%に設定する
43. When セーフティバントが試みられる、the Game System shall 打者のBunt for Hit値に応じて逆方向（左打者は三塁線、右打者は一塁線）の確率を漸進的に上昇させる：（Bunt for Hit - 50）× 0.2%の補正を適用する

**バント系プレイの判定：守備選手の特定と処理**
44. When バント打球が「三塁線沿い」に転がる、the Game System shall 三塁手（3B）を主担当守備選手、投手（P）を補助担当守備選手として特定する
45. When バント打球が「投手正面」に転がる、the Game System shall 投手（P）を主担当守備選手、捕手（C）を補助担当守備選手として特定する
46. When バント打球が「一塁線沿い」に転がる、the Game System shall 一塁手（1B）を主担当守備選手、投手（P）を補助担当守備選手として特定する
47. When バント打球の強さが「弱い」である、the Game System shall 捕手（C）も守備処理に参加可能とし、捕手のInfield Rangeで判定する
48. When バント打球が処理される、the Game System shall 主担当守備選手のInfield Range（内野守備範囲）で打球に追いつけるかを判定する
49. When 主担当守備選手が追いつけない、the Game System shall 補助担当守備選手のInfield Rangeで判定する
50. When どの守備選手も追いつけない、the Game System shall セーフティバント成功として打者を出塁させる
51. When 守備選手が打球に追いつく、the Game System shall その守備選手のInfield Armと一塁手のInfield Error、打者のSpeed（走力）を総合評価してセーフ/アウトを判定する
52. When 捕球した守備選手の送球時間を判定する、the Game System shall Infield Arm値に応じて漸進的に補正する：送球時間補正 = （60 - Infield Arm）× 0.006秒、セーフ確率補正 = （60 - Infield Arm）× 0.5%を適用する
53. When 打者のバント成功率を判定する、the Game System shall Speed値に応じて漸進的に上昇させる：（Speed - 60）× 0.3%の補正を適用する
54. When 左打者がバントする、the Game System shall AC 31で定義された補正として、一塁到達時間を-0.2秒短縮し、この時間短縮効果によりセーフ確率が+10%上昇する（5-10%範囲の明確化として10%に統一）

**バント系プレイの判定：犠打バントとランナー進塁**
55. When 犠打バントが成功する、the Game System shall 打者をアウトにし、全ランナーを1塁分進塁させる
56. When 犠打バントで守備選手がランナーをアウトにしようとする、the Game System shall 守備選手の判断（一塁を狙う/進塁ランナーを狙う）を試合状況に応じて決定する
57. When ノーアウトまたはワンアウトでランナーが二塁にいる、the Game System shall 守備選手が確実に一塁アウトを狙う確率を80%に設定する
58. When ランナーが一塁のみでツーアウトである、the Game System shall 守備選手が二塁封殺を狙う確率を40%に設定する
59. When 守備選手が二塁封殺を狙う、the Game System shall 捕球した守備選手のInfield Armと二塁ベースカバー選手のInfield Error、ランナーのSpeedを評価して封殺成否を判定する
60. When 二塁封殺が失敗する、the Game System shall 全走者セーフ（打者含む）として処理する

**バント系プレイの判定：スクイズプレイ**
61. When スクイズが試みられる、the Game System shall 打者のSacrifice Bunt能力、三塁ランナーのSpeed（走力）とBaserunning（走塁技術）を評価する
62. When スクイズでバント打球が発生する、the Game System shall バント打球の処理を通常バントと同様に実行する
63. When スクイズでバント打球が処理される、the Game System shall 守備選手が本塁送球を試みるかを判定する
64. When 守備選手が本塁送球を試みる、the Game System shall 捕球した守備選手のInfield Armと捕手のCatcher Ability、三塁ランナーのSpeedを評価して本塁アウトの可否を判定する
65. When 本塁アウト確率を判定する、the Game System shall 守備選手のInfield Armと捕手のCatcher Abilityの平均値に応じて漸進的に補正する：（（Infield Arm + Catcher Ability）/ 2 - 60）× 0.4%の補正を適用する
66. When スクイズ成功率を判定する、the Game System shall 三塁ランナーのSpeed値に応じて漸進的に上昇させる：（Speed - 60）× 0.35%の補正を適用する
67. When スクイズが成功する、the Game System shall 三塁ランナーを得点させ、打者をアウトまたはセーフにする（バント処理の結果に応じて）
68. If スクイズが失敗しバントミスが発生する、then the Game System shall 三塁ランナーを本塁でアウトにするリスクを適用する（失敗確率30-50%）

**バント系プレイの判定：バント失敗**
69. When バント指示が出されバント動作に失敗する、the Game System shall 打者のSacrifice BuntまたはBunt for Hit能力に基づいて失敗確率を計算する
70. When バントが失敗する、the Game System shall ファウル、空振り、または打ち損じによる凡フライとして処理する
71. When カウントが2ストライクでバントがファウルになる、the Game System shall 打者を三振アウトとして処理する
72. When バントの打ち損じで凡フライが上がる、the Game System shall 捕手（C）または投手（P）を守備選手として特定し、通常のフライ処理を実行する

**走塁プレイの判定：盗塁の試行**
118. When 盗塁が試みられる、the Game System shall ランナーのSpeed（走力）とStealing Ability（盗塁能力）を基本成功率として評価する
119. When 投手が投球動作に入る、the Game System shall 投手のHold Runners（牽制能力）を使用してランナーのスタート遅延確率を判定する
120. When 投手のHold Runnersによる盗塁阻止を判定する、the Game System shall Hold Runners値に応じて漸進的に補正する：（Hold Runners - 60）× 0.4%のスタート遅延確率上昇と（Hold Runners - 60）× 0.35%の盗塁成功率低下を適用する
121. When ランナーのStealing Abilityによる盗塁成功率を判定する、the Game System shall Stealing Ability値に応じて漸進的に上昇させる：（Stealing Ability - 60）× 0.45%の補正を適用する

**走塁プレイの判定：捕手の送球と塁上での処理**
123. When ランナーがスタートを切る、the Game System shall 捕手が盗塁を察知し送球を試みる
124. When 捕手が送球する、the Game System shall 捕手のCatcher Arm（捕手肩力）を使用して送球時間と精度を評価する
125. When 捕手の送球時間と盗塁阻止確率を判定する、the Game System shall Catcher Arm値に応じて漸進的に補正する：送球時間補正 = （70 - Catcher Arm）× 0.004秒、盗塁阻止確率補正 = （Catcher Arm - 60）× 0.45%を適用する
126. When 二塁盗塁が試みられる、the Game System shall 二塁ベースカバー選手（二塁手または遊撃手）を特定する
127. When 三塁盗塁が試みられる、the Game System shall 三塁手を塁上の守備選手として特定する
128. When 塁上の守備選手が送球を受ける、the Game System shall その守備選手のInfield Errorを使用して捕球とタッチプレイの成否を判定する
129. When タッチプレイ成功率を判定する、the Game System shall 塁上守備選手のInfield Error値に応じて漸進的に補正する：（Infield Error - 75）× 0.25%の補正を適用する

**走塁プレイの判定：盗塁の最終判定**
132. When 盗塁の最終判定を行う、the Game System shall ランナーのSpeed、Stealing Ability、投手のHold Runners、捕手のCatcher Arm、塁上守備選手のInfield Errorを総合評価する
133. When 盗塁が成功する、the Game System shall ランナーを次の塁に進め、「○○選手、盗塁成功！」と実況表示する
134. When 盗塁が失敗する、the Game System shall ランナーをアウトにしアウトカウントを増加させ、「△△選手、盗塁失敗！タッチアウト！」と実況表示する
135. When 捕手の送球が悪送球となる、the Game System shall ランナーを確実にセーフとし、追加進塁のチャンスを与える

**走塁プレイの判定：ダブルスチール（二重盗塁）**
136. When ダブルスチール（一塁と三塁、または一塁と二塁）が試みられる、the Game System shall 両ランナーのSpeed平均とStealing Ability平均を基本成功率として評価する
137. When 捕手が送球先を選択する、the Game System shall 試合状況（アウトカウント、点差）に応じて前の塁（三塁）または後ろの塁（二塁）を選択する
138. When 接戦（2点差以内）で三塁ランナーがいる、the Game System shall 捕手が三塁送球を優先する確率を70%に設定する
139. When 点差が大きい（5点差以上）、the Game System shall 捕手が二塁送球を優先する確率を70%に設定する
140. When 捕手が三塁送球を選択する、the Game System shall 三塁手のInfield Errorを使用してタッチプレイを判定し、二塁ランナーは確実にセーフとする
141. When 捕手が二塁送球を選択する、the Game System shall 二塁ベースカバー選手のInfield Errorを使用してタッチプレイを判定し、三塁ランナーは確実にセーフとする
142. When ダブルスチールが成功する、the Game System shall 「ダブルスチール成功！」と実況表示する

**走塁プレイの判定：エンドラン**
143. When エンドランが実行される、the Game System shall ランナーが打撃と同時にスタートを切る
144. When エンドランで打者が空振りまたは見逃す、the Game System shall 通常の盗塁判定を実行する（捕手の送球判定を含む）
145. When エンドランで打者がゴロを打つ、the Game System shall ランナーのSpeed（走力）とBaserunning（走塁技術）の平均値に応じて進塁成功率を漸進的に上昇させる：（（Speed + Baserunning）/ 2 - 50）× 0.4%の補正を適用する
146. When エンドランでゴロが内野に転がる、the Game System shall ランナーのBaserunning値に応じてダブルプレー回避確率を漸進的に上昇させる：（Baserunning - 50）× 0.5%の補正を適用する
147. When エンドランで打者がフライを打つ、the Game System shall ランナーが途中で止まり塁に戻る必要があり、追加進塁の機会を失う
148. When エンドランで打者がヒットを打つ、the Game System shall ランナーの進塁を通常より1塁分多く進める（一塁→三塁、二塁→本塁）
149. When エンドランでヒットが出る、the Game System shall 「エンドラン成功！○○選手が大きく進塁！」と実況表示する

**走塁プレイの判定：牽制プレイ**
150. When ランナーが塁上にいる、the Game System shall 投手が牽制を試みる確率を投手のHold Runnersに基づいて決定する：（Hold Runners - 50）× 0.4%の牽制試行確率を適用する
151. When 投手が牽制を試みる、the Game System shall ランナーのBaserunning（走塁技術）とSpeed（走力）を使用してリード幅を評価する
152. When 牽制アウト確率を判定する、the Game System shall ランナーのBaserunning値に応じて漸進的に補正する：（70 - Baserunning）× 0.4%の補正を適用する
154. When 投手が牽制球を投げる、the Game System shall 投手のHold Runnersと塁上守備選手のInfield Error、ランナーのSpeedを総合評価する
155. When 牽制が成功する、the Game System shall ランナーをアウトとし、「牽制アウト！」と実況表示する
156. When 牽制球が悪送球となる、the Game System shall ランナーに追加進塁のチャンスを与える

**ランナー進塁の判定：基本進塁ルール**
73. When ヒットが出る、the Game System shall 打球の種類（単打/二塁打/三塁打/本塁打）、打球方向、塁上のランナー位置を評価する
74. When 本塁打が出る、the Game System shall 打者と全ランナーを得点させ、進塁判定をスキップする
75. When 単打が出る、the Game System shall 一塁ランナーは二塁へ、二塁ランナーは三塁へ確実に進塁させる
76. When 二塁打が出る、the Game System shall 一塁ランナーは三塁へ、二塁ランナーは本塁へ確実に進塁させる
77. When 三塁打が出る、the Game System shall 全ランナーを得点させる

**ランナー進塁の判定：単打での三塁ランナー本塁到達**
78. When 単打で三塁ランナーが本塁を狙う、the Game System shall 打球方向に応じた外野手を特定し、その外野手のOutfield Armを評価する
79. When 単打が浅い外野に落ちる、the Game System shall 外野手の捕球位置から本塁までの距離を「近い」と判定し、本塁送球の脅威を+30%上昇させる
80. When 単打が深い外野に落ちる、the Game System shall 外野手の捕球位置から本塁までの距離を「遠い」と判定し、三塁ランナーの本塁到達確率を+40%上昇させる
81. When 外野手のOutfield Armによる送球阻止を判定する、the Game System shall Outfield Arm値に応じて本塁到達成功率を漸進的に補正する：（60 - Outfield Arm）× 0.4%の補正を適用する
82. When 三塁ランナーのSpeed（走力）による本塁到達を判定する、the Game System shall Speed値に応じて成功率を漸進的に上昇させる：（Speed - 60）× 0.35%の補正を適用する
83. When 三塁ランナーのBaserunning（走塁技術）による本塁到達を判定する、the Game System shall Baserunning値に応じて成功率を漸進的に上昇させる：（Baserunning - 60）× 0.25%の補正を適用する
84. When 外野手が本塁に送球する、the Game System shall 捕手のCatcher Abilityを使用してタッチプレイの成否を判定する
85. When 捕手のタッチアウト成功率を判定する、the Game System shall Catcher Ability値に応じて漸進的に補正する：（Catcher Ability - 60）× 0.3%の補正を適用する

**ランナー進塁の判定：単打での追加進塁（一塁→三塁、二塁→本塁）**
87. When 単打で一塁ランナーが三塁への追加進塁を試みる、the Game System shall ランナーのSpeed（走力）とBaserunning（走塁技術）の平均値に応じて試行判定する：（（Speed + Baserunning）/ 2 - 65）× 1.5%の試行確率を適用する
88. When 追加進塁を試みる条件を満たさない、the Game System shall 追加進塁を試みず二塁で止まる
89. When 追加進塁を試みる、the Game System shall 打球を処理した外野手のOutfield Armと中継内野手（通常は遊撃手または二塁手）のInfield Arm、三塁手のInfield Errorを総合評価する
90. When 追加進塁阻止確率を判定する、the Game System shall 外野手のOutfield Armと中継内野手のInfield Armの平均値に応じて漸進的に補正する：（（Outfield Arm + Infield Arm）/ 2 - 60）× 0.5%の補正を適用する
91. When ランナーの追加進塁成功率を判定する、the Game System shall Speed値に応じて漸進的に上昇させる：（Speed - 70）× 0.4%の補正を適用する
92. When 単打で二塁ランナーが本塁への追加進塁を試みる、the Game System shall 外野手のOutfield Armと中継内野手のInfield Arm、捕手のCatcher Abilityを総合評価する
93. When 外野手の捕球位置が浅い、the Game System shall 追加進塁を試みる確率を-50%低下させる（リスクが高いため）

**ランナー進塁の判定：二塁打での一塁ランナー本塁到達**
94. When 二塁打で一塁ランナーが本塁を狙う、the Game System shall ランナーのSpeed（走力75+）とBaserunning（走塁技術70+）を評価する
95. When 二塁打が外野フェンス際まで飛ぶ、the Game System shall 外野手の捕球位置が遠いため、ランナーの本塁到達確率を+50%上昇させる
96. When 二塁打が浅い位置に落ちる、the Game System shall ランナーの本塁到達を試みない（リスクが高すぎるため）
97. When 外野手が中継プレイを実行する、the Game System shall 外野手のOutfield Arm、中継内野手のInfield ArmとInfield Error、捕手のCatcher Abilityを段階的に評価する
98. When 中継プレイの第一送球（外野→内野）が失敗する、the Game System shall ランナーを確実に本塁到達させる
99. When 中継プレイの第二送球（内野→本塁）が失敗する、the Game System shall ランナーを確実に本塁到達させる
100. When 両方の送球が成功する、the Game System shall ランナーのSpeed、Baserunning、捕手のCatcher Abilityでタッチプレイの成否を最終判定する

**ランナー進塁の判定：外野手の送球先選択**
101. When ヒットで複数のランナーが進塁する、the Game System shall 外野手が送球する塁を試合状況に応じて決定する
102. When 三塁ランナーが本塁を狙い、一塁ランナーが三塁を狙う、the Game System shall 外野手は本塁送球を優先する（得点阻止が最優先のため）
103. When 得点差が大きい（5点差以上）、the Game System shall 外野手は前の塁（本塁より二塁または三塁）への送球を優先する（確実なアウトを狙うため）
104. When 接戦（2点差以内）で7回以降である、the Game System shall 外野手は本塁送球を優先する（得点阻止が重要なため）
105. When 外野手が二塁送球を選択する、the Game System shall 二塁ベースカバー選手（二塁手または遊撃手）のInfield Errorを使用して送球受け取り判定を行う
106. When 外野手が三塁送球を選択する、the Game System shall 三塁手のInfield Errorを使用して送球受け取り判定を行う
107. When 送球が悪送球となる、the Game System shall 全ランナーに追加進塁のチャンスを与える

**ランナー進塁の判定：中継プレイの詳細**
108. When 外野深くに打球が飛び中継プレイが必要、the Game System shall 中継位置に入る内野手（通常は遊撃手または二塁手）を特定する
109. When 中継プレイが実行される、the Game System shall 第一送球として外野手のOutfield Armを評価し、中継内野手への送球精度を判定する
110. When 第一送球が成功する、the Game System shall 第二送球として中継内野手のInfield Armを評価し、目標塁への送球精度を判定する
111. When 中継プレイの効率を判定する、the Game System shall 中継内野手のInfield Range値に応じて漸進的に補正する：（Infield Range - 60）× 0.3%の補正を適用する
112. When 第二送球の速度と精度を判定する、the Game System shall 中継内野手のInfield Arm値に応じて漸進的に補正する：（Infield Arm - 60）× 0.35%の補正を適用する
113. When 中継プレイで任意の段階が失敗する、the Game System shall ランナーに1-2塁分の追加進塁を与える

**ランナー進塁の判定：タイムリーヒットと得点処理**
114. When ランナーが本塁に到達する、the Game System shall 得点を加算しスコアボードを更新する
115. When タイムリーヒットが発生する、the Game System shall 「○○選手のタイムリーヒット！△△選手が生還！」と実況表示する
116. When タイムリーヒットで複数得点が入る、the Game System shall 各ランナーの得点を順次表示する
117. When ランナーが本塁でアウトになる、the Game System shall 「△△選手、本塁でタッチアウト！」と実況表示し、送球に関与した守備選手名を含める

**守備プレイとアウトの判定：打球方向と担当選手の決定**
28. When 打球が発生する、the Game System shall Acceptance Criteria 13-25で既に決定された打球の種類（ゴロ/フライ/ライナー）、方向、強さの情報を使用する
29. [削除済み - AC 19に統合]
30. [削除済み - AC 20に統合]
31. [削除済み - AC 21に統合]
32. [削除済み - AC 22に統合]
33. When 守備シフトが適用されている、the Game System shall シフトの効果を打球方向の確率には影響させず、守備処理の判定時のみ適用する
34. [削除済み - AC 23-25に統合]

**守備プレイとアウトの判定：守備位置と担当選手の特定**
35. The Game System shall 各守備位置に対応する選手を以下のように定義する：投手（P）、捕手（C）、一塁手（1B）、二塁手（2B）、三塁手（3B）、遊撃手（SS）、左翼手（LF）、中堅手（CF）、右翼手（RF）
36. When 打球方向が「三塁線」である、the Game System shall 三塁手（3B）を主担当守備選手として特定する
37. When 打球方向が「三遊間」である、the Game System shall 遊撃手（SS）を主担当守備選手、三塁手（3B）を補助担当守備選手として特定する
38. When 打球方向が「遊撃正面」である、the Game System shall 遊撃手（SS）を主担当守備選手として特定する
39. When 打球方向が「二遊間」である、the Game System shall 二塁手（2B）を主担当守備選手、遊撃手（SS）を補助担当守備選手として特定する
40. When 打球方向が「一二塁間」である、the Game System shall 一塁手（1B）を主担当守備選手、二塁手（2B）を補助担当守備選手として特定する
41. When 打球方向が「一塁線」である、the Game System shall 一塁手（1B）を主担当守備選手として特定する
42. When 打球方向が「左翼方向」である、the Game System shall 左翼手（LF）を主担当守備選手として特定する
43. When 打球方向が「中堅方向」である、the Game System shall 中堅手（CF）を主担当守備選手として特定する
44. When 打球方向が「右翼方向」である、the Game System shall 右翼手（RF）を主担当守備選手として特定する
45. When フライ打球の深さが「浅い」（内野フライ相当）である、the Game System shall 外野方向でも内野手を主担当守備選手として特定する（左翼方向→SS/3B、中堅方向→2B/SS、右翼方向→1B/2B）

**守備プレイとアウトの判定：ゴロの処理**
46. When ゴロ打球が発生する、the Game System shall 主担当守備選手のInfield Range（内野守備範囲）を使用して打球に追いつけるかを判定する
47. When 主担当守備選手が打球に追いつけない場合、the Game System shall 補助担当守備選手のInfield Rangeを使用して追いつけるかを判定する（補助担当がいる場合）
48. When どの守備選手も追いつけない場合、the Game System shall 内野安打として処理する
49. When 守備選手が打球に追いつく、the Game System shall その守備選手のInfield Error（内野エラー率）に基づいてエラー発生の可否を判定する
50. When 守備選手がエラーを犯さず捕球する、the Game System shall 補殺プレイ（一塁への送球）を実行する
51. When 補殺プレイが実行される、the Game System shall 捕球した守備選手のInfield Arm（内野肩力）と一塁手のInfield Error（捕球エラー率）、打者のSpeed（走力）を総合評価してセーフ/アウトを判定する
52. When 一塁手が送球を受ける、the Game System shall 一塁手のInfield Errorに基づいて捕球失敗（悪送球または捕球ミス）の可否を判定する
53. When 送球時間とアウト確率を判定する、the Game System shall 捕球した守備選手のInfield Arm値に応じて漸進的に補正する：送球時間補正 = （65 - Infield Arm）× 0.005秒、アウト確率補正 = （Infield Arm - 60）× 0.25%を適用する
54. When 打者走者の一塁到達時間を判定する、the Game System shall Speed値に応じて漸進的に補正する：到達時間補正 = （70 - Speed）× 0.005秒、セーフ確率補正 = （Speed - 60）× 0.25%を適用する
56. When ゴロが投手正面に飛ぶ、the Game System shall 投手（P）を主担当守備選手として特定し、投手のInfield RangeとInfield Armを使用して判定する

**守備プレイとアウトの判定：フライの処理（内野フライ）**
57. When フライ打球が「浅い」と判定される、the Game System shall 打球方向に応じた内野手を主担当守備選手として特定する
58. When 内野フライが発生する、the Game System shall 主担当守備選手のInfield Rangeを使用して打球に追いつけるかを判定する
59. When 内野手が内野フライに追いつく、the Game System shall その内野手のInfield Errorに基づいてエラー発生の可否を判定する
60. When 内野フライが捕球される、the Game System shall 打者をアウトとして処理する
61. When 内野フライが落球される、the Game System shall エラーとして処理し、打者を出塁させ、ランナーを進塁させる
62. When 内野フライで複数の内野手が追いかける、the Game System shall 最も高いInfield Rangeを持つ守備選手を優先的に捕球選手として選択する
63. When ポップフライが発生する、the Game System shall 捕手（C）または一塁手（1B）を主担当守備選手として特定する

**守備プレイとアウトの判定：フライの処理（外野フライ）**
64. When フライ打球が「深い」と判定される、the Game System shall 打球方向に応じた外野手を主担当守備選手として特定する
65. When 外野フライが発生する、the Game System shall 主担当守備選手のOutfield Range（外野守備範囲）を使用して打球に追いつけるかを判定する
66. When 外野手が外野フライに追いつけない、the Game System shall 長打（二塁打または三塁打）として処理する
67. When 外野手が外野フライに追いつく、the Game System shall その外野手のOutfield Errorに基づいてエラー発生の可否を判定する
68. When 外野フライが捕球される、the Game System shall 打者をアウトとして処理する
69. When 外野フライが落球される、the Game System shall エラーとして処理し、打者を出塁させ（通常は二塁打相当）、ランナーを進塁させる
70. When 外野フライで複数の外野手が追いかける（例：左中間）、the Game System shall 両外野手のOutfield Rangeの平均値を使用して判定する
71. When 外野フライが捕球され、ランナーが塁上にいる、the Game System shall タッチアップ判定を実行する

**守備プレイとアウトの判定：ライナーの処理**
72. When ライナー打球が発生する、the Game System shall 打球方向に応じた守備選手（内野手または外野手）を主担当守備選手として特定する
73. When ライナーが内野方向に飛ぶ、the Game System shall 主担当内野手のInfield Rangeを使用して捕球可否を判定し、ライナー打球特性により捕球難易度に一律+20%の補正を適用する
74. When ライナーが外野方向に飛ぶ、the Game System shall 主担当外野手のOutfield Rangeを使用して捕球可否を判定し、ライナー打球特性により捕球難易度に一律+15%の補正を適用する
75. When ライナーが捕球される、the Game System shall 打者をアウトとして処理する
76. When ライナーが捕球されず落ちる、the Game System shall ヒット（内野ライナーは単打、外野ライナーは単打または二塁打）として処理する
77. When ライナーが捕球され、ランナーが塁上にいる、the Game System shall ランナーの帰塁判定を実行し、帰塁が間に合わない場合は併殺の可能性を判定する

**守備プレイとアウトの判定：ダブルプレーの処理**
78. When ダブルプレー機会（ランナー一塁でゴロ）が発生する、the Game System shall 打球を処理した内野手のTurn Double Play（併殺処理能力）を評価する
79. When 打球が二塁手または遊撃手に飛ぶ、the Game System shall 二塁ベースカバーに入る反対側の内野手（二塁手→遊撃手がカバー、遊撃手→二塁手がカバー）を特定する
80. When 打球が三塁手または一塁手に飛ぶ、the Game System shall 二塁ベースカバーに最も近い内野手（通常は遊撃手または二塁手）を特定する
81. When ダブルプレーを試みる、the Game System shall 第一段階として、捕球した内野手のInfield Armと二塁ベースカバー選手のInfield Error、一塁ランナーのSpeedを評価して二塁封殺の成否を判定する
82. When 二塁封殺が成功する、the Game System shall 第二段階として、二塁ベースカバー選手のInfield Armと一塁手のInfield Error、打者走者のSpeedを評価して一塁封殺の成否を判定する
83. When 二塁封殺が失敗する、the Game System shall ダブルプレー失敗として処理し、一塁ランナーをセーフ、打者走者を一塁にする
84. When 一塁封殺が失敗する、the Game System shall シングルアウトとして処理し、一塁ランナーをアウト、打者走者をセーフにする
85. When 両方の封殺が成功する、the Game System shall ダブルプレー成立として処理し、2アウトを記録する
86. When ダブルプレー機会で打球が強すぎる、the Game System shall ダブルプレー試行を放棄し、確実に一塁アウトのみを狙う判定を行う

**守備プレイとアウトの判定：タッチアップとランナー進塁阻止**
87. When 外野フライが捕球され、三塁ランナーがタッチアップを試みる、the Game System shall 捕球した外野手のOutfield Arm、捕手のCatcher Ability、三塁ランナーのSpeedとBaserunningを総合評価する
88. When 外野フライが捕球され、二塁ランナーがタッチアップを試みる、the Game System shall 捕球した外野手のOutfield Arm、三塁手のInfield Error、二塁ランナーのSpeedとBaserunningを総合評価する
89. When タッチアップ阻止確率を判定する、the Game System shall 外野手のOutfield Arm値に応じて漸進的に補正する：（Outfield Arm - 60）× 0.35%の補正を適用する
90. When タッチアップ成功確率を判定する、the Game System shall ランナーのSpeedとBaserunningの平均値に応じて漸進的に補正する：（（Speed + Baserunning）/ 2 - 60）× 0.4%の補正を適用する
91. When 受け取る守備選手の処理成功率を判定する、the Game System shall 捕手のCatcher Abilityまたは三塁手のInfield Error値に応じて漸進的に補正する：（能力値 - 60）× 0.3%の補正を適用する
92. When タッチアップが成功する、the Game System shall ランナーを進塁させる
93. When タッチアップが失敗する、the Game System shall ランナーをアウトとして処理する

**守備プレイとアウトの判定：複数ランナー時の選択的送球**
94. When ヒットでランナーが追加進塁を試みる、the Game System shall 外野手が送球する塁（二塁/三塁/本塁）を試合状況に応じて決定する
95. When 外野手が二塁への送球を選択する、the Game System shall 外野手のOutfield Armと二塁ベースカバー選手（二塁手または遊撃手）のInfield Errorを評価する
96. When 外野手が三塁への送球を選択する、the Game System shall 外野手のOutfield Armと三塁手のInfield Errorを評価する
97. When 外野手が本塁への送球を選択する、the Game System shall 外野手のOutfield Armと捕手のCatcher Abilityを評価する
98. When 中継プレイが発生する（外野→内野→塁）、the Game System shall 第一送球（外野→内野）と第二送球（内野→塁）の両方を個別に評価し、各段階で送球ミスの可能性を判定する
99. When 中継プレイで内野手が中継する、the Game System shall 中継内野手のInfield ArmとInfield Errorを使用して中継精度を判定する

**守備プレイとアウトの判定：エラーの詳細処理**
100. When 守備エラーが発生する、the Game System shall エラーの種類（捕球エラー/送球エラー/判断ミス）を判定する
101. When 捕球エラーが発生する、the Game System shall 打者を出塁させ、ランナーを1塁分進塁させる
102. When 送球エラーが発生する、the Game System shall 打者と全ランナーを1-2塁分余分に進塁させる（送球エラーの重大度に応じて）
103. When 判断ミスが発生する、the Game System shall 間違った塁に送球したとして、ランナーに追加進塁のチャンスを与える
104. When エラーが発生する、the Game System shall エラーを犯した守備選手名と状況を実況テキストで表示する（例：「三塁手○○がエラー！打球を弾いてしまった！」）
105. The Game System shall 全てのプレイ結果を自然な日本語のテキストで実況形式で表示し、担当守備選手名を含める

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
31. When 左打者がバントする、the Game System shall 一塁への距離が近いため以下の補正を適用する：
    - 一塁到達時間を-0.2秒短縮（AC 54で詳細定義）
    - バント成功率（セーフ確率）を+10%上昇（速度短縮の効果として統合）

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
61. When 投手が「疲労」状態になる、the Game System shall AC 34の累積減衰計算に基づき、追加でStuffを5-10%、Controlを10-15%低下させる（基本減衰に加えて適用）
62. When 投手が「限界」状態になる、the Game System shall AC 34の累積減衰計算に基づき、追加でStuffを15-20%、Controlを20-25%低下させる（基本減衰と疲労段階補正に加えて適用）
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
1. The Game System shall スコアボード（両チームの得点、イニング、アウトカウント、ボールカウント）をブラウザの画面上部に常時表示する
2. The Game System shall イニング別の得点経過を表形式でHTML要素として表示する（例：1回=0, 2回=2, 3回=0...）
3. When 得点が入る、the Game System shall スコアボードをリアルタイムで更新しCSSアニメーションまたはクラス変更で視覚的に強調する
4. The Game System shall 現在の打順位置（何番打者か）をスコアボード付近にDOM要素として表示する
5. When イニングが変わる、the Game System shall イニング表示をDOM更新で変更し攻守交代を明示する

**ランナー状況の表示**
6. The Game System shall 塁上のランナー状態をHTML/CSS要素（例：●=ランナーあり、○=塁なし）またはテキストで表現する
7. When ランナーが塁に出る、the Game System shall 該当する塁のDOM要素を即座に更新する
8. When ランナーが進塁または得点する、the Game System shall ランナー表示をCSS transitionまたはJavaScriptアニメーションで視覚的に更新する
9. The Game System shall ランナーがいる塁に選手名を表示するオプションを提供する
10. When 満塁状態になる、the Game System shall 「満塁！」などの状況説明を強調表示する

**プレイ実況と結果表示**
11. When プレイが実行される、the Game System shall 打席の流れ（投球、打撃、結果）を自然な日本語で実況形式でDOM要素に表示する
12. When プレイ結果が出る、the Game System shall 何が起きたか（ヒット、アウト、得点など）を明確に説明する
13. When 得点が入る、the Game System shall 「○○選手のタイムリーヒット！△△選手が生還！」などの臨場感ある実況を表示する
14. When 重要なプレイ（三振、ホームラン、ダブルプレー）が発生する、the Game System shall CSSクラスによる特別な強調表示と視覚的演出を使用する
15. The Game System shall 各プレイの結果をCSSクラスによる色分けで視覚的に区別する（例：ヒット=青、アウト=灰色）

**重要局面の強調**
16. When 得点圏にランナーがいる、the Game System shall 「チャンス！」「ピンチ！」などの状況ラベルをDOM要素として表示する
17. When クリーンナップ打者（3-5番）が打席に入る、the Game System shall 「強打者登場」などの注意喚起を表示する
18. When ツーアウトで攻撃チームに最後のチャンスである、the Game System shall 「ラストチャンス！」と表示する
19. When 試合終盤（7回以降）で僅差である、the Game System shall 「接戦！」や点差を強調表示する
20. When サヨナラのチャンスである、the Game System shall 「サヨナラのチャンス！」と大きく表示する

**プレイ履歴とログ**
21. The Game System shall 試合中の全プレイを時系列でメモリまたはlocalStorageに記録する
22. When プレイヤーがログを要求する、the Game System shall 過去のプレイ履歴をスクロール可能なHTML要素のリストで表示する
23. When プレイヤーが特定イニングのログを確認する、the Game System shall そのイニングのプレイのみをJavaScriptフィルタリングで表示する
24. The Game System shall ログに各プレイの時刻、打者名、結果、スコア変動を含める
25. When 試合が長時間になる、the Game System shall ログの最大表示件数を制限し古いログは圧縮する

**視覚的なユーザビリティ**
26. The Game System shall 現在の状況（攻撃中/守備中、指示待ちなど）をWeb UIとして明確に表示する
27. The Game System shall レスポンシブデザインとHTML/CSSレイアウトで見やすい画面構成を実現する
28. When 画面が情報過多になる、the Game System shall 必須情報のみを前面に表示し詳細はモーダルまたは折りたたみ要素で表示する
29. The Game System shall CSSスタイルを使って情報の重要度を視覚的に表現する
30. The Game System shall 常に次に何をすべきか（指示選択、確認など）をガイドメッセージとしてDOM要素に表示する

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
1. If プレイヤーが無効な指示（範囲外の数値、存在しない選択肢）を入力する、then the Game System shall 「無効な入力です。もう一度選択してください」とブラウザ上にメッセージ表示し再選択を促す
2. If プレイヤーが現在の状況で選択できない指示を選ぶ、then the Game System shall 理由を説明し（例：「ランナーがいません」）適切な選択肢を再提示する
3. When 入力エラーが発生する、the Game System shall 試合状態を変更せず同じ場面を維持する
4. The Game System shall 入力エラー時にブラウザの視覚的フィードバック（警告色、アイコンなど）を表示する
5. If プレイヤーが連続して3回以上エラー入力する、then the Game System shall ヘルプメッセージや選択肢の詳細説明をモーダルまたはツールチップで表示する

**システムエラーとデータ保護**
6. If システムエラー（例外、クラッシュ）が発生する、then the Game System shall 現在の試合状態をlocalStorageまたはIndexedDBに緊急保存する
7. When システムが予期しないエラーで停止する、the Game System shall エラーログをlocalStorageまたはブラウザコンソールに記録する
8. When アプリ再起動時にlocalStorageにクラッシュ履歴がある、the Game System shall 「前回の試合を復元しますか？」とダイアログで確認する
9. The Game System shall 自動保存機能を提供し各イニング終了時に試合状態をlocalStorageに保存する
10. If データ保存に失敗する、then the Game System shall 「保存に失敗しました」と警告しブラウザ上で再試行オプションを提供する

**試合の中断と再開**
11. When プレイヤーが中断（一時停止）を要求する、the Game System shall 試合を一時停止し現在の状態をメモリに保持する
12. When 試合が一時停止される、the Game System shall 「再開」「保存して終了」「保存せずに終了」のオプションをボタンUIで表示する
13. When プレイヤーが「保存して終了」を選択する、the Game System shall 試合データをlocalStorageに保存しメインメニューに戻る
14. When プレイヤーが次回起動時に「試合を再開」を選択する、the Game System shall localStorageから試合状態を正確に復元する
15. The Game System shall 中断前の試合状況（スコア、ランナー、打順、投手）を完全に再現する

**ユーザビリティとガイダンス**
16. The Game System shall すべての指示選択肢をボタンまたはクリック可能な要素として提供する
17. The Game System shall 各指示オプションにツールチップまたは説明文（1行）を付ける
18. When 初回プレイである、the Game System shall 基本的な操作方法を説明するチュートリアルをオーバーレイまたはモーダルで表示するオプションを提供する
19. When プレイヤーが「ヘルプ」を要求する、the Game System shall ゲームルールと操作方法をモーダルウィンドウで表示する
20. The Game System shall 現在選択可能なアクションを常に明示する

**パフォーマンスとレスポンス**
21. The Game System shall プレイ実行から結果表示までの応答時間を1秒以内に保つ
22. When プレイヤーが指示を選択する、the Game System shall 即座に受け付けDOM更新を開始する
23. The Game System shall テキスト表示速度をJavaScriptアニメーション設定で調整可能にする（即座表示/逐次表示）
24. The Game System shall 長いテキスト出力は適度に区切り「クリックで続行」ボタンを表示する
25. The Game System shall プレイのテンポを維持し待機時間を最小化する

**アクセシビリティとカスタマイズ**
26. The Game System shall 表示言語を設定可能にする（日本語/英語など）
27. When プレイヤーが表示設定を変更する、the Game System shall 設定をlocalStorageに保存し次回起動時に適用する
28. The Game System shall レスポンシブデザインでスマートフォン・タブレット・デスクトップに対応する
29. The Game System shall ブラウザのダークモード対応またはカラーテーマ切り替え機能を提供する
30. The Game System shall プレイヤーが難易度（選手能力の幅、乱数の振れ幅）を設定できるオプションを提供する

### Requirement 8: 試合履歴と戦績管理
**Objective:** プレイヤー（監督）として、過去の試合結果を振り返りたい、自分の監督成績や戦術の効果を分析できるようにするため

#### Acceptance Criteria

**試合結果の記録と保存**
1. When 試合が正常終了する、the Game System shall 試合結果（試合ID、日時、対戦相手、最終スコア、勝敗、試合時間）をlocalStorageまたはIndexedDBに自動的に永続化する
2. The Game System shall 各試合のイニング別得点を詳細データとして保存する
3. When 試合が保存される、the Game System shall 主要なプレイイベント（得点シーン、投手交代、サヨナラなど）をハイライトとして記録する
4. The Game System shall 試合データをJSON形式で構造化してブラウザストレージに保存する
5. When 保存処理が完了する、the Game System shall 「試合結果を保存しました」と確認メッセージをブラウザ上に表示する

**履歴一覧の表示**
6. When プレイヤーがメインメニューで「試合履歴」を選択する、the Game System shall localStorageから過去の試合一覧を読み込み新しい順（降順）に表示する
7. The Game System shall 履歴一覧に各試合の日付、対戦相手、スコア、勝敗をHTML表形式で表示する
8. When 履歴が10件を超える、the Game System shall ページネーション機能またはスクロール機能を提供する
9. When プレイヤーがページを切り替える、the Game System shall JavaScriptで前の10件/次の10件を表示する
10. The Game System shall 履歴一覧で勝利試合と敗北試合をCSSクラスによる色分けで区別する

**試合詳細の閲覧**
11. When プレイヤーが履歴一覧から特定の試合を選択する、the Game System shall その試合の詳細画面にルーティング遷移する
12. When 試合詳細が表示される、the Game System shall 最終スコア、イニング別得点表、試合時間、総安打数をDOM要素として表示する
13. The Game System shall 試合詳細画面に主要プレイのハイライト（タイムリーヒット、ホームラン、投手交代）を時系列でリスト表示する
14. When プレイヤーが詳細ログを要求する、the Game System shall その試合の全プレイ履歴をスクロール可能なリストとして表示する
15. When プレイヤーが詳細画面から戻る、the Game System shall ブラウザの戻るボタンまたはナビゲーションボタンで履歴一覧に戻る

**通算戦績の集計と表示**
16. The Game System shall localStorageから全試合の戦績を集計し総試合数、勝利数、敗北数、引き分け数をJavaScriptで計算する
17. The Game System shall 勝率を計算し小数点第3位まで表示する（例：.667）
18. When プレイヤーが戦績画面を開く、the Game System shall 通算成績を見やすくサマリー形式でHTML要素として表示する
19. The Game System shall 最高得点試合、最低失点試合などの記録を「自己ベスト」として表示する
20. The Game System shall 連勝記録、連敗記録を追跡し表示する

**フィルタリングと検索機能**
21. When プレイヤーが戦績フィルタを選択する、the Game System shall 期間指定（過去7日間、過去30日間、全期間）のオプションをドロップダウンまたはボタンで表示する
22. When プレイヤーが期間フィルタを適用する、the Game System shall JavaScriptで指定期間内の試合のみを抽出し表示する
23. When プレイヤーが勝敗フィルタを適用する、the Game System shall 勝利試合のみ/敗北試合のみを表示する
24. When プレイヤーが対戦相手で検索する、the Game System shall 特定チームとの対戦成績を抽出表示する
25. The Game System shall フィルタ適用後も通算成績を再計算し表示する

**データの永続化と管理**
26. The Game System shall 履歴データをlocalStorageに保存する
27. When アプリが起動される、the Game System shall localStorageから保存された履歴データを自動的に読み込み復元する
28. If localStorageデータが破損している、then the Game System shall エラーを表示し空の履歴からスタートする
29. When 履歴データが存在しない、the Game System shall 新規にlocalStorageエントリを作成する
30. The Game System shall データのエクスポート機能を提供しJSON形式でダウンロードできるようにする

**履歴の削除と圧縮**
31. When 履歴が100試合を超える、the Game System shall 「古い履歴を整理しますか？」と確認メッセージをダイアログで表示する
32. When プレイヤーが履歴削除を選択する、the Game System shall 削除する試合の範囲（全て、特定期間、選択した試合）をUIで確認する
33. When プレイヤーが削除を確定する、the Game System shall localStorageから該当する履歴を削除し通算成績を再計算する
34. The Game System shall 履歴削除前に「この操作は取り消せません」と警告する
35. When 大量の履歴データがある、the Game System shall 古い試合の詳細ログを圧縮しサマリーのみを保持するオプションを提供する

**統計とトレンド分析**
36. The Game System shall 最近10試合の勝率を計算し「最近の調子」として表示する
37. When 戦績画面が表示される、the Game System shall 得点力（1試合平均得点）と防御力（1試合平均失点）を計算表示する
38. The Game System shall 最も使用した戦術（バント回数、盗塁回数など）を統計として表示する
39. When プレイヤーが統計画面を開く、the Game System shall HTML Canvas/SVGまたはチャートライブラリで戦績推移をグラフ表示する
40. The Game System shall 対戦相手別の勝率を集計しランキング形式で表示する

### Requirement 9: 選手とチームのデータ管理
**Objective:** プレイヤーとして、カスタム選手とチームを作成・編集したい、自分好みの野球ゲーム体験をカスタマイズできるようにするため

#### Acceptance Criteria

**選手データの初期化とデフォルト提供**
1. When アプリが初回起動される、the Game System shall サーバーまたは静的JSONファイル（例: `data/default_players.json`）から30人以上のデフォルト選手データをHTTP/fetchでロードする
2. The Game System shall デフォルト選手データに両リーグの代表的な選手タイプ（パワーヒッター、俊足、技巧派投手など）を含める
3. When 選手データをロードする、the Game System shall 全能力値が1-100範囲内であることをJavaScriptでバリデートする
4. If 選手データのバリデーションエラーが発生する、then the Game System shall エラー詳細（選手名、能力名、無効な値）をブラウザ上に表示し、該当選手をスキップする
5. The Game System shall ロード成功時に「○○人の選手をロードしました」と確認メッセージをブラウザ上に表示する

**選手一覧と検索機能**
6. When プレイヤーがメインメニューで「選手管理」を選択する、the Game System shall 全選手の一覧をDOM要素としてレンダリング表示する
7. The Game System shall 選手一覧に選手名、ポジション、総合評価（OVR）、所属チームをHTMLテーブルまたはカードUIで表示する
8. When プレイヤーが検索フィルタを適用する、the Game System shall JavaScriptでポジション、チーム、能力値範囲による絞り込みを実行する
9. When プレイヤーが並び替えを選択する、the Game System shall JavaScriptで名前、ポジション、総合評価の昇順/降順で並び替える
10. The Game System shall 一覧表示に50人ずつのページネーションまたは仮想スクロール機能を提供する

**選手の詳細表示**
11. When プレイヤーが選手一覧から選手を選択する、the Game System shall 選手詳細画面にルーティング遷移またはモーダル表示する
12. When 選手詳細が表示される、the Game System shall OOTP26準拠の全85能力値を分類してDOM要素にレンダリング表示する（打撃10項目、投手10項目、走塁7項目、守備9項目など）
13. The Game System shall 各能力値をCSSクラスで色分け表示する（青=90+、緑=70-89、黄=50-69、橙=30-49、赤=1-29）
14. When 選手詳細画面が表示される、the Game System shall 「編集」「削除」「戻る」のボタンをUIに提供する
15. When プレイヤーが「戻る」を選択する、the Game System shall ブラウザ履歴またはナビゲーションで選手一覧に戻る

**選手の新規作成**
16. When プレイヤーが選手一覧で「新規作成」を選択する、the Game System shall 選手作成フォームをモーダルまたは専用画面で表示する
17. When 選手作成フォームが表示される、the Game System shall 必須項目（名前、ポジション）と能力値入力フィールドをHTML form要素として提供する
18. The Game System shall 各能力値にHTML range inputスライダー（1-100）または数値入力を提供する
19. When プレイヤーが能力値を変更する、the Game System shall JavaScriptでリアルタイムに総合評価（OVR）を再計算しDOM更新で表示する
20. The Game System shall デフォルト値として全能力値を50（平均）に設定する
21. When プレイヤーが「ランダム生成」ボタンを選択する、the Game System shall JavaScriptで指定ポジションに適した能力値をランダムに生成する
22. When プレイヤーが「保存」ボタンを選択する、the Game System shall JavaScriptで選手データをバリデートし、有効な場合はlocalStorageまたはIndexedDBに保存する
23. If 必須項目が未入力である、then the Game System shall 「○○を入力してください」とブラウザ上にエラー表示し保存を拒否する
24. When 選手が正常に保存される、the Game System shall 「選手を作成しました（ID: ○○）」と確認メッセージをブラウザ上に表示する

**選手の編集**
25. When プレイヤーが選手詳細で「編集」ボタンを選択する、the Game System shall 選手編集フォームをモーダルまたは専用画面で表示する
26. When 選手編集フォームが表示される、the Game System shall 現在の能力値をフォームに事前入力する
27. When プレイヤーが能力値を変更する、the Game System shall 変更前との差分をDOM要素で強調表示する（例：「Contact: 75 → 80 (+5)」）
28. When プレイヤーが「保存」ボタンを選択する、the Game System shall 変更内容を確認ダイアログで表示する
29. When プレイヤーが変更を確定する、the Game System shall localStorageまたはIndexedDBを更新し「選手を更新しました」とブラウザ上に表示する
30. When プレイヤーが「キャンセル」ボタンを選択する、the Game System shall 変更を破棄し選手詳細に戻る

**選手の削除**
31. When プレイヤーが選手詳細で「削除」ボタンを選択する、the Game System shall 「本当に削除しますか？この操作は取り消せません」と確認ダイアログを表示する
32. When プレイヤーが削除を確定する、the Game System shall localStorageまたはIndexedDBから選手を削除する
33. If 削除対象の選手が既に試合で使用されている、then the Game System shall 「この選手は試合履歴に含まれています。削除しますか？」と追加警告を表示する
34. When 選手が削除される、the Game System shall 「選手を削除しました」とブラウザ上に表示し選手一覧に戻る

**チーム管理機能**
35. When プレイヤーが「チーム管理」を選択する、the Game System shall 全チームの一覧をDOM要素として表示する
36. When プレイヤーが「新規チーム作成」ボタンを選択する、the Game System shall チーム作成フォーム（チーム名、略称、ホームスタジアム）をHTML formとして表示する
37. When プレイヤーがチームを選択する、the Game System shall チーム詳細（ロースター、デフォルト打順）をDOM要素として表示する
38. When プレイヤーが「ロースター編集」ボタンを選択する、the Game System shall 選手の追加/削除インターフェース（ドラッグ&ドロップまたは選択リスト）を提供する
39. The Game System shall チームに最低9人の野手と2人の投手を要求する
40. When ロースターが編集される、the Game System shall 「変更を保存しました」と確認メッセージをブラウザ上に表示する

**データのインポート/エクスポート**
41. When プレイヤーが「データエクスポート」ボタンを選択する、the Game System shall エクスポート対象（全選手、特定チーム、選択した選手）をUIで選択させる
42. When エクスポート対象が選択される、the Game System shall JSON形式でBlobオブジェクトを生成しブラウザダウンロード機能で出力する
43. The Game System shall エクスポートファイル名に日時を含める（例：`players_export_2026-01-31.json`）
44. When エクスポートが完了する、the Game System shall 「○○人の選手をエクスポートしました」とブラウザ上に表示する
45. When プレイヤーが「データインポート」ボタンを選択する、the Game System shall HTML file input要素でファイル選択ダイアログを表示する
46. When インポートファイルが選択される、the Game System shall FileReader APIでJSONフォーマットをバリデートする
47. If インポートファイルが無効な形式である、then the Game System shall 「ファイル形式が正しくありません」とエラーをブラウザ上に表示する
48. When インポートデータが有効である、the Game System shall JavaScriptで既存データとの重複チェックを実行する
49. If 同名の選手が存在する、then the Game System shall 「上書き」「スキップ」「名前を変更して追加」のオプションをダイアログで提示する
50. When インポートが完了する、the Game System shall 「○○人の選手をインポートしました（スキップ: ○人）」とブラウザ上に表示する

**テンプレートとプリセット機能**
51. The Game System shall 選手作成時に「テンプレート選択」ボタン機能を提供する
52. When プレイヤーが「テンプレート選択」ボタンを開く、the Game System shall プリセット（パワーヒッター、俊足、エース投手、クローザーなど）をドロップダウンまたはリストで表示する
53. When プレイヤーがテンプレートを選択する、the Game System shall 該当タイプの典型的な能力値をJavaScriptでフォームに設定する
54. The Game System shall カスタムテンプレートの保存機能をlocalStorageで提供する
55. When プレイヤーがカスタムテンプレートを保存する、the Game System shall テンプレート名を入力させlocalStorageに保存する

**バッチ編集機能**
56. When プレイヤーが選手一覧で複数選手をチェックボックスで選択する、the Game System shall 「バッチ編集」ボタンを有効化する
57. When プレイヤーが「バッチ編集」ボタンを選択する、the Game System shall 一括操作メニュー（チーム変更、能力値補正、削除）をモーダルで表示する
58. When バッチで能力値補正が選択される、the Game System shall JavaScriptで全選手に対して一律の増減（例：「全能力+5」）を適用する
59. When バッチ操作が実行される、the Game System shall 影響を受ける選手数を事前にダイアログ表示し確認を求める
60. When バッチ操作が完了する、the Game System shall 「○○人の選手を更新しました」とブラウザ上に表示する

**データ整合性とバックアップ**
61. The Game System shall 選手データの変更前にlocalStorageで自動バックアップを作成する
62. The Game System shall バックアップをlocalStorageに日時付きキーで保存する
63. The Game System shall 最大10世代のバックアップを保持し、古いものから自動削除する
64. When プレイヤーが「バックアップから復元」ボタンを選択する、the Game System shall localStorageから利用可能なバックアップ一覧を表示する
65. When バックアップが選択される、the Game System shall 「現在のデータは失われます。復元しますか？」とダイアログで確認する
66. When 復元が確定される、the Game System shall localStorageからバックアップデータを復元し「データを復元しました」とブラウザ上に表示する
67. The Game System shall データベース整合性チェック機能を提供し、起動時にJavaScriptで自動実行する
68. If データベース破損が検出される、then the Game System shall 最新のバックアップから自動復元を試みる

**ヘルプとドキュメント**
69. When プレイヤーが選手管理画面で「ヘルプ」ボタンを選択する、the Game System shall 選手作成ガイドをモーダルまたは専用ページで表示する
70. The Game System shall ヘルプに各能力値の説明とゲームへの影響を記載する
71. The Game System shall JSON形式のサンプルファイルを静的アセット（例: `data/sample_player.json`）として提供する
72. When プレイヤーが「能力値ガイド」ボタンを開く、the Game System shall OOTP26準拠の能力値説明をモーダルで表示する

### Requirement 10: CPU操作チームの戦術AI
**Objective:** システムとして、プレイヤーの対戦相手となるCPU操作チームに現実的な戦術判断をさせたい、人間の監督と対戦しているような臨場感を提供するため

#### Acceptance Criteria

**CPU AI の基本動作**
1. When CPU操作チームの攻撃または守備ターンになる、the Game System shall 試合状況を分析し自動的に戦術指示を決定する
2. The Game System shall CPU操作チームの指示決定にランダム性を持たせ、毎回同じ状況で同じ指示にならないようにする
3. When CPU操作チームが指示を決定する、the Game System shall 0.5-1.5秒の思考時間を設けてから実行する
4. The Game System shall CPU操作チームの指示内容を「（CPU監督）○○の指示！」と表示する
5. The Game System shall CPU操作チームの難易度設定（初級/中級/上級）に応じて判断精度を調整する

**攻撃時の基本戦術判断**
6. When CPU操作チームの打席である、the Game System shall デフォルトとして「通常打撃」を80-90%の確率で選択する
7. When 打者のContact能力が70以上である、the Game System shall 通常打撃の選択確率を90-95%に上昇させる
8. When 打者のContact能力が40未満である、the Game System shall 通常打撃の選択確率を70-80%に低下させ、他の戦術を検討する
9. When 得点差が大きい（5点差以上）状態で負けている、the Game System shall 積極的な攻撃（通常打撃、盗塁）を選択する確率を上昇させる
10. When 試合が接戦（2点差以内）である、the Game System shall 状況に応じてバント、盗塁、エンドランなどの小技を検討する

**バント戦術の判断**
11. When ランナーが一塁にいてノーアウトまたはワンアウトである、the Game System shall 打者のSacrifice Bunt能力が60以上の場合、バント指示を15-25%の確率で選択する
12. When ランナーが一塁にいてツーアウトである、the Game System shall バント指示を選択しない（通常打撃優先）
13. When 打者が投手（Contact能力30未満）でランナーが塁上にいる、the Game System shall バント指示を50-70%の確率で選択する
14. When 接戦（1点差以内）で7回以降にランナーが二塁または三塁にいる、the Game System shall バント指示の選択確率を20-30%上昇させる
15. When 打者がクリーンナップ（3-5番）でHR Power 70以上である、the Game System shall バント指示を選択しない

**盗塁戦術の判断**
16. When ランナーが一塁にいてStealing Ability 70以上である、the Game System shall 盗塁指示を20-30%の確率で選択する（基本確率）
17. When ランナーが一塁にいてStealing Ability 50未満である、the Game System shall 盗塁指示を選択しない（5%未満）
18. When 投手のHold Runners能力が80以上である、the Game System shall 盗塁指示の選択確率を半減させる
19. When 捕手のCatcher Arm能力が80以上である、the Game System shall 盗塁指示の選択確率を半減させる
20. When ツーアウトである、the Game System shall 盗塁指示の選択確率を70%低下させる（抑制補正として最優先適用）
21. When 点差が5点以上である、the Game System shall 盗塁指示を選択しない（状況的制約として最優先適用）
22. When 接戦（1点差以内）で7回以降である、the Game System shall 以下の条件で盗塁指示の選択確率を調整する：
    - AC 20（ツーアウト）またはAC 21（大差）の制約条件に該当しない場合のみ適用
    - 該当する場合、基本確率を1.5倍に上昇させる
    - 計算順序：基本確率（AC 16） → Hold Runners/Catcher Arm補正（AC 18-19） → 接戦補正（AC 22） → ツーアウト補正（AC 20）
    - 例：Stealing Ability 70以上、接戦7回以降、ワンアウト → 基本25% × 1.5倍（接戦） = 37.5%
    - 例：Stealing Ability 70以上、接戦7回以降、ツーアウト → 基本25% × 1.5倍（接戦） × 0.3（ツーアウト） = 11.25%

**エンドラン戦術の判断**
23. When ランナーが一塁にいてノーアウトまたはワンアウトである、the Game System shall 打者のContact能力65以上かつランナーのSpeed 60以上の場合、エンドラン指示を10-20%の確率で選択する
24. When カウントが打者有利（3-0、3-1、2-0）である、the Game System shall エンドラン指示の選択確率を1.5倍に上昇させる
25. When カウントが投手有利（0-2、1-2）である、the Game System shall エンドラン指示を選択しない
26. When 打者がパワーヒッター（HR Power 75以上、Contact 60未満）である、the Game System shall エンドラン指示の選択確率を50%低下させる

**スクイズ戦術の判断**
27. When ランナーが三塁にいてワンアウト以下である、the Game System shall 打者のSacrifice Bunt能力60以上かつランナーのSpeed 60以上の場合、スクイズ指示を検討する
28. When 接戦（同点または1点差で負けている）で7回以降にランナーが三塁にいる、the Game System shall スクイズ指示を15-25%の確率で選択する
29. When ノーアウトまたはワンアウトで三塁ランナーがいる、the Game System shall スクイズ指示を5-15%の確率で選択する
30. When ツーアウトで三塁ランナーがいる、the Game System shall スクイズ指示を選択しない
31. When 打者がクリーンナップ（3-5番）である、the Game System shall スクイズ指示を選択しない

**ダブルスチール戦術の判断**
32. When ランナーが一塁と三塁にいる、the Game System shall 両ランナーのStealing Ability平均が65以上の場合、ダブルスチール指示を10-15%の確率で選択する
33. When ランナーが一塁と二塁にいる、the Game System shall 両ランナーのStealing Ability平均が70以上の場合、ダブルスチール指示を5-10%の確率で選択する
34. When ツーアウトである、the Game System shall ダブルスチール指示を選択しない

**守備時の投手交代判断**
35. When 先発投手の投球数が100球を超える、the Game System shall 投手交代を80-90%の確率で決定する
36. When 先発投手の投球数が75球を超え疲労度が「疲労」以上である、the Game System shall 投手交代を40-60%の確率で決定する
37. When 先発投手が5失点以上している、the Game System shall イニングの切れ目で投手交代を60-80%の確率で決定する
38. When 先発投手が1イニングで3失点以上した、the Game System shall そのイニング終了後に投手交代を70-90%の確率で決定する
39. When リリーフ投手の投球数が30球を超える、the Game System shall 次のイニングで投手交代を50-70%の確率で検討する
40. When 投手交代を決定する、the Game System shall ブルペンから疲労度が「新鮮」または「普通」の投手を優先的に選択する
41. When 7回以降で接戦（3点差以内）である、the Game System shall より高いStuffとControlを持つリリーフ投手を優先選択する
42. When リードしている状態で9回表を迎える、the Game System shall 最も高いStuffを持つクローザー（リリーフ投手）を選択する

**守備時の敬遠判断**
43. When 打者がチーム最高のHR Power（80以上）を持ち、一塁が空いている、the Game System shall 敬遠指示を15-25%の確率で選択する
44. When 一塁が空いており、打者がHR Power 75以上で次打者がContact 50未満である、the Game System shall 敬遠指示を30-40%の確率で選択する
45. When 満塁状態になる敬遠である、the Game System shall 敬遠指示の選択確率を80%低下させる
46. When 8回以降の接戦（1-2点差）で一塁が空いている、the Game System shall 強打者への敬遠指示を25-35%の確率で選択する
47. When 点差が5点以上ある、the Game System shall 敬遠指示を選択しない

**守備時の守備シフト判断**
48. When 打者が極端な引っ張り傾向（データで判別可能な場合）を持つ、the Game System shall 該当方向への守備シフトを40-60%の確率で選択する
49. When 打者のHR Power 80以上である、the Game System shall 守備シフトの選択確率を1.5倍に上昇させる
50. When ランナーが得点圏（二塁または三塁）にいる、the Game System shall 守備シフトを選択しない（通常守備優先）

### Requirement 11: 守備シフトシステム
**Objective:** 監督として、守備シフトを活用して打者の傾向に対応したい、守備戦術の深みを提供し打撃結果に影響を与えられるようにするため

#### Acceptance Criteria

**守備シフトの種類と定義**
1. The Game System shall 以下の守備シフトタイプを提供する：「通常守備」「右打ちシフト」「左打ちシフト」「極端シフト（エクストリームシフト）」「前進守備」「深守備」
2. When 「通常守備」が選択される、the Game System shall 全守備位置を標準配置に設定し、特別な補正を適用しない
3. When 「右打ちシフト」が選択される、the Game System shall 内野手を一塁・二塁側に寄せ、以下の基本補正を設定する：
    - 右方向（引っ張り方向）の打球処理範囲：基本補正 +15%
    - 左方向（逆方向）の打球処理範囲：基本補正 -20%
4. When 「左打ちシフト」が選択される、the Game System shall 内野手を三塁・遊撃側に寄せ、以下の基本補正を設定する：
    - 左方向（引っ張り方向）の打球処理範囲：基本補正 +15%
    - 右方向（逆方向）の打球処理範囲：基本補正 -20%
5. When 「極端シフト」が選択される、the Game System shall 内野手3名を打者の引っ張り方向に集中配置し、以下の基本補正を設定する：
    - 引っ張り方向の打球処理範囲：基本補正 +25%
    - 逆方向の打球処理範囲：基本補正 -35%
6. When 「前進守備」が選択される、the Game System shall 内野手全員を前方に配置し、以下の基本補正を設定する：
    - ゴロ処理速度：基本補正 +20%
    - 深い打球の処理範囲：基本補正 -15%
7. When 「深守備」が選択される、the Game System shall 内野手・外野手全員を後方に配置し、以下の基本補正を設定する：
    - 長打処理範囲：基本補正 +15%
    - 内野安打の発生率：基本補正 +20%
8. The Game System shall 上記の基本補正値を「シフト基本補正表」として参照し、AC 16-40の実際の判定時に守備選手の能力値と組み合わせて最終補正を計算する

**守備シフトの選択条件と制約**
8. The Game System shall 守備シフト選択メニューで現在の打者の打球傾向情報（引っ張り傾向・流し打ち傾向）を表示する
9. When 打者が左打者である、the Game System shall 「右打ちシフト」を推奨オプションとして強調表示する
10. When 打者が右打者である、the Game System shall 「左打ちシフト」を推奨オプションとして強調表示する
11. When 打者のHR Power 80以上である、the Game System shall 「極端シフト」を推奨オプションとして表示する
12. When ランナーが三塁にいてワンアウト以下である、the Game System shall 「前進守備」を推奨オプションとして表示する
13. When ランナーが得点圏（二塁または三塁）にいる、the Game System shall 極端シフトの選択に「リスク警告：進塁を許しやすくなります」を表示する
14. When 打者のContact能力が40未満である、the Game System shall 守備シフトの有効性を低下させる警告を表示する（「打者が空振りしやすいため効果は限定的」）
15. The Game System shall 守備シフトが選択されてから3打席継続するまで変更できないルールを適用する（オプション設定で変更可能）

**守備シフトが打撃結果に与える効果：ゴロ打球**
16. When シフトが適用されたゴロ打球の処理を判定する、the Game System shall AC 3-7で定義されたシフト基本補正表の値に、守備選手のInfield Range平均値を掛け合わせて最終補正を計算する：最終シフト効果 = シフト基本補正 × （守備選手Infield Range平均 / 70）
17. When 右打ちシフトまたは左打ちシフトが適用され、シフト方向にゴロが飛ぶ、the Game System shall 内野安打の発生率を以下のように補正する：最終補正 = -30% × （守備選手Infield Range平均 / 70）
18. When 右打ちシフトまたは左打ちシフトが適用され、逆方向にゴロが飛ぶ、the Game System shall 内野安打の発生率を以下のように補正する：最終補正 = +40% × （80 / 守備選手Infield Range平均）（守備穴を反映）
19. When 極端シフトが適用され、引っ張り方向にゴロが飛ぶ、the Game System shall 以下の補正を適用する：
    - 内野安打発生率補正 = -50% × （守備選手Infield Range平均 / 70）
    - アウト確率補正 = +20% × （守備選手Infield Range平均 / 70）
20. When 極端シフトが適用され、逆方向にゴロが飛ぶ、the Game System shall 以下の補正を適用する：
    - 内野安打発生率補正 = +60% × （80 / 守備選手Infield Range平均）
    - 確実安打確率補正 = +30%（守備穴が大きいため、能力値に関わらず適用）
21. When 前進守備が適用され、打者が内野ゴロを打つ、the Game System shall 内野手の平均Infield Arm値に応じて一塁到達までの時間短縮と打者走者のアウト確率を漸進的に補正する：時間短縮 = -0.3秒 × （平均Infield Arm / 65）、アウト確率補正 = +25% × （平均Infield Arm / 65）を適用する
22. When 前進守備が適用され、三塁ランナーがいる状態でゴロが打たれる、the Game System shall 内野手の平均Infield Armと捕手のCatcher Abilityに応じて本塁到達阻止確率を漸進的に補正する：阻止確率補正 = +40% × （（平均Infield Arm + Catcher Ability）/ 2 / 65）を適用する

**守備シフトが打撃結果に与える効果：フライ・ライナー打球**
24. When 深守備が適用され、打者が外野フライを打つ、the Game System shall 外野手のOutfield Range平均値に応じて守備範囲拡大と長打性打球のアウト確率を漸進的に補正する：範囲拡大 = +20% × （平均Outfield Range / 70）、アウト確率補正 = +15% × （平均Outfield Range / 70）を適用する
25. When 深守備が適用され、打者が内野フライを打つ、the Game System shall 内野手のInfield Range平均値に応じて処理範囲縮小とポテンヒット発生率を漸進的に補正する：範囲縮小 = -10% × （80 / 平均Infield Range）、ポテンヒット補正 = +15% × （80 / 平均Infield Range）を適用する
26. When 前進守備が適用され、打者が外野フライを打つ、the Game System shall 外野手のOutfield Range平均値に応じて処理範囲縮小と長打発生率を漸進的に補正する：範囲縮小 = -10% × （80 / 平均Outfield Range）、長打補正 = +10% × （80 / 平均Outfield Range）を適用する
27. When シフトが適用され、打者がライナーを打つ、the Game System shall シフト方向の守備選手のRange値とシフト種類（通常/極端）に応じて捕球確率を漸進的に補正する：シフト方向捕球確率 = 基本補正（通常+15%/極端+25%）× （シフト方向守備Range / 70）、逆方向捕球確率 = 基本補正（通常-20%/極端-40%）× （70 / 逆方向守備Range）を適用する

**守備シフトが打撃結果に与える効果：長打と進塁**
29. When 右打ちシフトまたは左打ちシフトが適用され、打者が二塁打を打つ、the Game System shall シフト逆方向への二塁打の発生率を+20%上昇させる
30. When 極端シフトが適用され、打者が二塁打を打つ、the Game System shall シフト逆方向への二塁打の発生率を+35%上昇させる
31. When 極端シフトが適用され、打者が三塁打を打つ、the Game System shall シフト逆方向への三塁打の発生率を+50%上昇させる
32. When 深守備が適用され、打者が三塁打を打つ、the Game System shall 三塁打の発生率を-20%低下させ、二塁打に変換する確率を+15%上昇させる
33. When 前進守備が適用され、打者が二塁打を打つ、the Game System shall 二塁打の発生率を+10%上昇させ、一塁ランナーの本塁到達確率を+15%上昇させる
34. When シフトが適用され、ランナーが塁上にいる状態でヒットが出る、the Game System shall シフト逆方向のヒットでランナーの追加進塁確率を+20%上昇させる（守備位置が空いているため）

**守備シフトが打撃結果に与える効果：特殊状況**
35. When 極端シフトが適用され、打者のContact能力が70以上である、the Game System shall 打者が逆方向を狙う確率を+30%上昇させ、シフトを逆手に取る打撃を実行する
36. When 極端シフトが適用され、打者のBunt for Hit（セーフティバント能力）が60以上である、the Game System shall 打者が無人の逆方向側にバントヒットを試みる確率を+40%上昇させる
37. When 前進守備が適用され、打者が強振する、the Game System shall 外野を抜ける長打の発生率を+15%上昇させる（外野手が前寄りのため）
38. When 深守備が適用され、打者が内野安打を狙う、the Game System shall 内野安打の成功率を+25%上昇させる（内野手が後寄りのため）
39. When シフトが適用され、打者が意図的に逆方向を狙う、the Game System shall Contact能力を-10%低下させる（通常より難しい打撃のため）
40. When シフトが適用され、ダブルプレー機会が発生する、the Game System shall シフト方向のゴロでダブルプレー成功率を+15%上昇させ、逆方向のゴロでダブルプレー成功率を-30%低下させる

**守備シフトの視覚的フィードバックと実況**
41. When 守備シフトが選択される、the Game System shall 「（監督）○○シフト指示！」とテキストで表示する
42. When シフトが適用された状態で打球が処理される、the Game System shall シフトの効果を実況テキストに含める（例：「右打ちシフトの効果で二塁手が難なく処理！」）
43. When シフトの逆を突かれる、the Game System shall 「シフトの逆を突く見事なヒット！」などの実況を表示する
44. When 極端シフトが適用され、大きな効果を発揮する、the Game System shall 「極端シフトが的中！完璧なアウト！」と強調表示する
45. When 極端シフトが適用され、逆方向に長打を許す、the Game System shall 「シフトの裏をかかれた！痛恨の長打！」と表示する
46. The Game System shall 守備シフト選択画面で各シフトの効果を簡潔に説明する（例：「右打ちシフト: 右方向の打球に強い、左方向に弱い」）
47. The Game System shall 守備シフト適用中、スコアボード付近にシフト表示アイコン（例：[→シフト]）を常時表示する

**守備シフトの統計と成功率追跡**
48. The Game System shall 試合中に使用した守備シフトの回数と成功率を記録する
49. When 試合が終了する、the Game System shall 守備シフトの効果統計（「右打ちシフト使用5回、アウト4回、安打1回」など）を表示する
50. The Game System shall 過去の試合における各守備シフトの成功率を集計し、戦績画面で表示する
51. When プレイヤーが守備シフト統計を確認する、the Game System shall 各シフトタイプの使用回数、成功率、失敗時の被長打率を表示する
52. The Game System shall 特定の打者に対する守備シフトの効果履歴を記録し、「この打者には○○シフトが有効」と推奨する機能を提供する

**CPU操作チームの守備シフト判断（Requirement 10への追加）**
53. When CPU操作チームが守備シフトを判断する、the Game System shall 打者の打球傾向データが利用可能な場合、適切なシフトを40-60%の確率で選択する
54. When 打者のHR Power 80以上である、the Game System shall CPU操作チームが極端シフトを選択する確率を1.5倍に上昇させる
55. When ランナーが得点圏（二塁または三塁）にいる、the Game System shall CPU操作チームが守備シフトを選択しない（通常守備優先）
56. When CPU難易度が「上級」である、the Game System shall CPU操作チームが守備シフトを最適に活用し、選択確率を70-80%に上昇させる
57. When CPU難易度が「初級」である、the Game System shall CPU操作チームが守備シフトをほとんど使用せず、選択確率を10-20%に低下させる

**試合状況に応じた戦術調整**
51. When 7回以降で5点差以上でリードしている、the Game System shall 守備的戦術（投手温存、通常打撃中心）を採用する
52. When 7回以降で3点差以上で負けている、the Game System shall 攻撃的戦術（通常打撃中心、盗塁増加）を採用する
53. When 9回裏で負けている状態で最後の攻撃である、the Game System shall 代打・代走を積極的に起用する
54. When 延長戦に突入する、the Game System shall 投手の疲労管理を優先し早めの投手交代を行う
55. When 延長戦で先頭打者が出塁する、the Game System shall バント指示の選択確率を通常の2倍に上昇させる

**選手交代の判断**
56. When 7回以降で打順が投手に回る、the Game System shall ランナーが得点圏にいる場合、代打を70-90%の確率で起用する
57. When 7回以降で打順が投手に回る、the Game System shall ランナーがいない場合、代打を30-50%の確率で起用する
58. When 代打を起用する、the Game System shall ベンチから最も高いContact能力またはHR Powerを持つ選手を選択する
59. When 8回以降で2点差以内でリードしている、the Game System shall 守備固めを50-70%の確率で実行する
60. When 守備固めを実行する、the Game System shall 最も高いInfield/Outfield RangeとError評価を持つ選手に交代する
61. When 9回以降でランナーが塁に出る、the Game System shall Speed 70以上の代走を30-50%の確率で起用する
62. When 代走を起用する、the Game System shall ベンチから最も高いSpeedとStealing Abilityを持つ選手を選択する

**難易度別のAI調整**
63. When CPU難易度が「初級」である、the Game System shall 最適でない指示を30-40%の確率で選択する
64. When CPU難易度が「初級」である、the Game System shall 投手交代判断を遅らせ、投球数+20球まで継続させる
65. When CPU難易度が「中級」である、the Game System shall 最適でない指示を15-20%の確率で選択する
66. When CPU難易度が「上級」である、the Game System shall ほぼ最適な指示を選択し、ミス判断を5%未満に抑える
67. When CPU難易度が「上級」である、the Game System shall 選手能力とマッチアップを詳細に分析し高度な戦術（左右の投打対決など）を活用する

**AI判断の透明性と演出**
68. When CPU操作チームが特殊な戦術（バント、盗塁、敬遠など）を選択する、the Game System shall 「（CPU監督）バント指示！」などの実況テキストを表示する
69. When CPU操作チームが選手交代を実行する、the Game System shall 「（CPU監督）○○選手に交代！」と表示する
70. The Game System shall CPU操作チームの戦術判断過程をプレイヤーに見せない（結果のみ表示）
71. When デバッグモードが有効である、the Game System shall CPU操作チームの判断理由（「打者の能力が低いためバント選択」など）をログに出力する
72. The Game System shall CPU操作チームの戦術パターンに変化を持たせ、プレイヤーが予測しづらいようにする

**プレイヤーからCPU AIへの指示委譲**
73. When プレイヤーの攻撃または守備ターンで指示選択画面が表示される、the Game System shall 「AI委譲」または「おまかせ」オプションを選択肢に含める
74. When プレイヤーが「AI委譲」を選択する、the Game System shall CPU AI戦術判断ロジックを使用してプレイヤーチームの指示を自動決定する
75. When AI委譲で指示が決定される、the Game System shall 決定された指示内容を「（AI推奨）○○の指示！」と表示する
76. The Game System shall AI委譲で決定された指示を実行前にプレイヤーに確認するオプションを提供する（「確認モード」）
77. When 確認モードが有効である、the Game System shall AI推奨指示を表示し「実行する/別の指示を選ぶ」の選択肢を提示する
78. When プレイヤーが「別の指示を選ぶ」を選択する、the Game System shall 通常の指示選択画面に戻る
79. When 確認モードが無効である、the Game System shall AI推奨指示を即座に実行する
80. The Game System shall プレイヤーが設定画面で「常にAI委譲」モードを有効化できる機能を提供する
81. When 「常にAI委譲」モードが有効である、the Game System shall 全ての打席と守備機会で自動的にAI委譲を実行する
82. When 「常にAI委譲」モードが有効である、the Game System shall プレイヤーが任意のタイミングで「手動操作に戻す」ボタンを押せるようにする
83. When プレイヤーが「手動操作に戻す」を選択する、the Game System shall 次の打席または守備機会から通常の指示選択に戻る
84. The Game System shall AI委譲時の判断難易度をプレイヤーが設定できる機能を提供する（保守的/標準/積極的）
85. When AI委譲判断難易度が「保守的」である、the Game System shall リスクの高い戦術（盗塁、スクイズ）の選択確率を50%低下させる
86. When AI委譲判断難易度が「積極的」である、the Game System shall リスクの高い戦術（盗塁、スクイズ、エンドラン）の選択確率を50%上昇させる
87. When AI委譲が実行される、the Game System shall プレイヤーチームの選手能力とCPU AI戦術判断ロジックを使用し、プレイヤーチームに最適な指示を選択する
88. When デバッグモードが有効である、the Game System shall AI委譲時の判断理由（「ランナー一塁でSacrifice Bunt 65のためバント選択」など）をログに出力する
89. The Game System shall AI委譲機能の使用統計（使用回数、成功率）を記録し、プレイヤーが確認できる機能を提供する
90. When プレイヤーがAI委譲統計を確認する、the Game System shall 「AI委譲使用回数」「AI委譲時の得点率」「AI委譲時の勝率」を表示する

**イニング/試合単位でのAI委譲**
91. The Game System shall プレイヤーが「このイニングをAIに委譲」オプションを選択できる機能を提供する
92. When プレイヤーが「このイニングをAIに委譲」を選択する、the Game System shall そのイニングの全打席と守備機会をAI委譲で処理する
93. When イニング委譲が有効である、the Game System shall イニング終了後に「手動操作に戻りますか？」と確認する
94. The Game System shall プレイヤーが「試合全体をAIに委譲」オプションを選択できる機能を提供する
95. When プレイヤーが「試合全体をAIに委譲」を選択する、the Game System shall 試合終了まで全てをAI委譲で処理し、結果のみを表示する
96. When 試合全体委譲が有効である、the Game System shall プレイヤーが任意のタイミングで「Escキー」または「中断ボタン」を押して手動操作に戻れるようにする
97. The Game System shall 試合全体委譲時に、重要な場面（得点シーン、選手交代、投手交代）のみをハイライト表示するオプションを提供する
98. When ハイライトモードが有効である、the Game System shall 通常のプレイは省略し、重要プレイのみを実況テキストで表示する

**特定場面でのAI推奨表示**
99. When プレイヤーが指示選択画面で一定時間（5秒以上）操作しない、the Game System shall 「AI推奨: ○○」とヒントを表示する
100. When プレイヤーが指示選択画面で「?」または「ヘルプ」ボタンを押す、the Game System shall AI推奨指示とその理由（「盗塁成功率70%のため推奨」など）を表示する
101. The Game System shall AI推奨表示機能の有効/無効を設定で切り替えられるようにする
102. When プレイヤーが初心者モードを選択する、the Game System shall デフォルトでAI推奨表示を有効化する
103. When AI推奨が表示される、the Game System shall 推奨理由を簡潔に説明する（例：「ランナー一塁、Sacrifice Bunt能力高、接戦のためバント推奨」）

**AI学習と適応（将来拡張）**
104. The Game System shall CPU操作チームの戦術成功率を記録し、効果的な戦術の選択頻度を調整する機能を提供する（オプション機能）
105. When プレイヤーが特定の戦術を多用する、the Game System shall CPU操作チームがそれに対応する守備戦術を採用する確率を上昇させる（オプション機能）
106. The Game System shall 各CPU操作チームに「戦術傾向」（攻撃的/守備的/バランス型）を設定し、判断に反映させる機能を提供する（オプション機能）
