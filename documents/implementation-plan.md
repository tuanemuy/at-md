# 実装計画

このドキュメントでは、[domain-model.md](./domain-model.md)で特定された境界づけられたコンテキスト、[ddd-strategy.md](./ddd-strategy.md)で定義された戦略、および[domain-models.md](./domain-models.md)で詳細化されたドメインモデルに基づいて、システムの実装計画を詳細に記述します。

## 1. 技術スタックの詳細

### 1.1 フロントエンド

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **状態管理**: React Context + SWR
- **スタイリング**: Tailwind CSS
- **コンポーネントライブラリ**: shadcn/ui
- **マークダウンレンダリング**: MDX + Rehype/Remark プラグイン
- **図表レンダリング**: Mermaid.js

### 1.2 バックエンド

- **フレームワーク**: Hono（Next.js API Routesから配信）+ Next.js サーバーアクション
- **言語**: TypeScript
- **認証**: NextAuth.js
- **バリデーション**: Zod
- **ORM**: Drizzle ORM

### 1.3 データベース

- **メインDB**: PostgreSQL
- **キャッシュ**: Redis
- **検索**: PostgreSQL全文検索

### 1.4 インフラストラクチャ

- **ホスティング**: Vercel
- **サーバーレス関数**: Vercel Functions / AWS Lambda
- **ストレージ**: AWS S3
- **CDN**: Vercel Edge Network
- **CI/CD**: GitHub Actions

### 1.5 外部システム連携

- **GitHub API**: Octokit.js
- **AT Protocol**: AT Protocol SDK

## 2. プロジェクト構成

```
at-md/
├── .github/                    # GitHub関連設定
├── drizzle/                    # Drizzleスキーマ定義とマイグレーション
├── public/                     # 静的ファイル
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Honoを使用したAPI Routes
│   │   ├── auth/               # 認証関連ページ
│   │   ├── dashboard/          # ダッシュボード
│   │   ├── [slug]/             # 動的ページルート
│   │   └── ...
│   │
│   ├── core/                   # 共通コアモジュール
│   │   ├── types/              # 共通型定義
│   │   ├── utils/              # ユーティリティ関数
│   │   └── errors/             # エラー定義
│   │
│   ├── account/                # アカウント管理コンテキスト
│   │   ├── domain/             # ドメインレイヤー
│   │   │   ├── entities/       # エンティティ
│   │   │   ├── value-objects/  # 値オブジェクト
│   │   │   ├── aggregates/     # 集約
│   │   │   ├── events/         # ドメインイベント
│   │   │   └── services/       # ドメインサービス
│   │   │
│   │   ├── application/        # アプリケーションレイヤー
│   │   │   ├── commands/       # コマンド
│   │   │   ├── queries/        # クエリ
│   │   │   └── services/       # アプリケーションサービス
│   │   │
│   │   ├── infrastructure/     # インフラストラクチャレイヤー
│   │   │   ├── repositories/   # リポジトリ実装
│   │   │   ├── adapters/       # アダプター
│   │   │   └── services/       # インフラサービス
│   │   │
│   │   └── interface/          # インターフェースレイヤー
│   │       ├── controllers/    # コントローラー
│   │       ├── dtos/           # DTOs
│   │       └── views/          # ビュー
│   │
│   ├── content/                # コンテンツ管理コンテキスト
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── interface/
│   │
│   ├── publishing/             # 配信コンテキスト
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── interface/
│   │
│   └── presentation/           # 表示コンテキスト
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── interface/
│
├── functions/                  # サーバーレス関数
│   ├── github-sync/            # GitHub同期関数
│   └── feed-sync/              # フィード同期関数
│
├── components/                 # 共通UIコンポーネント
│   ├── ui/                     # shadcn/uiコンポーネント
│   ├── layout/                 # レイアウトコンポーネント
│   ├── markdown/               # マークダウン関連コンポーネント
│   └── forms/                  # フォームコンポーネント
│
├── styles/                     # スタイル定義
├── lib/                        # ユーティリティライブラリ
│   ├── db/                     # Drizzle ORM設定
│   ├── api/                    # Honoインスタンス設定
│   └── server-actions/         # サーバーアクション
│
├── config/                     # 設定ファイル
└── scripts/                    # ユーティリティスクリプト
```

