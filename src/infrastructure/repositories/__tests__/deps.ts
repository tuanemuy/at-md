/**
 * リポジトリのテストファイル用の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../core/errors/application.ts";
import { generateId } from "../../../core/common/id.ts";

// アカウント関連
import { UserAggregate, createUserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";
import { User } from "../../../core/account/entities/user.ts";
import { UserRepository } from "../../../application/account/repositories/user-repository.ts";
import type { TransactionContext } from "../../../core/account/repositories/user-repository.ts";

// コンテンツ関連
import { ContentAggregate, createContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { Content } from "../../../core/content/entities/content.ts";
import { ContentMetadata } from "../../../core/content/value-objects/content-metadata.ts";
import { RepositoryAggregate, createRepositoryAggregate } from "../../../core/content/aggregates/repository-aggregate.ts";
import { Repository } from "../../../core/content/entities/repository.ts";
import { ContentRepository } from "../../../application/content/repositories/content-repository.ts";
import { RepositoryRepository } from "../../../application/content/repositories/repository-repository.ts";

// 配信関連
import { FeedAggregate, createNewFeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
import { Feed } from "../../../core/delivery/entities/feed.ts";
import { FeedMetadata } from "../../../core/delivery/value-objects/feed-metadata.ts";
import { FeedRepository } from "../../../application/delivery/repositories/feed-repository.ts";

// データベース関連
import { db } from "../../database/client.ts";
import { contents, repositories } from "../../database/schema/content.ts";
import { users } from "../../database/schema/user.ts";
import { feeds } from "../../database/schema/display.ts";
import type { Database } from "../../database/schema/mod.ts";

// スキーマのエクスポート
export {
  users,
  contents,
  repositories,
  feeds
};

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  generateId,
  
  // アカウント関連
  createUserAggregate,
  
  // コンテンツ関連
  createContentAggregate,
  createRepositoryAggregate,
  
  // 配信関連
  createNewFeedAggregate,
  
  // データベース関連
  db
};

// 型のエクスポート
export type {
  // アカウント関連
  UserAggregate,
  User,
  UserRepository,
  TransactionContext,
  
  // コンテンツ関連
  ContentAggregate,
  Content,
  ContentMetadata,
  RepositoryAggregate,
  Repository,
  ContentRepository,
  RepositoryRepository,
  
  // 配信関連
  FeedAggregate,
  Feed,
  FeedMetadata,
  FeedRepository,
  
  // データベース関連
  Database
}; 