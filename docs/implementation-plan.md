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
5. 必要ならテストを実装する（`./test.mdc`）
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

### ステップ1.1 外部ユーティリティーの実装

- [x] ロギング機能の実装（構造化ロギング・グローバルシングルトン）
- [x] Result型の実装（neverthrowの活用）

### ステップ1.2 共通型／インターフェース定義の実装

- [x] ID型の実装（UUIDベース）
- [x] 日付型の実装
- [x] 共通エラー型の実装（AnyError）
- [x] バリデーション用のZodスキーマ定義

## フェーズ2: ドメイン層の実装

### ステップ2.1 アカウント管理コンテキスト

- [x] エンティティの実装（User, GitHubConnection）
- [x] 値オブジェクトの実装（Profile, Session）
- [x] DTOの実装（GitHubInstallation）
- [x] エラー型の実装（AccountError）
- [x] バリデーション関数の実装
- [x] リポジトリインターフェースの定義
- [x] アダプターインターフェースの定義
- [x] ユースケースインターフェースの定義

### ステップ2.2 ノート管理コンテキスト

- [x] エンティティの実装（Note, Book, Tag）
- [x] 値オブジェクトの実装（BookDetails, SyncStatus）
- [x] エラー型の実装（NoteError）
- [x] バリデーション関数の実装
- [x] リポジトリインターフェースの定義
- [x] アダプターインターフェースの定義
- [x] ユースケースインターフェースの定義

### ステップ2.3 投稿管理コンテキスト

- [x] エンティティの実装（Post, Engagement）
- [x] 値オブジェクトの実装（PostSettings）
- [x] エラー型の実装（PostError）
- [x] バリデーション関数の実装
- [x] リポジトリインターフェースの定義
- [x] アダプターインターフェースの定義
- [x] ユースケースインターフェースの定義

## フェーズ3: インフラストラクチャ層の実装

### ステップ3.1 基本インフラストラクチャの実装

- [x] DIコンテナの設定（`./infrastructure-layer.md`を参考にコンストラクタインジェクションで実現する）
- [x] 環境変数管理（dotenvとzodによる型安全な設定）
- [x] HTTPクライアントの共通実装

### ステップ3.2 データベース基盤

- [x] Drizzleのセットアップ（ユーザーが行う）
- [x] マイグレーション管理の設定（ユーザーが行う）
- [x] アカウント管理コンテキストのスキーマ定義
- [x] ノート管理コンテキストのスキーマ定義
- [x] 投稿管理コンテキストのスキーマ定義

### ステップ3.3 リポジトリ実装

- [x] アカウント管理リポジトリの実装
  - [x] UserRepository
  - [x] GitHubConnectionRepository
- [x] ノート管理リポジトリの実装
  - [x] NoteRepository
  - [x] BookRepository
  - [x] TagRepository
- [x] 投稿管理リポジトリの実装
  - [x] PostRepository

### ステップ3.4 外部サービス連携

- [ ] Bluesky認証アダプターの実装
  - [ ] BlueskyAuthProvider
- [ ] GitHub連携アダプターの実装
  - [ ] GitHubAppProvider
  - [ ] GitHubContentProvider
- [ ] Bluesky投稿アダプターの実装
  - [ ] BlueskyPostProvider

## フェーズ4: アプリケーション層の実装

### ステップ4.1 アカウント管理ユースケース

- [ ] 認証関連ユースケース
  - [ ] StartBlueskyAuthUseCase
  - [ ] HandleBlueskyAuthCallbackUseCase
  - [ ] ValidateSessionUseCase
  - [ ] RefreshSessionUseCase
  - [ ] LogoutUseCase
- [ ] GitHub連携ユースケース
  - [ ] ConnectGitHubUseCase
  - [ ] DisconnectGitHubUseCase
- [ ] ユーザー管理ユースケース
  - [ ] GetUserByIdUseCase
  - [ ] UpdateProfileUseCase
  - [ ] DeleteUserUseCase
  - [ ] ListGitHubConnectionsUseCase

### ステップ4.2 ノート管理ユースケース

- [ ] ブック管理ユースケース
  - [ ] ListRepositoriesUseCase
  - [ ] AddBookUseCase
  - [ ] ListBooksUseCase
  - [ ] GetBookUseCase
  - [ ] DeleteBookUseCase
  - [ ] CheckBookSyncStatusUseCase
- [ ] ノート管理ユースケース
  - [ ] SyncNotesUseCase
  - [ ] ListNotesUseCase
  - [ ] SearchNotesUseCase
  - [ ] GetNoteUseCase
- [ ] タグ管理ユースケース
  - [ ] ListTagsUseCase
  - [ ] ListNotesByTagUseCase

### ステップ4.3 投稿管理ユースケース

- [ ] 投稿ユースケース
  - [ ] PostNoteUseCase
  - [ ] RetryPostUseCase
- [ ] エンゲージメントユースケース
  - [ ] GetEngagementUseCase
  - [ ] CheckPostStatusUseCase

## フェーズ5: API実装

### ステップ5.1 APIの基盤実装

