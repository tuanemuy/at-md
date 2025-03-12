# 実装計画

この計画は、設計資料に基づいてプロジェクトを段階的に実装するためのロードマップです。

## 各ステップの進め方

各ステップは**必ず**以下の手順に従って進めてください。不要な手順をスキップする場合は必ず理由を説明してください。

1. ステップの作業内容を確認する
2. `docs/*.md` の設計を確認する
3. 作業を行う
4. テストを実装する
5. テストを行う（`pnpm test`）
6. 型チェックを行う（`pnpm typecheck`）
7. 型エラーを修正する
8. 静的解析を行う（`pnpm lint`）
9. リンターエラーを修正する
10. テストを行う（`pnpm test`）
11. 実装を修正する
12. エラーが無くなるまで5~11を繰り返す
13. ユーザーに確認する
14. 進捗を更新する

## フェーズ1: 基盤構築 ✓

### ステップ1.1 プロジェクト初期化 ✓

- [x] ディレクトリ構造の作成（設計資料の構造に従う）

### ステップ1.2 共有カーネルの実装 ✓

- [x] ID生成機能（`src/domain/shared/models/id.ts`）
- [x] 共通型定義（`src/domain/shared/models/common.ts`）
- [x] ロガー実装（`src/lib/logger.ts`）
- [x] Result型のユーティリティ関数

## フェーズ2: ドメイン層の実装 ✓

### ステップ2.1 アカウント管理コンテキスト ✓

- [x] ユーザーモデル（`src/domain/account/models/user.ts`）
- [x] 認証エラー型（`src/domain/account/models/errors.ts`）
- [x] リポジトリインターフェース（`src/domain/account/repositories/user.ts`）
- [x] サービスインターフェース（`src/domain/account/services/auth.ts`）
- [x] コンテキスト間契約（`src/domain/account/contracts/index.ts`）

### ステップ2.2 文書管理コンテキスト ✓

- [x] 文書モデル（`src/domain/document/models/document.ts`）
- [x] GitHubリポジトリモデル（`src/domain/document/models/githubRepo.ts`）
- [x] タグモデル（`src/domain/document/models/tag.ts`）
- [x] エラー型（`src/domain/document/models/errors.ts`）
- [x] リポジトリインターフェース（文書、GitHubリポジトリ、タグ）
- [x] サービスインターフェース（同期サービス）
- [x] コンテキスト間契約

### ステップ2.3 投稿管理コンテキスト ✓

- [x] 投稿モデル（`src/domain/post/models/post.ts`）
- [x] エラー型（`src/domain/post/models/errors.ts`）
- [x] リポジトリインターフェース（`src/domain/post/repositories/post.ts`）
- [x] サービスインターフェース（`src/domain/post/services/post.ts`）
- [x] コンテキスト間契約

### ステップ2.4 DIコンテナの実装 ✓

- [x] DIコンテナの実装（`src/lib/container.ts`）
- [x] テスト用モックコンテナの実装

## フェーズ3: インフラストラクチャ層の実装

### ステップ3.1 データベースの準備 ✓

- [x] スキーマ定義（`src/infrastructure/db/schema/*.ts`）
- [x] データベースクライアントの実装（`src/infrastructure/db/client.ts`）
- [x] マイグレーションファイル生成（`pnpm db:generate`）
- [x] マイグレーション（`pnpm db:migrate`）

### ステップ3.2 ユーザーリポジトリの実装 ✓

- [x] ユーザーリポジトリ（`src/infrastructure/db/repositories/account/user.ts`）

### ステップ3.3 文書リポジトリの実装

- [x] 文書リポジトリ（`src/infrastructure/db/repositories/document/document.ts`）

### ステップ3.4 GitHubリポジトリリポジトリの実装

- [ ] GitHubリポジトリリポジトリ（`src/infrastructure/db/repositories/document/githubRepo.ts`）

### ステップ3.5 タグリポジトリの実装

- [ ] タグリポジトリ（`src/infrastructure/db/repositories/document/tag.ts`）

### ステップ3.6 投稿リポジトリの実装

- [ ] 投稿リポジトリ（`src/infrastructure/db/repositories/post/post.ts`）

### ステップ3.7 リポジトリの統合テスト

- [ ] テスト用データベース環境の構築（`src/infrastructure/db/__tests__/setup.ts`）
- [ ] ユーザーリポジトリの統合テスト（`src/infrastructure/db/__tests__/integration/user.test.ts`）
- [ ] 文書リポジトリの統合テスト（`src/infrastructure/db/__tests__/integration/document.test.ts`）
- [ ] GitHubリポジトリリポジトリの統合テスト（`src/infrastructure/db/__tests__/integration/githubRepo.test.ts`）
- [ ] タグリポジトリの統合テスト（`src/infrastructure/db/__tests__/integration/tag.test.ts`）
- [ ] 投稿リポジトリの統合テスト（`src/infrastructure/db/__tests__/integration/post.test.ts`）
- [ ] リポジトリ間の連携テスト（`src/infrastructure/db/__tests__/integration/relations.test.ts`）

### ステップ3.8 GitHub APIクライアントの実装

- [ ] GitHub APIクライアント（`src/infrastructure/api/github/client.ts`）

### ステップ3.9 Bluesky APIクライアントの実装

- [ ] Bluesky APIクライアント（`src/infrastructure/api/bluesky/client.ts`）

### ステップ3.10 Bluesky認証機能の実装

- [ ] Bluesky認証（`src/infrastructure/auth/bluesky.ts`）

### ステップ3.11 GitHub認証機能の実装

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

1. ~~プロジェクト初期化とディレクトリ構造の作成~~ ✓
2. ~~共有カーネルの実装~~ ✓
3. ~~DIコンテナの実装~~ ✓
4. ~~ドメインモデルの実装（アカウント管理、文書管理、投稿管理）~~ ✓
5. ~~データベーススキーマの作成~~ ✓
6. ~~マイグレーションファイル生成と実行~~ ✓
7. リポジトリの実装
   - ~~ユーザーリポジトリ~~ ✓
   - 文書リポジトリ
   - GitHubリポジトリリポジトリ
   - タグリポジトリ
   - 投稿リポジトリ
8. リポジトリの統合テスト
   - テスト用データベース環境の構築
   - 各リポジトリの統合テスト
   - リポジトリ間の連携テスト
