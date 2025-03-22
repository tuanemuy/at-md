# 設計資料

このディレクトリには、プロジェクトの設計・実装に関する資料が含まれています。

## 資料構成

- [システムの概要・ワークフロー](./flowchart.md)
- [ドメインモデルの定義](./domains/)
- [ドメインモデルの型定義](./domain-types/)
- [アプリケーション層の実装パターン](./application-layer.md)
- [インフラストラクチャ層の実装パターン](./infrastructure-layer.md)

## 技術スタック概要

- フロントエンド: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- バックエンド: Hono (Next.js API Routes経由), React Server Components, Server Actions
- バリデーション: Zod（モデル全般）, @hono/zod-validator（APIリクエスト）
- RPC: Server Actions, hono/client
- データベース: PostgreSQL, Drizzle ORM
- 外部システム連携:
  - GitHub Apps（octkit）
  - GitHub API（octkit）
  - Bluesky OAuth（@atproto/oauth-client-node）
  - Bluesky API（@atproto/api）
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
│   └── domain/               # ドメイン固有コンポーネント
│       ├── note/             # ノート関連コンポーネント
│       │   └── __tests__/    # ノート関連コンポーネントのテスト
│       ├── book/             # ブック関連コンポーネント
│       │   └── __tests__/    # ブック関連コンポーネントのテスト
│       └── post/             # 投稿関連コンポーネント
│           └── __tests__/    # 投稿関連コンポーネントのテスト
├── domain/                   # ドメイン層
│   ├── types/                # 共有型
│   ├── account/              # アカウント管理コンテキスト
│   │   ├── models/           # アカウント関連モデル（エンティティ・値オブジェクト）
│   │   ├── dtos/             # ドメイン層のDTO
│   │   ├── adapters/         # アカウント関連アダプターインターフェース
│   │   └── repositories/     # アカウント関連リポジトリインターフェース
│   ├── note/                 # ノート管理コンテキスト
│   │   ├── models/           # ノート関連モデル（エンティティ・値オブジェクト）
│   │   ├── dtos/             # ドメイン層のDTO
│   │   ├── adapters/         # ドメイン関連アダプターインターフェース
│   │   └── repositories/     # ノート関連リポジトリインターフェース
│   └── post/                 # 投稿管理コンテキスト
│       ├── models/           # 投稿関連モデル（エンティティ・値オブジェクト）
│       ├── dtos/             # ドメイン層のDTO
│       ├── adapters/         # 投稿関連アダプターインターフェース
│       └── repositories/     # 投稿関連リポジトリインターフェース
├── application/              # アプリケーション層
│   ├── account/              # アカウント管理
│   │   ├── usecases/         # ユースケースインターフェース
│   │   └── services/         # アプリケーションサービス（ユースケースの実装）
│   │       └── __tests__/    # アプリケーションサービスのテスト
│   ├── note/                 # ノート管理
│   │   ├── usecases/         # ユースケースインターフェース
│   │   └── services/         # アプリケーションサービス（ユースケースの実装）
│   │       └── __tests__/    # アプリケーションサービスのテスト
│   └── post/                 # 投稿管理
│       ├── usecases/         # ユースケースインターフェース
│       └── services/         # アプリケーションサービス（ユースケースの実装）
│           └── __tests__/    # アプリケーションサービスのテスト
├── infrastructure/           # インフラストラクチャ層
│   ├── config/index.ts       # 環境変数と設定の管理
│   ├── context/index.ts      # コンストラクタインジェクション
│   ├── db/                   # データベース
│   │   ├── client.ts         # データベースクライアント
│   │   ├── migrations/       # マイグレーションファイル
│   │   ├── schema/           # スキーマ定義
│   │   └── repositories/     # リポジトリ実装
│   │       ├── account/      # アカウント関連リポジトリ実装
│   │       ├── note/         # ノート関連リポジトリ実装
│   │       ├── post/         # 投稿関連リポジトリ実装
│   │       └── __tests__/    # リポジトリのテスト
│   │           └── setup.ts  # テスト用のインメモリデータベースクライアント
│   ├── github/               # GitHub API関連サービス実装
│   │   └── __tests__/        # GitHub API関連サービスのテスト
│   └── bluesky/              # Bluesky API関連サービス実装
│       └── __tests__/        # Bluesky API関連サービスのテスト
├── lib/                      # ユーティリティ
│   ├── logger.ts             # ロガー
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
