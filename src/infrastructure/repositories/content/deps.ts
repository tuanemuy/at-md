/**
 * コンテンツリポジトリの依存関係
 * コンテンツリポジトリで使用する依存関係をエクスポートします。
 */

// 外部依存
export { eq, and, or, desc, asc, sql, inArray } from "npm:drizzle-orm";

// 内部依存
export { Result, ok, err } from "../../../deps.ts";
export { InfrastructureError } from "../../../core/errors/base.ts";
export type { TransactionContext } from "../../../core/account/repositories/user-repository.ts";

// データベース
export { db } from "../../database/db.ts";
export { PostgresTransactionContext } from "../../database/postgres-unit-of-work.ts";

// スキーマ
export { contents, repositories } from "../../database/schema/content.ts";

// リポジトリインターフェース
export type { ContentRepository } from "../../../application/content/repositories/content-repository.ts";
export type { RepositoryRepository } from "../../../application/content/repositories/repository-repository.ts";

// ドメインモデル
export type { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
export { createContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
export type { Content } from "../../../core/content/entities/content.ts";
export { createContent } from "../../../core/content/entities/content.ts";
export type { ContentParams } from "../../../core/content/entities/content.ts";
export type { Repository } from "../../../core/content/entities/repository.ts";
export type { ContentMetadata } from "../../../core/content/value-objects/content-metadata.ts";

// イベント
export type { DomainEvent } from "../../../core/common/events/domain-event.ts";

// コンテンツイベント
// 必要に応じてContentCreatedEventとContentUpdatedEventをインポートしてください
// export { ContentCreatedEvent, ContentUpdatedEvent } from "../../../core/content/events/content-events.ts";

// スキーマ
// 必要に応じてBaseSchemaをインポートしてください
// export type { BaseSchema } from "../../../core/common/schemas/base-schemas.ts"; 