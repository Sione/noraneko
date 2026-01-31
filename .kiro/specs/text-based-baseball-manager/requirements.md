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
6. When 通常打撃が実行される、the Game System shall 打者の打率を基準確率として使用する
7. When ヒットが出る、the Game System shall 打者の長打力に基づいて単打/二塁打/三塁打/本塁打を判定する
8. When アウトになる、the Game System shall ゴロアウト、フライアウト、三振などのアウト種類を判定する
9. When 投手の疲労度が高い、the Game System shall 打者有利に確率を補正する
10. When 打者のコンディションが好調である、the Game System shall ヒット確率を5-10%上昇させる

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
**Objective:** 監督として、選手やチームの状態を詳細に把握したい、選手の特性を活かした適切な指示判断ができるようにするため

#### Acceptance Criteria

**選手能力データの保持と管理**
1. The Game System shall 各選手の打撃能力（打率、長打率、出塁率、対左右投手別成績）をデータとして保持する
2. The Game System shall 各選手の身体能力（走力、守備力、肩力）を数値またはランク形式で保持する
3. The Game System shall 投手の能力（球速、制球力、スタミナ、球種）をデータとして保持する
4. The Game System shall 各選手の守備位置（主ポジション、サブポジション）を記録する
5. The Game System shall 試合中の選手のコンディション（好調、普通、不調）を状態として保持する

**チーム編成と打順管理**
6. When プレイヤーがチーム情報を要求する、the Game System shall スターティングメンバー（打順、守備位置）とベンチメンバーを表示する
7. When 試合開始前である、the Game System shall プレイヤーに打順と守備位置の編集機能を提供する
8. If プレイヤーが不適切な守備配置（投手以外が投手など）を設定する、then the Game System shall 警告を表示し修正を促す
9. The Game System shall ベンチに最低5名以上の控え選手を配置する

**試合中の選手状態表示**
10. When 打者が打席に入る、the Game System shall 打者の名前、打率、今試合の成績（打数、安打数）を表示する
11. When プレイヤーが打者の詳細情報を要求する、the Game System shall 長打率、対左右投手成績、走力を追加表示する
12. When 投手が登板中である、the Game System shall 投手名、投球数、被安打数、奪三振数を表示する
13. While 投手が投げている、the Game System shall 投球数と疲労度をリアルタイムで追跡する

**投手の疲労管理**
14. The Game System shall 投手の疲労度を投球数に応じて段階的に増加させる（例：0-50球=新鮮、51-80球=普通、81-100球=疲労、100球超=限界）
15. If 投手の疲労度が「疲労」以上に達する、then the Game System shall 被安打確率とコントロールを悪化させる
16. If 投手の投球数が設定された閾値（例：100球）を超える、then the Game System shall 監督に投手交代を推奨する警告を表示する
17. When 投手交代が実行される、the Game System shall 新しい投手の疲労度を初期状態にリセットする

**選手交代システム**
18. When プレイヤーが選手交代を要求する、the Game System shall ベンチメンバー一覧と交代可能なポジションを表示する
19. When 野手が交代する、the Game System shall 交代後の打順を自動的に引き継ぐ
20. The Game System shall 一度交代した選手は再出場できないルールを適用する
21. If 代打が起用される、then the Game System shall その打席のみ代打を適用し次の打席から正式に交代するか選択させる

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
