# 実装進捗状況

このドキュメントでは、AT-MDプロジェクトの実装進捗状況を記録します。

## 実装の進捗状況

### 全体の進捗

- [x] 環境構築
- [x] データベース設計
- [x] ドメインモデル設計
- [x] アプリケーションサービス設計
- [x] 外部サービス連携設計
- [ ] プレゼンテーション層設計
- [ ] デプロイ設計

### データベース

- [x] スキーマ定義
- [x] マイグレーション
- [x] すべてのテーブルのIDフィールドにUUID v7をデフォルト値として設定

### ドメインモデル

- [x] コンテンツドメイン
  - [x] エンティティ
  - [x] 値オブジェクト
  - [x] 集約
  - [x] リポジトリインターフェース
  - [x] ドメインサービス
- [x] アカウントドメイン
  - [x] エンティティ
  - [x] 値オブジェクト
  - [x] 集約
  - [x] リポジトリインターフェース
  - [x] ドメインサービス
- [x] 表示ドメイン
  - [x] エンティティ
  - [x] 値オブジェクト
  - [x] 集約
  - [x] リポジトリインターフェース
  - [x] ドメインサービス
- [x] 配信ドメイン
  - [x] エンティティ
  - [x] 値オブジェクト
  - [x] 集約
  - [x] リポジトリインターフェース
  - [x] ドメインサービス

### アプリケーションサービス

- [x] コンテンツ管理アプリケーションサービス
  - [x] コマンドハンドラー
  - [x] クエリハンドラー
  - [x] イベントハンドラー
- [x] アカウント管理アプリケーションサービス
  - [x] コマンドハンドラー
  - [x] クエリハンドラー
  - [x] イベントハンドラー
- [x] 表示管理アプリケーションサービス
  - [x] コマンドハンドラー
  - [x] クエリハンドラー
  - [x] イベントハンドラー
- [x] 配信管理アプリケーションサービス
  - [x] コマンドハンドラー
  - [x] クエリハンドラー
  - [x] イベントハンドラー

### 外部サービス連携

- [x] リポジトリの実装
  - [x] コンテンツリポジトリ
  - [x] ユーザーリポジトリ
  - [x] リポジトリリポジトリ
  - [x] 表示リポジトリ
  - [x] 配信リポジトリ
- [x] 外部サービス連携アダプター
  - [x] GitHub API アダプター
  - [x] AT Protocol アダプター
  - [x] Obsidian アダプター

### プレゼンテーション層

- [ ] RESTful API
  - [x] コンテンツ管理API
  - [x] アカウント管理API
  - [x] 配信管理API
  - [x] 表示管理API
- [ ] GraphQL API
  - [x] スキーマ設計
  - [x] リゾルバー実装
  - [x] クエリ実装
  - [x] ミューテーション実装
  - [x] テスト実装
- [ ] ユーザーインターフェース
  - [x] コンテンツ管理UI
  - [x] アカウント管理UI
  - [x] 表示管理UI
  - [x] 配信管理UI

### デプロイ

- [ ] コンテナ化
- [ ] CI/CD
- [ ] インフラストラクチャ構築

## フェーズ1: 基盤構築

### 1.1 プロジェクト構成とインフラストラクチャの設定

- [x] プロジェクト構造の作成
- [x] 開発環境のセットアップ
- [ ] CI/CDパイプラインの構築

### 1.2 共通コアモジュールの実装

- [x] エラー基底クラスの実装
  - [x] DomainError
  - [x] ApplicationError
  - [x] InfrastructureError
  - [x] PresentationError
  - [x] 各種具体的なエラークラス
- [x] Result型の実装
  - [x] neverthrowライブラリの導入
- [x] ドメインイベント基盤の実装
  - [x] DomainEvent基底クラス
  - [x] EventBus
- [x] ロギング基盤の実装
  - [x] Logger
  - [x] ErrorMetrics
