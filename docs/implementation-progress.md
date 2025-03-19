# 実装進捗状況

このドキュメントでは、プロジェクトの実装進捗状況を記録します。

## 完了したタスク

### Phase 1: 共有カーネルの実装
- 共有カーネルコンポーネントの実装
  - ロギング機能
  - Result型の実装（neverthrow）
  - 共通型/インターフェース定義
  - バリデーションスキーマ

### Phase 2: ドメイン層の実装
- アカウント管理コンテキスト
  - エンティティ: User, GitHubConnection
  - 値オブジェクト: Profile, Session
  - DTO: GitHubInstallation
  - エラー型: AccountError
  - リポジトリインターフェース: UserRepository, GitHubConnectionRepository
  - アダプターインターフェース: GitHubAppProvider, GitHubContentProvider, BlueskyAuthProvider, SessionManager

- ノート管理コンテキスト
  - エンティティ: Note, Book, Tag
  - 値オブジェクト: BookDetails, SyncStatus
  - エラー型: NoteError
  - リポジトリインターフェース: NoteRepository, BookRepository, TagRepository
  - アダプターインターフェース: GitHubContentProvider

- 投稿管理コンテキスト
  - エンティティ: Post
  - 値オブジェクト: Engagement
  - DTO: BlueskyPost, DID
  - エラー型: PostError
  - リポジトリインターフェース: PostRepository
  - アダプターインターフェース: BlueskyPostProvider

### Phase 3: インフラストラクチャ層の実装
- 基本インフラストラクチャの実装
  - DIコンテナの設定（コンストラクタインジェクションパターン）
  - 環境変数管理（dotenvとzodによる型安全な設定）
  - HTTPクライアントの共通実装（エラーハンドリングとResult型統合）

- データベース基盤の実装
  - Drizzleのセットアップ
  - マイグレーション管理の設定
  - データベーススキーマ定義
    - アカウント管理コンテキスト（users, githubConnections）
    - ノート管理コンテキスト（books, notes, tags, noteTags）
    - 投稿管理コンテキスト（posts, engagements）

- リポジトリの実装
  - アカウント管理コンテキスト
    - UserRepository（Drizzle ORM使用）
    - GitHubConnectionRepository（Drizzle ORM使用）

## 次のステップ

### Phase 3: インフラストラクチャ層の実装（続き）
1. リポジトリの実装
   - ノート管理コンテキスト（NoteRepository, BookRepository, TagRepository）
   - 投稿管理コンテキスト（PostRepository）

2. 外部サービス連携
   - Bluesky認証
   - GitHub連携
   - セッション管理
   - Bluesky投稿 