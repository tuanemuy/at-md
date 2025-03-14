# 実装計画

このドキュメントでは、プロジェクトの実装計画を段階的に記述します。ドメイン駆動設計の原則に従い、関数型アプローチで実装を進めます。

## 各ステップの進め方

- **ステップごとに**イテレーションを回してください
- **必ず**以下の手順に従って進めてください。

作業の途中で設計を変更する場合は、先に `docs/*.md` を修正してください。

1. 行う作業内容を確認する
2. `docs/*.md` の設計を確認する
3. 実装するモジュールのインターフェースと型を考える
4. 実装を行う
5. テストを実装する（`./test.mdc`）
6. テストを行う（`pnpm test`）
7. 型チェックを行う（`pnpm typecheck`）
8. 型エラーを修正する
9. 静的解析を行う（`pnpm lint`）
10. リンターエラーを修正する
11. テストを行う（`pnpm test`）
12. 実装を修正する
13. エラーが無くなるまで5~11を繰り返す
14. ユーザーに確認する

## フェーズ1: 共有カーネルの実装

### ステップ1. 共通型／インターフェース定義の実装

- [ ] ID値オブジェクト
- [ ] Result型（neverthrow）
- [ ] 共通エラー型

### ステップ2. 基本インフラストラクチャの実装

- [ ] ロギング機能
- [ ] DIコンテナの設定

## フェーズ2: ドメイン層の実装

### ステップ2.1 アカウント管理コンテキスト

- [ ] User エンティティ
- [ ] Session エンティティ
- [ ] GitHubConnection エンティティ
- [ ] 値オブジェクト（DID, SessionToken など）
- [ ] UserRepository インターフェース
- [ ] SessionRepository インターフェース
- [ ] AuthService
- [ ] GitHubService
- [ ] SessionService

### ステップ2.2 ノート管理コンテキスト

- [ ] Note エンティティ
- [ ] Book エンティティ
- [ ] Tag エンティティ
- [ ] 値オブジェクト（BookDetails, TagName など）
- [ ] NoteRepository インターフェース
- [ ] BookRepository インターフェース
- [ ] TagRepository インターフェース
- [ ] SyncService
- [ ] TagService

### ステップ2.3 投稿管理コンテキスト

- [ ] Post エンティティ
- [ ] 値オブジェクト（PostStatus, BlueskyURI, Engagement など）
- [ ] PostRepository インターフェース
- [ ] PostingService
- [ ] EngagementService

## フェーズ3: インフラストラクチャ層の実装

### ステップ3.1 データベース基盤

- [ ] Drizzle ORM設定
- [ ] スキーマ定義
- [ ] 初期スキーマ作成
- [ ] マイグレーションスクリプト

### ステップ3.2 リポジトリ実装

- [ ] DrizzleUserRepository
- [ ] DrizzleSessionRepository
- [ ] DrizzleNoteRepository
- [ ] DrizzleBookRepository
- [ ] DrizzleTagRepository
- [ ] DrizzlePostRepository

### ステップ3.3 外部サービス連携

- [ ] GitHubAppClient
- [ ] GitHubContentClient
- [ ] WebhookHandler
- [ ] BlueskyAuthClient
- [ ] BlueskyClient
- [ ] セッション管理
- [ ] トークン検証

## フェーズ4: アプリケーション層の実装

### ステップ4.1 アカウント管理ユースケース

- [ ] AuthenticateWithBlueskyUseCase
- [ ] ValidateSessionUseCase
- [ ] LogoutUseCase
- [ ] ConnectGitHubUseCase
- [ ] DisconnectGitHubUseCase
- [ ] ListGitHubConnectionsUseCase
- [ ] GetUserByIdUseCase
- [ ] UpdateUserUseCase
- [ ] DeleteUserUseCase

### ステップ4.2 ノート管理ユースケース

- [ ] AddBookUseCase
- [ ] ListBooksUseCase
- [ ] GetBookUseCase
- [ ] DeleteBookUseCase
- [ ] SyncNotesUseCase
- [ ] ListNotesUseCase
- [ ] GetNoteUseCase
- [ ] SearchNotesUseCase
- [ ] ListTagsUseCase
- [ ] FilterNotesByTagUseCase
- [ ] ProcessWebhookUseCase
- [ ] CheckBookSyncStatusUseCase

### ステップ4.3 投稿管理ユースケース

- [ ] PostNoteUseCase
- [ ] CheckPostStatusUseCase
- [ ] GetEngagementUseCase

## フェーズ5: API実装

### ステップ5.1 認証API

- [ ] ログインAPI
- [ ] セッション検証API
- [ ] ログアウトAPI

### ステップ5.2 ノート管理API

- [ ] ブック管理API
- [ ] ノート管理API
- [ ] タグ管理API
- [ ] Webhook受信API

### ステップ5.3 投稿管理API

- [ ] 投稿API
- [ ] エンゲージメント取得API

## フェーズ6: UI実装

### ステップ6.1 共通コンポーネント

- [ ] 基本UIコンポーネント（ボタン、入力フォーム、カードなど）
- [ ] レイアウトコンポーネント
- [ ] ログインフォーム
- [ ] ユーザープロファイル

### ステップ6.2 機能別ページ

- [ ] ログインページ
- [ ] 設定ページ
- [ ] ブック一覧ページ
- [ ] ノート一覧ページ
- [ ] ノート詳細ページ
- [ ] 投稿フォーム
- [ ] 投稿履歴ページ

## フェーズ7: テストと最適化

### ステップ7.1 テスト強化

- [ ] 単体テストの拡充
- [ ] 統合テストの実装
- [ ] E2Eテストの実装

### ステップ7.2 パフォーマンス最適化

- [ ] クエリ最適化
- [ ] キャッシュ戦略の実装
- [ ] 非同期処理の最適化

### ステップ7.3 セキュリティ強化

- [ ] 入力検証の強化
- [ ] 認証・認可の見直し
- [ ] セキュリティヘッダーの設定
