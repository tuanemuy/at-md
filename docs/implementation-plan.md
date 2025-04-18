# 実装計画

この計画は、設計資料に基づいてプロジェクトを段階的に実装するためのロードマップです。

## 各ステップの進め方

各ステップは**必ず**以下の手順に従って進めてください。不要な手順をスキップする場合は必ず理由を説明してください。

1. ステップの作業内容を確認する
2. `docs/*.md` の設計を確認する
3. 作業を行う
4. 型チェックを行う（`pnpm check`）
5. 静的解析を行う（`pnpm lint`）
6. テストを実装する
7. テストを行う（`pnpm test`）
8. エラーが無くなるまで4~7を繰り返す
9. ユーザーに確認する
10. 進捗を更新する

## フェーズ1: 基盤構築

### ステップ1.1 プロジェクト初期化

- [ ] ディレクトリ構造の作成（設計資料の構造に従う）

### ステップ1.2 共有カーネルの実装

- [ ] ID生成機能（`src/domain/shared/models/id.ts`）
- [ ] 共通型定義（`src/domain/shared/models/common.ts`）
- [ ] ロガー実装（`src/lib/logger.ts`）
- [ ] Result型のユーティリティ関数

## フェーズ2: ドメイン層の実装

### ステップ2.1 アカウント管理コンテキスト

- [ ] ユーザーモデル（`src/domain/account/models/user.ts`）
- [ ] 認証エラー型（`src/domain/account/models/errors.ts`）
- [ ] リポジトリインターフェース（`src/domain/account/repositories/user.ts`）
- [ ] サービスインターフェース（`src/domain/account/services/auth.ts`）
- [ ] コンテキスト間契約（`src/domain/account/contracts/index.ts`）

### ステップ2.2 文書管理コンテキスト

- [ ] 文書モデル（`src/domain/document/models/document.ts`）
- [ ] GitHubリポジトリモデル（`src/domain/document/models/githubRepo.ts`）
- [ ] タグモデル（`src/domain/document/models/tag.ts`）
- [ ] エラー型（`src/domain/document/models/errors.ts`）
- [ ] リポジトリインターフェース（文書、GitHubリポジトリ、タグ）
- [ ] サービスインターフェース（同期サービス）
- [ ] コンテキスト間契約
- [ ] 型チェック（`pnpm check`）
- [ ] 静的解析（`pnpm check`）
- [ ] テスト実装
- [ ] テスト（`pnpm test`）
- [ ] ユーザーに確認
- [ ] 進捗を更新

### ステップ2.3 投稿管理コンテキスト

- [ ] 投稿モデル（`src/domain/post/models/post.ts`）
- [ ] エラー型（`src/domain/post/models/errors.ts`）
- [ ] リポジトリインターフェース（`src/domain/post/repositories/post.ts`）
- [ ] サービスインターフェース（`src/domain/post/services/post.ts`）
- [ ] コンテキスト間契約
- [ ] 型チェック（`pnpm check`）
- [ ] 静的解析（`pnpm check`）
- [ ] テスト実装
- [ ] テスト（`pnpm test`）
- [ ] ユーザーに確認
- [ ] 進捗を更新

### ステップ2.4 DIコンテナの実装

- [ ] DIコンテナの実装（`src/lib/container.ts`）
- [ ] テスト用モックコンテナの実装

## フェーズ3: インフラストラクチャ層の実装

### ステップ3.1 データベースの準備

- [ ] スキーマ定義（`src/infrastructure/db/schema/*.ts`）
- [ ] データベースクライアントの実装（`src/infrastructure/db/client.ts`）
- [ ] マイグレーションファイル生成（`pnpm db:generate`）
- [ ] マイグレーション（`pnpm db:migrate`）

### ステップ3.2 ユーザーリポジトリの実装

- [ ] ユーザーリポジトリ（`src/infrastructure/db/repositories/account/user.ts`）

### ステップ3.3 文書リポジトリの実装

- [ ] 文書リポジトリ（`src/infrastructure/db/repositories/document/document.ts`）

### ステップ3.4 GitHubリポジトリリポジトリの実装

- [ ] GitHubリポジトリリポジトリ（`src/infrastructure/db/repositories/document/githubRepo.ts`）

### ステップ3.5 タグリポジトリの実装

- [ ] タグリポジトリ（`src/infrastructure/db/repositories/document/tag.ts`）

### ステップ3.6 投稿リポジトリの実装

- [ ] 投稿リポジトリ（`src/infrastructure/db/repositories/post/post.ts`）

### ステップ3.7 GitHub APIクライアントの実装

- [ ] GitHub APIクライアント（`src/infrastructure/api/github/client.ts`）

