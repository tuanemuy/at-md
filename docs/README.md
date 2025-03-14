# 設計資料

このディレクトリには、プロジェクトの設計・実装に関する資料が含まれています。

## 資料構成

- [システムの概要・ワークフロー](./flowchart.md)
- [ドメインモデルの定義](./domains/)
- [ドメインモデルの型定義](./domain-types/)
- [アプリケーション層の実装パターン](./application-layer.md)

## 技術スタック概要

- フロントエンド: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- バックエンド: Hono (Next.js API Routes経由), React Server Components, Server Actions
- バリデーション: Zod（モデル全般）, @hono/zod-validator（APIリクエスト）
- RPC: Server Actions, hono/client
- データベース: PostgreSQL, Drizzle ORM
- 外部システム連携:
  - GitHub Apps（octkit）
  - Bluesky（PDS, OAuth: @atproto/oauth-client-node）
- テスト: Vitest
- エラーハンドリング: neverthrow（Result型）
- ロギング: winston（グローバルシングルトン）

## アーキテクチャ概要

ドメイン駆動設計（DDD）の原則に基づいたアーキテクチャを採用しています。システムは以下の層に分かれています。

### ドメイン層

- システムの中核となるビジネスロジックを含む
- エンティティ、値オブジェクト、ドメインサービスで構成される
- ビジネスルールとドメイン知識を表現する

### アプリケーション層

- ドメイン層とインフラストラクチャ層を橋渡しする
- ユースケースインターフェースとアプリケーションサービスで構成される
- システムの振る舞いを定義するが、ドメインルールは含まない

### インフラストラクチャ層

- 永続化、外部サービスとの通信、UIなどの技術的な実装を提供
- ドメイン層とアプリケーション層をサポートする

### プレゼンテーション層

- ユーザーインターフェースを提供
- ユーザー入力の処理とアプリケーション層への橋渡し

## 依存関係の方向

依存関係は内側に向かって流れます：

```
プレゼンテーション層 → アプリケーション層 → ドメイン層 ← インフラストラクチャ層
```

ドメイン層は他の層に依存せず、インフラストラクチャ層はドメイン層に依存します（依存性逆転の原則）。

## ドメインモデル

システムは複数の境界づけられたコンテキストに分割されています：

1. アカウント管理コンテキスト - ユーザー認証と認可を管理
2. ノート管理コンテキスト - GitHubからのノート取得と管理
3. 投稿管理コンテキスト - Blueskyへの投稿処理

詳細は以下のドキュメントを参照してください：

- [ドメインモデル概要](./domains/overview.md)
- [アカウント管理コンテキスト](./domains/account.md)
- [ノート管理コンテキスト](./domains/note.md)
- [投稿管理コンテキスト](./domains/post.md)

## 型定義

各コンテキストの型定義は以下のドキュメントに記載されています：

- [共通型定義](./domain-types/common.md)
- [アカウント管理コンテキスト型定義](./domain-types/account.md)
- [ノート管理コンテキスト型定義](./domain-types/note.md)
- [投稿管理コンテキスト型定義](./domain-types/post.md)