- [ ] Next.js App Routerのセットアップ
- [ ] API共通処理（エラーハンドリング、バリデーション）
- [ ] 認証ミドルウェアの実装

### ステップ5.2 認証API

- [ ] ログインAPI（`/api/auth/login`）
- [ ] コールバックAPI（`/api/auth/callback`）
- [ ] セッション検証API（`/api/auth/session`）
- [ ] ログアウトAPI（`/api/auth/logout`）
- [ ] GitHub連携API（`/api/auth/github`）

### ステップ5.3 ノート管理API

- [ ] ブック管理API
  - [ ] ブック一覧取得（`/api/books`）
  - [ ] ブック追加（`/api/books`）
  - [ ] ブック詳細取得（`/api/books/:id`）
  - [ ] ブック削除（`/api/books/:id`）
- [ ] ノート管理API
  - [ ] ノート一覧取得（`/api/books/:bookId/notes`）
  - [ ] ノート検索（`/api/books/:bookId/notes/search`）
  - [ ] ノート詳細取得（`/api/notes/:id`）
- [ ] タグ管理API
  - [ ] タグ一覧取得（`/api/books/:bookId/tags`）
  - [ ] タグでノート取得（`/api/books/:bookId/tags/:tagId/notes`）
- [ ] Webhook受信API
  - [ ] GitHub Webhook（`/api/webhooks/github`）

### ステップ5.4 投稿管理API

- [ ] 投稿API
  - [ ] ノート投稿（`/api/notes/:id/post`）
  - [ ] 投稿再試行（`/api/notes/:id/retry`）
- [ ] エンゲージメントAPI
  - [ ] エンゲージメント取得（`/api/notes/:id/engagement`）
  - [ ] 投稿ステータス確認（`/api/notes/:id/post-status`）

## フェーズ6: UI実装

### ステップ6.1 共通コンポーネント

- [ ] デザインシステムの構築（Tailwind CSSベース）
- [ ] 基本UIコンポーネント
  - [ ] ボタン、入力フォーム、カード
  - [ ] ナビゲーション、ヘッダー、フッター
  - [ ] モーダル、ドロップダウン
- [ ] レイアウトコンポーネント
  - [ ] アプリケーションレイアウト
  - [ ] 認証レイアウト
- [ ] 認証関連コンポーネント
  - [ ] ログインフォーム
  - [ ] ユーザープロファイル

### ステップ6.2 機能別ページ

- [ ] 認証関連ページ
  - [ ] ログインページ
  - [ ] コールバックページ
  - [ ] 設定ページ
- [ ] ブック関連ページ
  - [ ] ブック一覧ページ
  - [ ] ブック追加ページ
  - [ ] ブック詳細ページ
- [ ] ノート関連ページ
  - [ ] ノート一覧ページ
  - [ ] ノート検索ページ
  - [ ] ノート詳細ページ
  - [ ] タグフィルターページ

## フェーズ7: テストと最適化

### ステップ7.1 テスト強化

- [ ] ドメイン層のテスト
  - [ ] エンティティと値オブジェクトのテスト
  - [ ] バリデーション関数のテスト
  - [ ] ユースケースのテスト
- [ ] インフラストラクチャ層のテスト
  - [ ] リポジトリのテスト
  - [ ] アダプターのテスト
- [ ] 統合テスト
  - [ ] API統合テスト
  - [ ] ユースケース統合テスト
- [ ] E2Eテスト
  - [ ] 認証フロー
  - [ ] ノート管理フロー
  - [ ] 投稿フロー

### ステップ7.2 パフォーマンス最適化

- [ ] データベースクエリの最適化
  - [ ] インデックス最適化
  - [ ] クエリパフォーマンス分析
- [ ] キャッシュ戦略の実装
  - [ ] サーバーサイドキャッシュ
  - [ ] クライアントサイドキャッシュ
- [ ] 非同期処理の最適化
  - [ ] バックグラウンドジョブの実装
  - [ ] Webhookの非同期処理

### ステップ7.3 セキュリティ強化

- [ ] 入力検証の強化
  - [ ] APIリクエストのバリデーション
  - [ ] CSRFトークンの実装
- [ ] 認証・認可の見直し
  - [ ] JWTトークンの設定最適化
  - [ ] 権限管理の実装
- [ ] セキュリティヘッダーの設定
  - [ ] Content Security Policy
  - [ ] XSS対策
  - [ ] CORS設定

## 実装優先順位

1. 共有カーネルとドメイン層の実装（フェーズ1, 2）
2. 基本インフラストラクチャの実装（フェーズ3.1）
3. アカウント管理コンテキストのインフラストラクチャとアプリケーション層（フェーズ3.2, 3.3, 3.4, 4.1）
4. 認証API（フェーズ5.1, 5.2）
5. ノート管理コンテキストのインフラストラクチャとアプリケーション層（フェーズ3.2, 3.3, 4.2）
6. ノート管理API（フェーズ5.3）
7. 投稿管理コンテキストのインフラストラクチャとアプリケーション層（フェーズ3.2, 3.3, 4.3）
8. 投稿管理API（フェーズ5.4）
9. UI実装（フェーズ6）
10. テストと最適化（フェーズ7）
