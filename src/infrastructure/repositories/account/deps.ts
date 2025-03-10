/**
 * アカウントリポジトリの依存関係
 * アカウントリポジトリで使用する依存関係をエクスポートします。
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
export { users } from "../../database/schema/user.ts";

// リポジトリインターフェース
export type { UserRepository } from "../../../application/account/repositories/user-repository.ts";

// ドメインモデル
export { UserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";
export type { User } from "../../../core/account/entities/user.ts";
export type { UserProfile } from "../../../core/account/value-objects/user-profile.ts"; 