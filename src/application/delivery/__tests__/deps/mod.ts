/**
 * deliveryドメイン用のテスト依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";
import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { spy } from "@std/testing/mock";

// 内部依存関係 - コアドメイン
import { DomainError } from "../../../../core/errors/base.ts";
import { ApplicationError } from "../../../../core/errors/base.ts";
import { InfrastructureError } from "../../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../../core/errors/application.ts";

// 配信関連
import { createFeedAggregate } from "../../../../core/delivery/aggregates/feed-aggregate.ts";
import { createPostAggregate } from "../../../../core/delivery/aggregates/post-aggregate.ts";
import type { FeedAggregate } from "../../../../core/delivery/aggregates/feed-aggregate.ts";
import type { PostAggregate } from "../../../../core/delivery/aggregates/post-aggregate.ts";
import type { Feed } from "../../../../core/delivery/entities/feed.ts";
import type { Post } from "../../../../core/delivery/entities/post.ts";
import type { FeedRepository } from "../../../delivery/repositories/feed-repository.ts";
import type { PostRepository } from "../../../delivery/repositories/post-repository.ts";
import type { FeedMetadata } from "../../../../core/delivery/value-objects/feed-metadata.ts";

// コンテンツ関連
import type { ContentRepository } from "../../../content/repositories/content-repository.ts";
import type { ContentAggregate } from "../../../../core/content/aggregates/content-aggregate.ts";

// 共通モジュール
import { generateId } from "../../../../core/common/mod.ts";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  expect,
  describe,
  it,
  beforeEach,
  afterEach,
  spy,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  InfrastructureError,
  ValidationError,
  EntityNotFoundError,
  
  // 配信関連
  createFeedAggregate,
  createPostAggregate,
  
  // 共通モジュール
  generateId
};

// 型のエクスポート
export type {
  // 配信関連
  Feed,
  Post,
  FeedRepository,
  PostRepository,
  FeedAggregate,
  PostAggregate,
  FeedMetadata,
  
  // コンテンツ関連
  ContentRepository,
  ContentAggregate
}; 