- [x] ID生成機能の実装
  - [x] UUIDv7の導入
  - [x] IdGeneratorインターフェース
  - [x] UUIDv7Generator実装
  - [x] UUIDv4Generator実装
  - [x] generateId関数の統一的な使用

## フェーズ2: コアドメイン実装

### 2.1 コンテンツ管理ドメイン（コアドメイン）

- [x] コンテンツ関連の値オブジェクト実装
  - [x] ContentMetadata
  - [x] Version
- [x] コンテンツエンティティ実装
  - [x] Content
  - [x] Repository
- [x] コンテンツ集約実装
  - [x] ContentAggregate
  - [x] RepositoryAggregate
- [x] コンテンツドメインサービス実装
  - [x] VersioningService

### 2.2 配信ドメイン（コアドメイン）

- [x] 配信関連の値オブジェクト実装
  - [x] PublishStatus
  - [x] FeedMetadata
- [x] 配信エンティティ実装
  - [x] Post
  - [x] Feed
- [x] 配信集約実装
  - [x] PostAggregate
  - [x] FeedAggregate
- [x] 配信ドメインサービス実装
  - [x] PublishingService

## フェーズ3: サポートドメイン実装

### 3.1 アカウント管理ドメイン

- [ ] アカウント関連の値オブジェクト実装
- [ ] アカウントエンティティ実装
- [ ] アカウント集約実装
- [ ] 認証サービス実装

### 3.2 表示ドメイン

- [x] 表示関連の値オブジェクト実装
  - [x] PageMetadata
  - [x] RenderingOptions
- [x] 表示エンティティ実装
  - [x] Page
  - [x] ViewTemplate
- [x] 表示集約実装
  - [x] PageAggregate
- [x] レンダリングサービス実装
  - [x] RenderingService
  - [x] DefaultRenderingService

## フェーズ4: アプリケーションレイヤー実装

### 4.1 コンテンツ管理アプリケーションサービス

- [x] コンテンツリポジトリインターフェース定義
- [x] コンテンツ関連コマンドハンドラー実装
- [x] コンテンツ関連クエリハンドラー実装
- [x] コンテンツ同期サービス実装

### 4.2 配信アプリケーションサービス

- [x] 配信リポジトリインターフェース定義
- [x] 配信関連コマンドハンドラー実装
  - [x] CreateFeedCommandHandler
  - [x] UpdateFeedCommandHandler
  - [x] DeleteFeedCommandHandler
- [x] 配信関連クエリハンドラー実装
  - [x] GetFeedByIdQueryHandler
  - [x] GetFeedsByUserIdQueryHandler
  - [x] GetFeedByNameQueryHandler
  - [x] GetPostByIdQueryHandler
  - [x] GetPostByContentIdQueryHandler
  - [x] GetPostsByUserIdQueryHandler
- [x] 配信スケジューリングサービス実装
  - [x] PublishingSchedulingService
  - [x] DefaultPublishingSchedulingService

### 4.3 アカウント管理アプリケーションサービス

- [x] アカウントリポジトリインターフェース定義
  - [x] UserRepository
- [x] アカウント関連コマンドハンドラー実装
  - [x] CreateUserCommandHandler
  - [x] テスト実装
- [x] アカウント関連クエリハンドラー実装
  - [x] GetUserByIdQueryHandler
  - [x] GetUserByUsernameQueryHandler
  - [x] GetUserByEmailQueryHandler
  - [x] GetUserByDidQueryHandler
  - [x] GetUserByHandleQueryHandler
- [x] 外部サービス連携サービス実装
  - [x] GitHubApiAdapter連携
  - [x] AtProtocolAdapter連携
  - [x] ObsidianAdapter連携

### 4.4 表示アプリケーションサービス

- [x] 表示リポジトリインターフェース定義
  - [x] PageRepository
  - [x] TemplateRepository
- [x] 表示関連クエリハンドラー実装
  - [x] GetPageByIdQueryHandler
  - [x] GetPageBySlugQueryHandler
  - [x] GetPageByContentIdQueryHandler
  - [x] GetTemplateByIdQueryHandler
  - [x] GetAllTemplatesQueryHandler