## 3. 実装フェーズ

### 3.1 フェーズ1: 基盤構築（4週間）

#### 週1: プロジェクトセットアップ
- プロジェクト構造の作成
- 開発環境のセットアップ
- 基本的なCI/CDパイプラインの構築
- コアモジュールの実装
- Drizzle ORMとHonoの初期設定

#### 週2: アカウント管理コンテキスト（基本部分）
- ユーザーエンティティとリポジトリの実装
- 基本的な認証機能の実装（NextAuth.js）
- AT Protocolとの認証連携
- サーバーアクションを使用した認証フロー

#### 週3: コンテンツ管理コンテキスト（基本部分）
- コンテンツエンティティとリポジトリの実装
- リポジトリエンティティとリポジトリの実装
- GitHub APIとの基本連携
- Honoを使用したAPIエンドポイント実装

#### 週4: 基本的なUI実装
- shadcn/uiを使用したダッシュボードの基本レイアウト
- ユーザー認証フロー
- 基本的なナビゲーション

### 3.2 フェーズ2: コアドメイン実装（6週間）

#### 週5-6: コンテンツ管理機能の拡張
- GitHub同期機能の完全実装
- コンテンツバージョン管理
- マークダウン編集・プレビュー機能
- サーバーアクションを使用したコンテンツ操作

#### 週7-8: 配信コンテキスト実装
- ポストエンティティとリポジトリの実装
- フィードエンティティとリポジトリの実装
- AT Protocol配信機能の実装
- Honoを使用した配信APIの実装

#### 週9-10: 表示コンテキスト実装
- ページエンティティとリポジトリの実装
- マークダウンレンダリング機能
- 基本的なテンプレート機能
- サーバーコンポーネントを活用したレンダリング

### 3.3 フェーズ3: 機能拡張と統合（4週間）

#### 週11: サーバーレス関数実装
- GitHub同期関数の実装
- フィード同期関数の実装
- Webhookハンドラーの実装（Hono活用）

#### 週12: イベント駆動アーキテクチャの実装
- ドメインイベントの実装
- イベントバスの実装
- コンテキスト間連携の実装

#### 週13-14: UI/UX改善とテスト
- 高度なマークダウン編集機能
- レスポンシブデザインの最適化
- E2Eテストの実装

### 3.4 フェーズ4: 最適化とリリース準備（2週間）

#### 週15: パフォーマンス最適化
- データベースクエリの最適化（Drizzle ORMの活用）
- フロントエンドのパフォーマンス改善
- キャッシュ戦略の実装

#### 週16: リリース準備
- セキュリティレビュー
- ドキュメント作成
- 本番環境のセットアップ

## 4. データベーススキーマ設計

### 4.1 アカウント管理コンテキスト

```typescript
// Drizzle ORM スキーマ定義
import { pgTable, text, timestamp, boolean, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  status: text('status').default('active').notNull(),
  role: text('role').default('creator').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    emailIdx: uniqueIndex('email_idx').on(table.email)
  };
});

export const atAccounts = pgTable('at_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull(),
  did: text('did').notNull(),
  status: text('status').default('connected').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    userIdIdx: uniqueIndex('user_id_idx').on(table.userId),
    handleIdx: uniqueIndex('handle_idx').on(table.handle),
    didIdx: uniqueIndex('did_idx').on(table.did)
  };
});

export const githubIntegrations = pgTable('github_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  installationId: text('installation_id').notNull(),
  status: text('status').default('connected').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    userIdIdx: uniqueIndex('user_id_idx').on(table.userId)
  };
});
```

### 4.2 コンテンツ管理コンテキスト

