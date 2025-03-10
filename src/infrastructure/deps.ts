/**
 * インフラストラクチャ層の共通依存関係
 * 
 * インフラストラクチャ層全体で使用する共通の依存関係をエクスポートします。
 */

// 外部依存
export * as pg from "npm:pg";
export { drizzle } from "npm:drizzle-orm/node-postgres";
export { migrate } from "npm:drizzle-orm/node-postgres/migrator";
export { eq, and, or, desc, asc, sql, inArray } from "npm:drizzle-orm";
export type { NodePgDatabase } from "npm:drizzle-orm/node-postgres";
export { pgTable, text, timestamp, uuid, varchar, jsonb } from "npm:drizzle-orm/pg-core";

// 内部依存
export { Result, ok, err } from "../deps.ts";
export type { Logger } from "../core/logging/mod.ts";
export { logger } from "../core/logging/logger.ts";
export { generateId } from "../core/common/id.ts";
export { ApplicationError, InfrastructureError } from "../core/errors/base.ts";

// アプリケーション層 - リポジトリインターフェース
export type { UserRepository } from "../application/account/repositories/user-repository.ts";
export type { ContentRepository } from "../application/content/repositories/content-repository.ts";
export type { RepositoryRepository } from "../application/content/repositories/repository-repository.ts";
export type { FeedRepository } from "../application/delivery/repositories/feed-repository.ts";
export type { PageRepository } from "../application/display/repositories/page-repository.ts";
export type { TemplateRepository } from "../application/display/repositories/template-repository.ts";

// コアドメイン - アカウント
export type { UserAggregate } from "../core/account/aggregates/user-aggregate.ts";
export type { TransactionContext } from "../core/account/repositories/user-repository.ts";

// コアドメイン - コンテンツ
export type { ContentAggregate } from "../core/content/aggregates/content-aggregate.ts";
export type { RepositoryAggregate } from "../core/content/aggregates/repository-aggregate.ts";

// コアドメイン - 配信
export type { FeedAggregate } from "../core/delivery/aggregates/feed-aggregate.ts";

// コアドメイン - 表示
export type { PageAggregate } from "../core/display/aggregates/page-aggregate.ts";
export type { ViewTemplate } from "../core/display/entities/view-template.ts";

// データベース関連
export type { UnitOfWork } from "./database/unit-of-work.ts";
export { TransactionError } from "./database/unit-of-work.ts";
export { PostgresUnitOfWork, PostgresTransactionContext } from "./database/postgres-unit-of-work.ts";
export { db, closeDbConnection } from "./database/db.ts"; 