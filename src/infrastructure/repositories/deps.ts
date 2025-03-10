/**
 * インフラストラクチャ層のリポジトリ関連の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";
import { eq, and, or, desc, asc, sql, inArray } from "npm:drizzle-orm";

// 内部依存関係 - コアドメイン
import { DomainError } from "../../core/errors/base.ts";
import { generateId } from "../../core/common/mod.ts";

// トランザクション関連
import { TransactionContext } from "../../application/account/repositories/user-repository.ts";

// アカウント集約
import { createUserAggregate } from "../../core/account/aggregates/user-aggregate.ts";

// コンテンツ集約
import { createContentAggregate } from "../../core/content/aggregates/content-aggregate.ts";

// データベース関連
import { db } from "../database/db.ts";
import * as userSchema from "../database/schema/user.ts";
import * as contentSchema from "../database/schema/content.ts";
import * as displaySchema from "../database/schema/display.ts";
import { PostgresUnitOfWork, PostgresTransactionContext } from "../database/postgres-unit-of-work.ts";

// アカウント関連
import type { UserRepository } from "../../application/account/repositories/user-repository.ts";
import type { UserAggregate } from "../../core/account/aggregates/user-aggregate.ts";
import type { User } from "../../core/account/entities/user.ts";

// コンテンツ関連
import type { ContentRepository } from "../../application/content/repositories/content-repository.ts";
import type { RepositoryRepository } from "../../application/content/repositories/repository-repository.ts";
import type { ContentAggregate } from "../../core/content/aggregates/content-aggregate.ts";
import type { RepositoryAggregate } from "../../core/content/aggregates/repository-aggregate.ts";
import type { Content } from "../../core/content/entities/content.ts";
import type { Repository } from "../../core/content/entities/repository.ts";
import type { ContentMetadata } from "../../core/content/value-objects/content-metadata.ts";

// 配信関連
import type { FeedRepository } from "../../application/delivery/repositories/feed-repository.ts";
import type { FeedAggregate } from "../../core/delivery/aggregates/feed-aggregate.ts";
import type { Feed } from "../../core/delivery/entities/feed.ts";
import type { FeedMetadata } from "../../core/delivery/value-objects/feed-metadata.ts";

// ドメインイベント
import { ContentCreatedEvent, ContentUpdatedEvent } from "../../core/content/events/content-events.ts";
import type { DomainEvent } from "../../core/common/events/mod.ts";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  inArray,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  generateId,
  
  // アカウント集約
  createUserAggregate,
  
  // コンテンツ集約
  createContentAggregate,
  
  // データベース関連
  db,
  userSchema,
  contentSchema,
  displaySchema,
  PostgresUnitOfWork,
  PostgresTransactionContext,
  
  // ドメインイベント
  ContentCreatedEvent,
  ContentUpdatedEvent
};

// 型のエクスポート
export type {
  // アカウント関連
  UserRepository,
  UserAggregate,
  User,
  
  // コンテンツ関連
  ContentRepository,
  RepositoryRepository,
  ContentAggregate,
  RepositoryAggregate,
  Content,
  Repository,
  ContentMetadata,
  
  // 配信関連
  FeedRepository,
  FeedAggregate,
  Feed,
  FeedMetadata,
  
  // ドメインイベント
  DomainEvent,
  
  // トランザクション関連
  TransactionContext
}; 