```typescript
export const repositories = pgTable('repositories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  owner: text('owner').notNull(),
  defaultBranch: text('default_branch').default('main').notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    userIdNameIdx: uniqueIndex('user_id_name_idx').on(table.userId, table.name)
  };
});

export const contents = pgTable('contents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  repositoryId: uuid('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: text('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    repoPathIdx: uniqueIndex('repo_path_idx').on(table.repositoryId, table.path)
  };
});

export const contentMetadata = pgTable('content_metadata', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  tags: text('tags').array(),
  categories: text('categories').array(),
  publishedAt: timestamp('published_at'),
  lastPublishedAt: timestamp('last_published_at'),
  excerpt: text('excerpt'),
  featuredImage: text('featured_image'),
  language: text('language').default('ja').notNull(),
  readingTime: integer('reading_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    contentIdIdx: uniqueIndex('content_id_idx').on(table.contentId)
  };
});

export const versions = pgTable('versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  commitId: text('commit_id').notNull(),
  changes: jsonb('changes').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### 4.3 配信コンテキスト

```typescript
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  atUri: text('at_uri'),
  title: text('title').notNull(),
  text: text('text').notNull(),
  status: text('status').default('pending').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    contentIdIdx: uniqueIndex('content_id_idx').on(table.contentId)
  };
});

export const publishStatus = pgTable('publish_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  message: text('message'),
  retryCount: integer('retry_count').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    postIdIdx: uniqueIndex('post_id_idx').on(table.postId)
  };
});

export const feeds = pgTable('feeds', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    userIdNameIdx: uniqueIndex('user_id_name_idx').on(table.userId, table.name)
  };
});

export const feedMetadata = pgTable('feed_metadata', {
  id: uuid('id').defaultRandom().primaryKey(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  description: text('description'),
  avatar: text('avatar'),
  banner: text('banner'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    feedIdIdx: uniqueIndex('feed_id_idx').on(table.feedId)
  };
});

export const feedPosts = pgTable('feed_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull()
}, (table) => {
  return {
    feedPostIdx: uniqueIndex('feed_post_idx').on(table.feedId, table.postId)
  };
});
```

### 4.4 表示コンテキスト

```typescript
export const viewTemplates = pgTable('view_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  layout: text('layout').default('default').notNull(),
  components: jsonb('components').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    nameIdx: uniqueIndex('name_idx').on(table.name)
  };
});

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  templateId: uuid('template_id').notNull().references(() => viewTemplates.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    contentIdIdx: uniqueIndex('content_id_idx').on(table.contentId),
    slugIdx: uniqueIndex('slug_idx').on(table.slug)
  };
});

export const pageMetadata = pgTable('page_metadata', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  description: text('description'),
  ogImage: text('og_image'),
  keywords: text('keywords').array(),
  canonicalUrl: text('canonical_url'),
  publishedAt: timestamp('published_at'),
  updatedAt: timestamp('updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    pageIdIdx: uniqueIndex('page_id_idx').on(table.pageId)
  };
});

export const renderingOptions = pgTable('rendering_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  theme: text('theme').default('light').notNull(),
  codeHighlighting: boolean('code_highlighting').default(true).notNull(),
  tableOfContents: boolean('table_of_contents').default(true).notNull(),
  syntaxHighlightingTheme: text('syntax_highlighting_theme').default('github').notNull(),
  renderMath: boolean('render_math').default(false).notNull(),
  renderDiagrams: boolean('render_diagrams').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    pageIdIdx: uniqueIndex('page_id_idx').on(table.pageId)
  };
});
```

## 5. API設計

### 5.1 Hono APIルート構成

```typescript
// src/lib/api/index.ts
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono()
  .basePath('/api');

// 認証API
const auth = app.route('/auth');
auth.post('/signin', signinHandler);
auth.post('/signout', signoutHandler);
auth.get('/session', sessionHandler);
auth.post('/refresh', refreshHandler);

// ユーザーAPI
const users = app.route('/users');
users.get('/me', getMeHandler);
users.put('/me', updateMeHandler);
users.get('/:id', getUserHandler);

// 統合API
const integrations = app.route('/integrations');
integrations.post('/github/setup', setupGithubHandler);
integrations.post('/atprotocol/setup', setupATProtocolHandler);
integrations.get('/github/status', githubStatusHandler);
integrations.get('/atprotocol/status', atprotocolStatusHandler);

// コンテンツAPI
const contents = app.route('/contents');
contents.get('/', getContentsHandler);
contents.post('/', createContentHandler);
contents.get('/:id', getContentHandler);
contents.put('/:id', updateContentHandler);
contents.delete('/:id', deleteContentHandler);
contents.get('/:id/versions', getContentVersionsHandler);
contents.get('/:id/versions/:versionId', getContentVersionHandler);

