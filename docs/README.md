# 設計資料

このディレクトリには、プロジェクトの設計・実装に関する資料が含まれています。

## 資料構成

| ファイル名 | 説明 |
|------------|------|
| [flowchart.md](./flowchart.md) | システムワークフローの図解 |
| [domain-model.md](./domain-model.md) | ドメインモデルの定義 |
| [domain-types.md](./domain-types.md) | ドメインモデルの型定義 |
| [architecture.md](./architecture.md) | アプリケーションアーキテクチャ |
| [usecase-examples.md](./usecase-examples.md) | ユースケース実装例 |
| [database-schema.md](./database-schema.md) | データベーススキーマ定義 |

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

## 設計原則

- ドメイン駆動設計（DDD）の原則に従う
- 関数型アプローチを優先し、副作用を分離
- 型安全性を重視
- Result型によるエラーハンドリング
- テスト容易性を考慮した設計
