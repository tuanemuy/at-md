# AT-MD プロジェクトドキュメント

このディレクトリには、AT-MDプロジェクトの設計・実装に関するドキュメントが含まれています。

## ドキュメント構成

| ファイル名 | 説明 | 最終更新日 |
|------------|------|------------|
| [flowchart.md](./flowchart.md) | システムワークフローの図解 | 2024-02-26 |
| [domain-model.md](./domain-model.md) | ドメイン駆動設計の基本モデリング | 2024-03-05 |
| [ddd-strategy.md](./ddd-strategy.md) | ドメイン駆動設計の戦略的設計 | 2024-03-05 |
| [domain-models.md](./domain-models.md) | 各コンテキストのドメインモデル詳細 | 2024-03-05 |
| [implementation-plan.md](./implementation-plan.md) | 実装計画と技術スタック | 2024-03-05 |

## ドキュメント間の関係

1. **flowchart.md**: システム全体のワークフローを視覚的に表現し、主要なコンポーネントとその相互作用を示しています。
2. **domain-model.md**: ワークフローに基づいて、システムの主要なドメインと境界づけられたコンテキストを特定しています。
3. **ddd-strategy.md**: 特定されたドメインとコンテキストに基づいて、ユビキタス言語の定義や戦略的設計の詳細を記述しています。
4. **domain-models.md**: 各境界づけられたコンテキスト内のエンティティ、値オブジェクト、集約などの詳細なドメインモデルを定義しています。
5. **implementation-plan.md**: ドメインモデルを実装するための技術スタック、プロジェクト構成、実装フェーズなどを計画しています。

## 開発フロー

1. システムワークフローの理解 (flowchart.md)
2. ドメイン分析とコンテキスト境界の特定 (domain-model.md)
3. 戦略的設計とユビキタス言語の定義 (ddd-strategy.md)
4. 詳細なドメインモデルの設計 (domain-models.md)
5. 実装計画の策定と技術スタックの選定 (implementation-plan.md)
6. 実装フェーズの実行

## 技術スタック概要

- **フロントエンド**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Hono (Next.js API Routes経由), Next.js サーバーアクション
- **データベース**: PostgreSQL, Drizzle ORM
- **外部システム連携**: GitHub API, AT Protocol 