// リポジトリAPI
const repositories = app.route('/repositories');
repositories.get('/', getRepositoriesHandler);
repositories.post('/', createRepositoryHandler);
repositories.get('/:id', getRepositoryHandler);
repositories.put('/:id', updateRepositoryHandler);
repositories.post('/:id/sync', syncRepositoryHandler);
repositories.get('/:id/contents', getRepositoryContentsHandler);

// 配信API
const posts = app.route('/posts');
posts.get('/', getPostsHandler);
posts.post('/', createPostHandler);
posts.get('/:id', getPostHandler);
posts.put('/:id', updatePostHandler);
posts.post('/:id/publish', publishPostHandler);
posts.post('/:id/unpublish', unpublishPostHandler);

// フィードAPI
const feeds = app.route('/feeds');
feeds.get('/', getFeedsHandler);
feeds.post('/', createFeedHandler);
feeds.get('/:id', getFeedHandler);
feeds.put('/:id', updateFeedHandler);
feeds.delete('/:id', deleteFeedHandler);
feeds.post('/:id/posts/:postId', addPostToFeedHandler);
feeds.delete('/:id/posts/:postId', removePostFromFeedHandler);

// ページAPI
const pages = app.route('/pages');
pages.get('/', getPagesHandler);
pages.get('/:id', getPageHandler);
pages.put('/:id', updatePageHandler);
pages.get('/by-slug/:slug', getPageBySlugHandler);

// Webhook API
const webhooks = app.route('/webhooks');
webhooks.post('/github', githubWebhookHandler);
webhooks.post('/atprotocol', atprotocolWebhookHandler);

export default handle(app);
```

### 5.2 サーバーアクション

```typescript
// src/lib/server-actions/content.ts
'use server'

import { db } from '@/lib/db';
import { contents, contentMetadata } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createContent(formData: FormData) {
  const title = formData.get('title') as string;
  const body = formData.get('body') as string;
  const repositoryId = formData.get('repositoryId') as string;
  const path = formData.get('path') as string;
  
  // バリデーション、ドメインロジック実行など
  
  // データベース操作
  const [content] = await db.insert(contents).values({
    title,
    body,
    repositoryId,
    path,
    userId: 'current-user-id', // 認証情報から取得
  }).returning();
  
  // メタデータ作成
  await db.insert(contentMetadata).values({
    contentId: content.id,
    tags: [],
    categories: [],
    language: 'ja',
  });
  
  revalidatePath('/dashboard/contents');
  redirect(`/dashboard/contents/${content.id}`);
}

// 他のサーバーアクション
```

## 6. ユーザーストーリー

### 6.1 アカウント管理

1. ユーザーとして、AT Protocolアカウントでログインしたい
2. ユーザーとして、GitHubアカウントと連携したい
3. ユーザーとして、自分のプロフィール情報を編集したい

### 6.2 コンテンツ管理

1. 作成者として、GitHubリポジトリを接続したい
2. 作成者として、マークダウンコンテンツを作成・編集したい
3. 作成者として、コンテンツのバージョン履歴を確認したい
4. 作成者として、コンテンツのメタデータを編集したい

### 6.3 配信

1. 作成者として、コンテンツをAT Protocolに公開したい
2. 作成者として、公開したコンテンツの状態を確認したい
3. 作成者として、フィードを管理したい
4. 作成者として、公開に失敗したコンテンツを再公開したい

### 6.4 表示

1. 閲覧者として、公開されたコンテンツを閲覧したい
2. 閲覧者として、コンテンツを検索したい
3. 作成者として、コンテンツの表示テンプレートをカスタマイズしたい
4. 作成者として、コンテンツのレンダリングオプションを設定したい

## 7. 次のステップ

1. プロジェクトリポジトリのセットアップ
2. 開発環境の構築
3. Drizzle ORMスキーマの実装とマイグレーション設定
4. Honoを使用したAPIルートの実装
5. shadcn/uiコンポーネントのセットアップ
6. 認証機能の実装
7. GitHub連携機能の実装開始 