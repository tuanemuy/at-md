# アプリケーションアーキテクチャ

この資料では、ドメイン駆動設計に基づいたアプリケーションアーキテクチャを定義します。

## アーキテクチャの概要

システムは以下の層に分かれています：

### 1. プレゼンテーション層

- Next.js App Routerを使用したWebアプリケーション
- Server Actionsを利用する

### 2. アプリケーション層

- ユースケースの実装
- Server Actions
- API Routes (Hono)

### 3. ドメイン層

- ドメインモデル
- ドメインサービス
- リポジトリインターフェース

### 4. インフラストラクチャ層

- データベースアクセス (Drizzle ORM)
- 外部APIクライアント (GitHub, Bluesky)
- 認証機能

## 依存関係の方向

依存関係は内側に向かって流れます：

```
プレゼンテーション層 → アプリケーション層 → ドメイン層 ← インフラストラクチャ層
```

ドメイン層は他の層に依存せず、インフラストラクチャ層はドメイン層に依存します（依存性逆転の原則）。

## モジュール構成

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # API Routes
│   ├── auth/             # 認証関連ページ
│   ├── dashboard/        # ダッシュボード
│   └── [user]/[repo]/    # 文書表示
├── components/           # UIコンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   └── domain/           # ドメイン固有コンポーネント
├── domain/               # ドメイン層
│   ├── shared/           # 共有カーネル
│   │   └── models/       # 共有モデル
│   ├── account/          # アカウント管理コンテキスト
│   │   ├── models/       # アカウント関連モデル
│   │   ├── services/     # アカウント関連サービス
│   │   ├── repositories/ # アカウント関連リポジトリインターフェース
│   │   └── contracts/    # 他コンテキストとの契約
│   ├── document/         # 文書管理コンテキスト
│   │   ├── models/       # 文書関連モデル
│   │   ├── services/     # 文書関連サービス
│   │   ├── repositories/ # 文書関連リポジトリインターフェース
│   │   └── contracts/    # 他コンテキストとの契約
│   └── post/             # 投稿管理コンテキスト
│       ├── models/       # 投稿関連モデル
│       ├── services/     # 投稿関連サービス
│       ├── repositories/ # 投稿関連リポジトリインターフェース
│       └── contracts/    # 他コンテキストとの契約
├── application/          # アプリケーション層
│   ├── account/          # アカウント管理ユースケース
│   │   ├── usecases/     # ユースケース
│   │   ├── commands/     # コマンド
│   │   └── queries/      # クエリ
│   ├── document/         # 文書管理ユースケース
│   │   ├── usecases/     # ユースケース
│   │   ├── commands/     # コマンド
│   │   └── queries/      # クエリ
│   └── post/             # 投稿管理ユースケース
│       ├── usecases/     # ユースケース
│       ├── commands/     # コマンド
│       └── queries/      # クエリ
├── infrastructure/       # インフラストラクチャ層
│   ├── db/               # データベース
│   │   ├── client.ts     # データベースクライアント
│   │   ├── schema/       #
│   │   │   ├── *.ts      # スキーマ定義
│   │   │   └── index.ts  # スキーマ定義エクスポート
│   │   └── repositories/ # リポジトリ実装
│   │       ├── account/  # アカウント関連リポジトリ実装
│   │       ├── document/ # 文書関連リポジトリ実装
│   │       └── post/     # 投稿関連リポジトリ実装
│   ├── api/              # 外部API
│   │   ├── github/       # GitHub API
│   │   └── bluesky/      # Bluesky API
│   └── auth/             # 認証
└── lib/                  # ユーティリティ
    ├── logger.ts         # ロガー
    ├── container.ts      # DIコンテナ
    └── types/            # 型定義
```

## 境界づけられたコンテキストの実装

### 共有カーネル

```
src/
├── domain/
│   └── shared/
│       └── models/
│           ├── id.ts         # ID型定義
│           └── common.ts     # 共通モデル
```

### アカウント管理コンテキスト

```
src/
├── domain/
│   └── account/
│       ├── models/
│       │   └── user.ts       # ユーザーモデル
│       ├── services/
│       │   └── auth.ts       # 認証サービス
│       ├── repositories/
│       │   └── user.ts       # ユーザーリポジトリインターフェース
│       └── contracts/
│           └── index.ts      # 公開インターフェース
├── application/
│   └── account/
│       ├── usecases/
│       │   ├── register.ts   # ユーザー登録
│       │   └── connect.ts    # GitHub連携
│       └── queries/
│           └── user.ts       # ユーザー情報取得
└── infrastructure/
    ├── db/
    │   ├── schema/
    │   │   └── user.ts       # ユーザースキーマ
    │   └── repositories/
    │       └── account/
    │           └── user.ts   # ユーザーリポジトリ実装
    └── auth/
        ├── bluesky.ts        # Bluesky認証
        └── github.ts         # GitHub認証
