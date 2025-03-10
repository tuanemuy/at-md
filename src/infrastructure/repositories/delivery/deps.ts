/**
 * 配信リポジトリの依存関係
 * 配信リポジトリで使用する依存関係をエクスポートします。
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
export type { Database } from "../../database/schema/mod.ts";

// スキーマ
export { feeds } from "../../database/schema/display.ts";

// リポジトリインターフェース
export type { FeedRepository } from "../../../application/delivery/repositories/feed-repository.ts";

// ドメインモデル
export type { FeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
export { createNewFeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
export type { Feed } from "../../../core/delivery/entities/feed.ts";
export type { FeedMetadataProps, FeedType } from "../../../core/delivery/value-objects/feed-metadata.ts"; 