## モジュール構成

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/             # 認証関連API
│   │   ├── webhook/          # Webhook処理API
│   │   ├── notes/            # ノート関連API
│   │   └── posts/            # 投稿関連API
│   ├── auth/                 # 認証関連ページ
│   │   ├── login/            # ログインページ
│   │   └── callback/         # OAuth コールバックページ
│   ├── dashboard/            # ダッシュボード
│   │   ├── books/            # ブック管理ページ
│   │   ├── notes/            # ノート管理ページ
│   │   └── settings/         # 設定ページ
│   └── [user]/[bookId]/      # ノート表示
│       └── [noteId]/         # 個別ノート表示
├── components/               # UIコンポーネント
│   ├── ui/                   # 基本UIコンポーネント
│   │   ├── button.tsx        # ボタンコンポーネント
│   │   ├── input.tsx         # 入力コンポーネント
│   │   ├── __tests__/        # UIコンポーネントのテスト
│   │   └── ...               # その他UIコンポーネント
│   └── domain/               # ドメイン固有コンポーネント
│       ├── note/             # ノート関連コンポーネント
│       │   ├── noteCard.tsx  # ノートカード
│       │   ├── __tests__/    # ノート関連コンポーネントのテスト
│       │   └── ...           # その他ノート関連コンポーネント
│       ├── book/             # ブック関連コンポーネント
│       │   └── __tests__/    # ブック関連コンポーネントのテスト
│       └── post/             # 投稿関連コンポーネント
│           └── __tests__/    # 投稿関連コンポーネントのテスト
├── domain/                   # ドメイン層
│   ├── shared/               # 共有カーネル
│   │   ├── models/           # 共有モデル
│   │   │   ├── id.ts         # ID値オブジェクト
│   │   │   ├── result.ts     # Result型
│   │   │   └── errors.ts     # 共通エラー型
│   │   ├── __tests__/        # 共有カーネルのテスト
│   │   └── utils/            # 共通ユーティリティ
│   ├── account/              # アカウント管理コンテキスト
│   │   ├── models/           # アカウント関連モデル
│   │   │   ├── user.ts       # ユーザーエンティティ
│   │   │   ├── session.ts    # セッションエンティティ
│   │   │   └── githubConnection.ts # GitHub連携情報
│   │   ├── services/         # アカウント関連サービス
│   │   │   ├── authService.ts      # 認証サービス
│   │   │   ├── githubService.ts    # GitHub連携サービス
│   │   │   └── sessionService.ts   # セッション管理サービス
│   │   ├── repositories/     # アカウント関連リポジトリインターフェース
│   │   │   ├── userRepository.ts   # ユーザーリポジトリ
│   │   │   └── sessionRepository.ts # セッションリポジトリ
│   │   ├── __tests__/        # アカウント管理コンテキストのテスト
│   │   │   ├── models/       # モデルのテスト
│   │   │   ├── services/     # サービスのテスト
│   │   │   └── repositories/ # リポジトリのテスト
│   │   └── events/           # アカウント関連ドメインイベント
│   ├── note/                 # ノート管理コンテキスト
│   │   ├── models/           # ノート関連モデル
│   │   │   ├── note.ts       # ノートエンティティ
│   │   │   ├── book.ts       # ブックエンティティ
│   │   │   └── tag.ts        # タグエンティティ
│   │   ├── services/         # ノート関連サービス
│   │   │   ├── syncService.ts      # 同期サービス
│   │   │   ├── tagService.ts       # タグ管理サービス
│   │   │   └── noteAnalysisService.ts # ノート解析サービス
│   │   ├── repositories/     # ノート関連リポジトリインターフェース
│   │   │   ├── noteRepository.ts   # ノートリポジトリ
│   │   │   ├── bookRepository.ts   # ブックリポジトリ
│   │   │   └── tagRepository.ts    # タグリポジトリ
│   │   ├── __tests__/        # ノート管理コンテキストのテスト
│   │   │   ├── models/       # モデルのテスト
│   │   │   ├── services/     # サービスのテスト
│   │   │   └── repositories/ # リポジトリのテスト
│   │   └── events/           # ノート関連ドメインイベント
│   └── post/                 # 投稿管理コンテキスト
│       ├── models/           # 投稿関連モデル
│       │   └── post.ts       # 投稿エンティティ
│       ├── services/         # 投稿関連サービス
│       │   ├── postingService.ts   # 投稿サービス
│       │   └── engagementService.ts # エンゲージメント取得サービス
│       ├── repositories/     # 投稿関連リポジトリインターフェース
│       │   └── postRepository.ts   # 投稿リポジトリ
│       ├── __tests__/        # 投稿管理コンテキストのテスト
│       │   ├── models/       # モデルのテスト
│       │   ├── services/     # サービスのテスト
│       │   └── repositories/ # リポジトリのテスト
│       └── events/           # 投稿関連ドメインイベント
├── application/              # アプリケーション層
│   ├── account/              # アカウント管理
│   │   ├── usecases/         # ユースケースインターフェース
│   │   │   ├── authenticateWithBluesky.ts # 認証ユースケース
│   │   │   ├── connectGithub.ts    # GitHub連携ユースケース
│   │   │   ├── validateSession.ts  # セッション検証ユースケース
│   │   │   └── ...                  # その他ユースケース
│   │   ├── services/         # アプリケーションサービス（実装）
│   │   │   ├── authenticateWithBlueskyService.ts # 認証サービス
│   │   │   ├── connectGithubService.ts    # GitHub連携サービス
│   │   │   ├── validateSessionService.ts  # セッション検証サービス
│   │   │   └── ...                  # その他サービス
│   │   └── __tests__/        # アカウント管理アプリケーションのテスト
│   │       ├── usecases/     # ユースケースのテスト
│   │       └── services/     # サービスのテスト
│   ├── note/                 # ノート管理
│   │   ├── usecases/         # ユースケースインターフェース
│   │   │   ├── addBook.ts          # ブック追加ユースケース
│   │   │   ├── syncNotes.ts        # ノート同期ユースケース
│   │   │   ├── processWebhook.ts   # Webhook処理ユースケース
│   │   │   └── ...                  # その他ユースケース
│   │   ├── services/         # アプリケーションサービス（実装）
│   │   │   ├── addBookService.ts  # ブック追加サービス
│   │   │   ├── syncNotesService.ts # ノート同期サービス
│   │   │   ├── processWebhookService.ts # Webhook処理サービス
│   │   │   └── ...                  # その他サービス
│   │   └── __tests__/        # ノート管理アプリケーションのテスト
│   │       ├── usecases/     # ユースケースのテスト
│   │       └── services/     # サービスのテスト
│   └── post/                 # 投稿管理
│       ├── usecases/         # ユースケースインターフェース
│       │   ├── postNote.ts         # ノート投稿ユースケース
│       │   ├── getEngagement.ts    # エンゲージメント取得ユースケース
│       │   └── ...                  # その他ユースケース
│       ├── services/         # アプリケーションサービス（実装）
│       │   ├── postNoteService.ts # ノート投稿サービス
│       │   ├── getEngagementService.ts # エンゲージメント取得サービス
│       │   └── ...                  # その他サービス
│       └── __tests__/        # 投稿管理アプリケーションのテスト
│           ├── usecases/     # ユースケースのテスト
│           └── services/     # サービスのテスト
├── infrastructure/           # インフラストラクチャ層
│   ├── db/                   # データベース
│   │   ├── client.ts         # データベースクライアント
│   │   ├── migrations/       # マイグレーションファイル
│   │   ├── schema/           # スキーマ定義
│   │   │   ├── users.ts      # ユーザーテーブル
│   │   │   ├── sessions.ts   # セッションテーブル
│   │   │   ├── books.ts      # ブックテーブル
│   │   │   ├── notes.ts      # ノートテーブル
│   │   │   ├── tags.ts       # タグテーブル
│   │   │   ├── posts.ts      # 投稿テーブル
│   │   │   └── index.ts      # スキーマ定義エクスポート
│   │   ├── repositories/     # リポジトリ実装
│   │   │   ├── account/      # アカウント関連リポジトリ実装
│   │   │   │   ├── userRepository.ts   # ユーザーリポジトリ実装
│   │   │   │   └── sessionRepository.ts # セッションリポジトリ実装
│   │   │   ├── note/         # ノート関連リポジトリ実装
│   │   │   │   ├── noteRepository.ts   # ノートリポジトリ実装
│   │   │   │   ├── bookRepository.ts   # ブックリポジトリ実装
│   │   │   │   └── tagRepository.ts    # タグリポジトリ実装
│   │   │   └── post/         # 投稿関連リポジトリ実装
│   │   │       └── postRepository.ts   # 投稿リポジトリ実装
│   │   └── __tests__/        # データベース関連のテスト
│   │       └── repositories/ # リポジトリ実装のテスト
│   ├── api/                  # 外部API
│   │   ├── github/           # GitHub API
│   │   │   ├── client.ts     # GitHub APIクライアント
│   │   │   ├── app.ts        # GitHub Appsインテグレーション
│   │   │   ├── services/     # GitHub関連サービス実装
│   │   │   └── __tests__/    # GitHub API関連のテスト
│   │   └── bluesky/          # Bluesky API
│   │       ├── client.ts     # Bluesky APIクライアント
│   │       ├── auth.ts       # Bluesky認証
│   │       ├── services/     # Bluesky関連サービス実装
│   │       └── __tests__/    # Bluesky API関連のテスト
│   ├── auth/                 # 認証
│   │   ├── blueskyAuth.ts    # Bluesky認証実装
│   │   ├── session.ts        # セッション管理実装
│   │   └── __tests__/        # 認証関連のテスト
│   └── events/               # イベント処理
│       ├── eventBus.ts       # イベントバス
│       ├── handlers/         # イベントハンドラー
│       └── __tests__/        # イベント処理関連のテスト
├── lib/                      # ユーティリティ
│   ├── logger.ts             # ロガー
│   ├── container.ts          # DIコンテナ
│   ├── types/                # 型定義
│   │   └── __tests__/        # 型定義のテスト
│   └── __tests__/            # ユーティリティのテスト
├── e2e/                      # E2Eテスト
│   ├── api/                  # API E2Eテスト
│   └── ui/                   # UI E2Eテスト
└── app/__tests__/            # Next.js App Routerのテスト
    ├── api/                  # APIルートのテスト
    ├── auth/                 # 認証ページのテスト
    ├── dashboard/            # ダッシュボードのテスト
    └── [user]/               # ユーザーページのテスト
```