```

### 文書管理コンテキスト

```
src/
├── domain/
│   └── document/
│       ├── models/
│       │   ├── document.ts   # 文書モデル
│       │   ├── githubRepo.ts # GitHubリポジトリモデル
│       │   └── tag.ts        # タグモデル
│       ├── services/
│       │   └── sync.ts       # 同期サービス
│       ├── repositories/
│       │   ├── document.ts   # 文書リポジトリインターフェース
│       │   ├── githubRepo.ts # GitHubリポジトリリポジトリインターフェース
│       │   └── tag.ts        # タグリポジトリインターフェース
│       └── contracts/
│           └── index.ts      # 公開インターフェース
├── application/
│   └── document/
│       ├── usecases/
│       │   ├── sync.ts       # 同期ユースケース
│       │   └── tag.ts        # タグ管理ユースケース
│       └── queries/
│           ├── document.ts   # 文書取得
│           └── tag.ts        # タグ取得
└── infrastructure/
    ├── db/
    │   ├── schema/
    │   │   ├── document.ts   # 文書スキーマ
    │   │   ├── githubRepo.ts # GitHubリポジトリスキーマ
    │   │   └── tag.ts        # タグスキーマ
    │   └── repositories/
    │       └── document/
    │           ├── document.ts   # 文書リポジトリ実装
    │           ├── githubRepo.ts # GitHubリポジトリリポジトリ実装
    │           └── tag.ts        # タグリポジトリ実装
    └── api/
        └── github/
            ├── client.ts     # GitHub APIクライアント
            └── webhook.ts    # Webhookハンドラ
```

### 投稿管理コンテキスト

```
src/
├── domain/
│   └── post/
│       ├── models/
│       │   └── post.ts       # 投稿モデル
│       ├── services/
│       │   └── post.ts       # 投稿サービス
│       ├── repositories/
│       │   └── post.ts       # 投稿リポジトリインターフェース
│       └── contracts/
│           └── index.ts      # 公開インターフェース
├── application/
│   └── post/
│       ├── usecases/
│       │   └── post.ts       # 投稿ユースケース
│       └── queries/
│           └── post.ts       # 投稿情報取得
└── infrastructure/
    ├── db/
    │   ├── schema/
    │   │   └── post.ts       # 投稿スキーマ
    │   └── repositories/
    │       └── post/
    │           └── post.ts   # 投稿リポジトリ実装
    └── api/
        └── bluesky/
            └── client.ts     # Bluesky APIクライアント
```

### 表示コンテキスト

```
src/
├── app/
│   └── [user]/[repo]/
│       ├── page.tsx      # 文書表示ページ
│       └── layout.tsx    # レイアウト
├── components/
│   └── domain/
│       ├── DocumentView.tsx  # 文書表示
│       └── PostMetadata.tsx  # 投稿メタデータ
└── lib/
    └── markdown/
        └── renderer.ts   # Markdownレンダラー
```

## コンテキスト間の連携

コンテキスト間の連携は、契約（contracts）を通じて行います。各コンテキストは、他のコンテキストが利用できるインターフェースを公開します。

```typescript
// 例: src/domain/account/contracts/index.ts
import { ID } from '@/domain/shared/models/id';

export interface UserReference {
  id: ID;
  name: string;
  did: string;
}

export interface UserService {
  getUserReference(userId: ID): Promise<Result<UserReference, Error>>;
}

// 例: src/domain/document/models/document.ts
import { ID } from '@/domain/shared/models/id';
import { UserReference } from '@/domain/account/contracts';

export interface Document {
  id: ID;
  title: string;
  content: string;
  author: UserReference; // アカウントコンテキストからの参照
  // ...
}
```

## エラーハンドリング

Result型（neverthrow）を使用して、エラーを明示的に処理します。

```typescript
// 例: 同期サービスの実装
import { Result, ok, err } from 'neverthrow';
import { Document } from '@/domain/document/models/document';
import { SyncError } from '@/domain/document/models/errors';

export interface SyncService {
  syncDocument(repositoryId: string, path: string): Promise<Result<Document, SyncError>>;
}
```

## 依存性注入

依存性注入を使用して、コンポーネント間の結合度を低減します。

```typescript
// 例: ユースケースの実装
export class SyncDocumentInteractor implements SyncDocumentUseCase {
  constructor(
    private documentRepository: DocumentRepository,
    private githubClient: GitHubClient,
    private syncService: SyncService
  ) {}

  async execute(repositoryId: string, path: string): Promise<Result<Document, SyncError>> {
    // 実装
  }
}
``` 
