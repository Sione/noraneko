# Research & Design Decisions

---
**Purpose**: テキストベース野球監督ゲームの設計を支える調査結果、アーキテクチャ評価、設計判断の根拠を記録

**Usage**:
- 発見フェーズの研究活動と成果を記録
- `design.md`に含めるには詳細すぎる設計判断のトレードオフを文書化
- 将来の監査や再利用のための参照と証拠を提供
---

## Summary
- **Feature**: `text-based-baseball-manager`
- **Discovery Scope**: 新機能（greenfield）- 包括的な発見が必要
- **Key Findings**:
  - 状態機械パターンが試合フローと戦術指示管理に最適
  - 確率ベース野球シミュレーションにはLog5/Odds Ratio Methodと決定木アプローチが業界標準
  - Python + TextualによるTUIが最も保守性とユーザビリティのバランスが良い
  - OOTP26の85能力値システムは複雑だがSQLiteで効率的に管理可能

## Research Log

### テキストベースゲームのアーキテクチャパターン

- **Context**: ゲーム全体の構造パターンを決定する必要があった
- **Sources Consulted**:
  - [Game Programming Patterns - State Machine](https://gameprogrammingpatterns.com/state.html)
  - [Python State Machine Documentation](https://python-statemachine.readthedocs.io/en/stable)
  - TypeScript State Machine patterns (Ourcade blog)
- **Findings**:
  - 状態機械パターンは試合フロー、イニング管理、打席状態の管理に最適
  - 複数のbooleanフラグを使用するアプローチは保守性が低く、状態機械は明確な状態遷移を保証
  - Python-statemachineライブラリ（2.5.0+）は遷移、イベント、条件、バリデータ、非同期操作をサポート
  - onEnter、onUpdate、onExitの3フェーズフックが標準パターン
- **Implications**:
  - GameStateManagerコンポーネントで状態機械を実装
  - 試合状態（メニュー、試合中、イニング間、試合終了）を明示的に定義
  - 各状態での有効なアクションと遷移を厳密に制御

### 野球シミュレーションエンジンの確率計算手法

- **Context**: リアルな打席結果をどのように計算するかの調査
- **Sources Consulted**:
  - [POSBE - Probabilistic Open Source Baseball Engine](https://docs.lib.purdue.edu/open_access_theses/812/)
  - [Whalehead League: Batter/Pitcher Matchups](https://whaleheads.com/2018/06/20/the-game-engine-simulating-the-batter-pitcher-matchups/)
  - [BayesBall probabilistic modeling](https://chris-french.github.io/BayesBall/)
- **Findings**:
  - **Odds Ratio Method**（Log5の変種）が打者-投手対決の確率計算の業界標準
  - 打者の能力値、投手の能力値、リーグ平均を組み合わせて確率を算出
  - **決定木（連鎖二項モデル）**で結果を階層的に決定：死球 → 四球 → コンタクト → 本塁打 → 安打 → 長打 → 二塁打/三塁打
  - ゲーム状態は4変数（イニング、アウト、走者、スコア）で完全に記述可能
  - POSBE はKolmogorov-Smirnov検定でMLBデータと統計的に一致することを検証済み
- **Implications**:
  - PlaySimulationEngineコンポーネントで確率計算を実装
  - PlayerAbilityクラスでOOTP26の能力値を保持
  - リーグ平均データを設定ファイルで管理
  - 決定木アプローチで順次判定（確率の合計=1を保証）

### ターミナルUIライブラリの選定

- **Context**: テキストベースゲームのUI実装方法を決定
- **Sources Consulted**:
  - [Rich GitHub Repository](https://github.com/textualize/rich) - 55.3k stars
  - [Textual GitHub Repository](https://github.com/Textualize/textual) - 33.8k stars
  - [Rich Documentation](https://rich.readthedocs.io/en/latest/)
  - [Arjan Codes: Building Interactive Terminal Apps with Textual](https://arjancodes.com/blog/textual-python-library-for-creating-interactive-terminal-applications/)
- **Findings**:
  - **Rich**: テキストフォーマット、テーブル、進捗バー、パネル、ツリーなどの表示に特化
  - **Textual**: Richの上に構築された完全な対話型アプリケーションフレームワーク
  - Textualはボタン、入力フィールド、イベントハンドリング、状態管理を提供
  - 両方ともTextualize社が保守、MITライセンス、Pythonエコシステムで確立
  - Textualはターミナルとウェブブラウザの両方で実行可能
- **Implications**:
  - **Textualを採用**: 対話型メニュー、リアルタイムスコアボード更新、複雑なUI構築に最適
  - Richはログ表示やテーブル表示のユーティリティとして併用
  - クロスプラットフォーム対応が容易

### ゲームデータ永続化戦略

- **Context**: 試合履歴、選手データ、設定の保存方法を決定
- **Sources Consulted**:
  - [Python JSON documentation](https://docs.python.org/3/library/json.html)
  - [Python SQLite3 documentation](https://docs.python.org/3/library/sqlite3.html)
  - [Real Python: SQLite and SQLAlchemy](https://realpython.com/python-sqlite-sqlalchemy/)
- **Findings**:
  - **JSON**: シンプルなセーブデータに適し、人間可読で デバッグが容易
  - **SQLite**: 複雑な関係データ、クエリ、スケーラビリティに優れる
  - SQLiteは単一ファイルで軽量、サーバー不要、Python標準ライブラリで完全サポート
  - OOTP26の85能力値×選手数は構造化データベースで管理する方が効率的
- **Implications**:
  - **SQLiteを採用**: 選手データ、能力値、試合履歴、統計を管理
  - JSONは設定ファイル（リーグ平均、ゲーム設定）に使用
  - DataPersistenceLayerでSQLite操作を抽象化
  - 将来的にPostgreSQLへの移行が容易

### OOTP26能力値システムの実装戦略

- **Context**: 85項目の詳細な選手能力システムをどう実装するか
- **Findings**:
  - 打撃能力10項目、投手能力10項目、走塁7項目、バント4項目、守備9項目、状態管理5項目、等
  - 全て1-100スケールで統一、色分け表示（青/緑/黄/橙/赤）
  - 対左右投手分離評価、ポジション別守備適性、疲労度管理が複雑
- **Implications**:
  - PlayerAbilityクラスを分割: BattingAbility, PitchingAbility, DefensiveAbility, BaserunningAbility
  - データベーステーブル設計: players, batting_abilities, pitching_abilities, defensive_abilities
  - Enumで能力値範囲を定義し型安全性を確保
  - 能力値計算ロジックをAbilityCalculatorサービスに集約

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| MVC (Model-View-Controller) | UI、ロジック、データを分離 | シンプル、理解しやすい | ゲーム特有の状態管理に弱い | 小規模ゲームには適するが、複雑な状態遷移には不十分 |
| State Machine + Layered | 状態機械をコアに、レイヤードアーキテクチャを組み合わせ | 状態遷移が明確、保守性が高い | 状態数が多いと複雑化 | **選択**: ゲームフロー管理に最適、野球の明確な状態（イニング、打席）にマッチ |
| Event-Driven | イベントベースの非同期処理 | スケーラビリティ | 単一プレイヤーゲームにはオーバーキル | 将来のマルチプレイヤー対応には有効だが現時点では不要 |
| Hexagonal (Ports & Adapters) | ドメインロジックを中心に外部依存を抽象化 | テスタビリティ、疎結合 | レイヤーが多く初期開発が遅い | 大規模システムには適するが、このゲームサイズには過剰 |

**選択したパターン**: **State Machine + Layered Architecture**
- ゲーム状態の明確な管理
- UI層、ビジネスロジック層、データ層の分離
- テスト容易性とメンテナンス性のバランス

## Design Decisions

### Decision: `Python + Textual によるTUI実装`

- **Context**: テキストベースゲームのUI技術スタックを選定
- **Alternatives Considered**:
  1. **Pure CLI (print/input)** — 最もシンプルだが、リアルタイム更新やリッチUIが困難
  2. **Curses** — 低レベルTUIライブラリだが、クロスプラットフォーム対応が難しい
  3. **Rich only** — 表示は綺麗だが、対話型コンポーネントが不足
  4. **Textual** — Rich上に構築された完全な対話型フレームワーク
- **Selected Approach**: Textual + Rich の組み合わせ
  - Textualで対話型UI（メニュー、ボタン、入力フィールド）
  - Richでテキスト装飾、テーブル、ログ表示
- **Rationale**:
  - クロスプラットフォーム対応が容易（Windows, macOS, Linux）
  - リアルタイムスコアボード更新が可能
  - イベント駆動型UIで状態管理が自然
  - 大規模コミュニティとアクティブなメンテナンス
- **Trade-offs**:
  - **利点**: 美しいUI、保守性、開発速度
  - **欠点**: 純粋なCLIより依存関係が増える（許容範囲内）
- **Follow-up**: Textualのバージョン安定性を継続監視

### Decision: `SQLite による選手データ永続化`

- **Context**: 85能力値 × 数十人の選手データを効率的に管理
- **Alternatives Considered**:
  1. **JSON files** — シンプルだが、クエリが非効率、データ整合性が弱い
  2. **CSV files** — 軽量だが、構造化データに不向き
  3. **SQLite** — 軽量RDB、クエリ可能、整合性保証
  4. **PostgreSQL** — 強力だが、このスケールにはオーバーキル
- **Selected Approach**: SQLite + Python sqlite3標準ライブラリ
- **Rationale**:
  - 単一ファイルで配布が容易（`~/.baseball_game/game.db`）
  - 複雑なクエリ（統計集計、フィルタリング）が効率的
  - 外部キー、トランザクション、インデックスで整合性保証
  - 将来的にPostgreSQLへの移行パスが明確
- **Trade-offs**:
  - **利点**: クエリ効率、データ整合性、スケーラビリティ
  - **欠点**: JSON より若干複雑（マイグレーション管理が必要）
- **Follow-up**: Alembicでスキーママイグレーションを管理

### Decision: `確率計算にOdds Ratio Method + 決定木を採用`

- **Context**: リアルな野球シミュレーションの実装方法
- **Alternatives Considered**:
  1. **単純な乱数** — 実装は簡単だが、リアリティが低い
  2. **Bayesian model** — 精度は高いが実装が複雑
  3. **Odds Ratio + Decision Tree** — 業界標準、実装可能、検証済み
- **Selected Approach**: Odds Ratio Method（Log5変種）+ 連鎖決定木
- **Rationale**:
  - POSBE論文でMLBデータと統計的整合性が検証済み
  - 打者能力、投手能力、リーグ平均の3要素で確率計算
  - 決定木で結果を段階的に判定（死球→四球→コンタクト→本塁打→…）
  - OOTP26の能力値システムと自然に統合可能
- **Trade-offs**:
  - **利点**: 実証済み、実装可能、リアリズム
  - **欠点**: リーグ平均データの初期設定が必要
- **Follow-up**: リーグ平均データをMLB 2025統計から抽出

### Decision: `状態機械によるゲームフロー管理`

- **Context**: 試合の複雑な状態遷移を管理
- **Selected Approach**: Python-statemachine ライブラリを使用した状態機械パターン
- **States**:
  - `MainMenu`: メインメニュー
  - `TeamSelection`: チーム選択
  - `InGame`: 試合中（サブ状態: AtBat, BetweenInnings, PitcherChange）
  - `GameEnd`: 試合終了画面
  - `History`: 試合履歴閲覧
- **Rationale**:
  - 各状態で有効なアクションを明確に定義
  - 不正な状態遷移を防止（例: 試合中に新規試合開始）
  - テスト可能性が高い（各状態を独立してテスト）
- **Trade-offs**:
  - **利点**: 保守性、デバッグ容易性、拡張性
  - **欠点**: 初期設計に時間がかかる（長期的にはメリット）

### Decision: `コンポーネントの責任分離`

- **Context**: モジュール間の依存関係と責任範囲を明確化
- **Selected Approach**: レイヤードアーキテクチャ + 状態機械
  - **Presentation Layer**: TextualによるUI（Screens, Widgets）
  - **Application Layer**: ゲームロジック（GameController, StateManager）
  - **Domain Layer**: ビジネスルール（PlaySimulator, AbilityCalculator）
  - **Data Layer**: 永続化（DataPersistence, SQLite）
- **Rationale**:
  - 各レイヤーが明確な責任を持つ
  - 上位レイヤーが下位レイヤーに依存（逆は禁止）
  - テストとモック化が容易
- **Trade-offs**:
  - **利点**: 保守性、テスタビリティ、並行開発可能性
  - **欠点**: レイヤー間のインターフェース定義が必要

## Risks & Mitigations

- **Risk 1: OOTP26の85能力値システムが複雑すぎて実装期間が延びる**
  - **Mitigation**: フェーズ1で基本能力のみ実装（Contact, Power, Speed など10-15項目）、フェーズ2で詳細能力を追加
  
- **Risk 2: 確率計算のバランス調整が難しい**
  - **Mitigation**: リーグ平均データを設定ファイルで外部化、実際のMLBデータで検証、調整用のデバッグモードを実装
  
- **Risk 3: Textual ライブラリの学習曲線**
  - **Mitigation**: 公式チュートリアル、サンプルアプリを参考に、プロトタイプで主要パターンを検証
  
- **Risk 4: SQLite マイグレーション管理の複雑化**
  - **Mitigation**: Alembic を早期導入、スキーマ変更を厳密にバージョン管理
  
- **Risk 5: パフォーマンス問題（大量の確率計算）**
  - **Mitigation**: 計算結果のキャッシュ、プロファイリングツールで ボトルネック特定、必要に応じて Cython/Numba で最適化

## References

- [Game Programming Patterns - State Machine](https://gameprogrammingpatterns.com/state.html)
- [Python State Machine Documentation](https://python-statemachine.readthedocs.io/en/stable/)
- [POSBE - Probabilistic Open Source Baseball Engine](https://docs.lib.purdue.edu/open_access_theses/812/)
- [Textual GitHub Repository](https://github.com/Textualize/textual)
- [Rich GitHub Repository](https://github.com/textualize/rich)
- [Python SQLite3 Documentation](https://docs.python.org/3/library/sqlite3.html)
- [OOTP Baseball Wiki - Player Ratings](https://wiki.ootpdevelopments.com/index.php?title=OOTP_Baseball:Screens_and_Menus/Player_Profile/Player_Ratings)