### ステップ3.8 Bluesky APIクライアントの実装

- [ ] Bluesky APIクライアント（`src/infrastructure/api/bluesky/client.ts`）

### ステップ3.9 Bluesky認証機能の実装

- [ ] Bluesky認証（`src/infrastructure/auth/bluesky.ts`）

### ステップ3.10 GitHub認証機能の実装

- [ ] GitHub認証（`src/infrastructure/auth/github.ts`）

## フェーズ4: アプリケーション層の実装

### ステップ4.1 アカウント管理ユースケースの実装

- [ ] ユーザー登録ユースケース（`src/application/account/usecases/register.ts`）
- [ ] GitHub連携ユースケース（`src/application/account/usecases/connect.ts`）
- [ ] ユーザー情報取得クエリ（`src/application/account/queries/user.ts`）

### ステップ4.2 文書管理ユースケースの実装

- [ ] 文書同期ユースケース（`src/application/document/usecases/sync.ts`）
- [ ] タグ管理ユースケース（`src/application/document/usecases/tag.ts`）
- [ ] Webhook処理ユースケース（`src/application/document/usecases/webhook.ts`）
- [ ] 文書取得クエリ（`src/application/document/queries/document.ts`）
- [ ] タグ取得クエリ（`src/application/document/queries/tag.ts`）

### ステップ4.3 投稿管理ユースケースの実装

- [ ] 投稿作成ユースケース（`src/application/post/usecases/post.ts`）
- [ ] 投稿情報取得クエリ（`src/application/post/queries/post.ts`）

## フェーズ5: プレゼンテーション層の実装

### ステップ5.1 認証・アカウント管理UIの実装

- [ ] ログインページ（`src/app/auth/login/page.tsx`）
- [ ] GitHub連携ページ（`src/app/auth/github/page.tsx`）
- [ ] アカウント設定ページ（`src/app/settings/page.tsx`）

### ステップ5.2 文書管理UIの実装

- [ ] リポジトリ一覧ページ（`src/app/dashboard/page.tsx`）
- [ ] 文書一覧ページ（`src/app/[user]/[repo]/page.tsx`）
- [ ] 文書表示ページ（`src/app/[user]/[repo]/[path]/page.tsx`）
- [ ] タグ管理UI（`src/components/domain/TagManager.tsx`）

### ステップ5.3 API Routesの実装

- [ ] Webhook受信エンドポイント（`src/app/api/webhook/route.ts`）
- [ ] 認証エンドポイント（`src/app/api/auth/route.ts`）
- [ ] 文書同期エンドポイント（`src/app/api/sync/route.ts`）

## フェーズ6: テストと最適化

### ステップ6.1 E2Eテスト

- [ ] E2Eテスト

### ステップ6.2 パフォーマンス最適化

- [ ] クエリの最適化
- [ ] キャッシュ戦略の実装
- [ ] 画像最適化

### ステップ6.3 セキュリティ強化

- [ ] 認証フローの見直し
- [ ] CSRF対策
- [ ] レート制限の実装

## フェーズ7: デプロイと運用準備

- [ ] CI/CDパイプラインの構築
- [ ] 本番環境の準備
- [ ] モニタリングとロギングの設定
- [ ] バックアップ戦略の実装
- [ ] デプロイ手順の文書化

## 優先実装項目

最初に実装すべき機能の優先順位：

1. ユーザー認証（Bluesky SSO）
2. GitHub連携
3. 文書同期
4. 文書表示
5. タグ管理
6. Bluesky投稿

## 技術的な検討事項

- 認証: Bluesky SSOの実装方法
- GitHub連携: GitHub Appsの設定と認証フロー
- 文書同期: Webhookの処理とMarkdownパース
- 投稿: Bluesky APIの利用方法
- データベース: リレーションの設計とインデックス最適化

## リスクと対策

| リスク | 影響度 | 対策 |
|-------|-------|------|
| Bluesky APIの仕様変更 | 高 | APIクライアントを抽象化し、変更に対応しやすい設計にする |
| GitHub APIのレート制限 | 中 | キャッシュ戦略とバックオフアルゴリズムの実装 |
| データベースのパフォーマンス | 中 | 適切なインデックス設計と定期的なパフォーマンス測定 |
| セキュリティリスク | 高 | 認証フローの厳格な実装と定期的なセキュリティレビュー |

## 開発環境

- Node.js 22.14.0
- pnpm 10.4.1
- PostgreSQL 15.x

## 次のステップ

1. プロジェクト初期化とディレクトリ構造の作成
2. 共有カーネルの実装
3. データベーススキーマの作成
4. ドメインモデルの実装開始
