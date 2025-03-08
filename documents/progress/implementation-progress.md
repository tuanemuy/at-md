# 実装進捗状況

このドキュメントでは、AT-MDプロジェクトの実装進捗状況を記録します。

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

- [ ] コンテンツリポジトリインターフェース定義
- [ ] コンテンツ関連コマンドハンドラー実装
- [ ] コンテンツ関連クエリハンドラー実装
- [ ] コンテンツ同期サービス実装

### 4.2 配信アプリケーションサービス

- [ ] 配信リポジトリインターフェース定義
- [ ] 配信関連コマンドハンドラー実装
- [ ] 配信関連クエリハンドラー実装
- [ ] 配信スケジューリングサービス実装

### 4.3 アカウント管理アプリケーションサービス

- [ ] アカウントリポジトリインターフェース定義
- [ ] アカウント関連コマンドハンドラー実装
- [ ] アカウント関連クエリハンドラー実装
- [ ] 外部サービス連携サービス実装

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

### 5.2 外部サービス連携

- [x] GitHub連携
- [x] AT Protocol連携
- [x] Obsidian連携

## フェーズ6: プレゼンテーションレイヤー実装

### 6.1 APIエンドポイント

- [ ] RESTful API実装
- [ ] GraphQL API実装
- [ ] Webhook実装

### 6.2 ユーザーインターフェース

- [ ] コンテンツ管理UI
- [ ] 配信管理UI
- [ ] アカウント管理UI
- [x] 表示UI

## フェーズ7: テストと品質保証

### 7.1 テスト

- [x] 単体テスト（コアモジュール）
- [ ] 統合テスト
- [ ] E2Eテスト

### 7.2 品質保証

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

2024年8月3日