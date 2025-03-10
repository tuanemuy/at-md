/**
 * インフラストラクチャ層のデータベース関連の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";
import { drizzle } from "npm:drizzle-orm/postgres-js";
import { migrate } from "npm:drizzle-orm/postgres-js/migrator";
import { eq, and, or, desc, asc, sql, inArray } from "npm:drizzle-orm";
import postgres from "npm:postgres";

// 内部依存関係 - コアドメイン
import { DomainError, InfrastructureError, ApplicationError } from "../../core/errors/base.ts";
import { generateId } from "../../core/common/mod.ts";
import { Logger, logger } from "../../core/logging/mod.ts";

// スキーマ
import * as userSchema from "./schema/user.ts";
import * as contentSchema from "./schema/content.ts";
import * as displaySchema from "./schema/display.ts";

// データベース関連
import { db } from "./db.ts";
import { PostgresUnitOfWork } from "./postgres-unit-of-work.ts";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  drizzle,
  migrate,
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  inArray,
  postgres,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  InfrastructureError,
  ApplicationError,
  generateId,
  Logger,
  logger,
  
  // スキーマ
  userSchema,
  contentSchema,
  displaySchema,
  
  // データベース関連
  db,
  PostgresUnitOfWork
};

// 型のエクスポート
export type {
  // トランザクション関連
  TransactionContext
}; 

/**
 * トランザクションコンテキスト
 */
interface TransactionContext {
  id: string;
} 