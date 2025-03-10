/**
 * アプリケーション層の配信ドメイン用の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError, InfrastructureError } from "../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../core/errors/application.ts";
import { generateId } from "../../core/common/mod.ts";

// 配信ドメイン
import { Feed } from "../../core/delivery/entities/feed.ts";
import { Post } from "../../core/delivery/entities/post.ts";
import { FeedAggregate, createNewFeedAggregate } from "../../core/delivery/aggregates/feed-aggregate.ts";
import { PostAggregate, createNewPostAggregate } from "../../core/delivery/aggregates/post-aggregate.ts";
import { PublishStatus, createPublishStatus } from "../../core/delivery/value-objects/publish-status.ts";
import type { PublishStatusType, PublishStatusProps } from "../../core/delivery/value-objects/publish-status.ts";
import type { FeedMetadata, FeedMetadataProps } from "../../core/delivery/value-objects/feed-metadata.ts";

// リポジトリ
import type { FeedRepository } from "../../core/delivery/repositories/feed-repository.ts";
import type { PostRepository } from "../../core/delivery/repositories/post-repository.ts";
import type { TransactionContext } from "../../core/delivery/repositories/transaction-context.ts";

// テスト用
import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  InfrastructureError,
  ValidationError,
  EntityNotFoundError,
  generateId,
  
  // 配信ドメイン
  createPublishStatus,
  createNewFeedAggregate,
  createNewPostAggregate,
  
  // テスト用
  expect,
  describe,
  it,
  beforeEach,
  afterEach
};

// 型のエクスポート
export type {
  // 配信ドメイン
  Feed,
  Post,
  FeedAggregate,
  PostAggregate,
  PublishStatus,
  PublishStatusType,
  PublishStatusProps,
  FeedMetadata,
  FeedMetadataProps,
  
  // リポジトリ
  FeedRepository,
  PostRepository,
  TransactionContext
}; 