- [x] マークダウンレンダリングサービス実装
  - [x] MarkdownRenderingService

## フェーズ5: インフラストラクチャレイヤー実装

### 5.1 永続化インフラストラクチャ

- [x] データベース設計
- [x] リポジトリ実装
  - [x] ContentRepository インターフェース定義
  - [x] DrizzleContentRepository 実装
  - [x] PageRepository インターフェース定義
  - [x] DrizzlePageRepository 実装
  - [x] TemplateRepository インターフェース定義
  - [x] DrizzleTemplateRepository 実装
  - [x] リポジトリのテスト実装（単体テスト・統合テスト）
  - [x] ドメインイベント発行機能の実装
  - [x] トランザクション管理の実装
- [x] マイグレーション機能
- [x] データベーススキーマの改善
  - [x] すべてのテーブルのIDフィールドにUUID v7をデフォルト値として設定

### 5.2 外部サービス連携

- [x] GitHub連携
  - [x] GitHubApiAdapterインターフェース定義
  - [x] OctokitGitHubApiAdapter実装
  - [x] テスト実装
- [x] AT Protocol連携
  - [x] AtProtocolAdapterインターフェース定義
  - [x] BskyAtProtocolAdapter実装
  - [x] テスト実装
- [x] Obsidian連携
  - [x] ObsidianAdapterインターフェース定義
  - [x] FsObsidianAdapter実装
  - [x] テスト実装

## フェーズ6: プレゼンテーションレイヤー実装

### 6.1 APIエンドポイント

- [x] フレームワーク選定（Hono）
- [x] ユーザー管理API
- [x] コンテンツ管理API
- [x] フィード管理API
- [x] 表示管理API

### GraphQL API
- [x] スキーマ設計
- [x] リゾルバー実装
- [x] クエリ実装
- [x] ミューテーション実装
- [x] テスト実装

### UI
- [x] コンポーネント設計
- [x] コンテンツ管理UI
  - [x] コンテンツリスト表示コンポーネント
  - [x] コンテンツ詳細表示コンポーネント
- [x] アカウント管理UI
  - [x] ユーザーリスト表示コンポーネント
  - [x] ユーザー詳細表示コンポーネント
- [x] ページ設計
  - [x] ホームページ
  - [x] コンテンツ詳細ページ
  - [x] ユーザー詳細ページ
  - [x] フィード詳細ページ
- [x] 状態管理
  - [x] アプリケーション状態
  - [x] ページ遷移
  - [x] レンダリング

### 6.2 ユーザーインターフェース

- [x] コンテンツ管理UI
  - [x] コンテンツリスト表示コンポーネント
  - [x] コンテンツ詳細表示コンポーネント
- [x] 配信管理UI
  - [x] フィードリスト表示コンポーネント
  - [x] フィード詳細表示コンポーネント
- [x] アカウント管理UI
  - [x] ユーザーリスト表示コンポーネント
  - [x] ユーザー詳細表示コンポーネント
- [x] 表示UI
- [x] ページ設計
  - [x] ホームページ
  - [x] コンテンツ詳細ページ
  - [x] ユーザー詳細ページ
  - [x] フィード詳細ページ
- [x] 状態管理
  - [x] アプリケーション状態
  - [x] ページ遷移
  - [x] レンダリング

## フェーズ7: テストと品質保証

### 7.1 テスト

- [x] 単体テスト（コアモジュール）
- [ ] 統合テスト
- [ ] E2Eテスト

### 7.2 品質保証

- [x] データモデルの整合性確認
  - [x] エンティティとデータベーススキーマの整合性
  - [x] IDの型の統一（string型）
- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] アクセシビリティテスト

## フェーズ8: デプロイメントと運用

### 8.1 デプロイメント

- [ ] 本番環境構築
- [ ] デプロイメントパイプライン

### 8.2 運用

- [ ] モニタリング
- [ ] バックアップ
- [ ] 障害復旧計画

## 最終更新日

2024年8月5日