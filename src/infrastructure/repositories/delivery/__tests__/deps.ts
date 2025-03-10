/**
 * 配信リポジトリのテストファイル用の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../../core/errors/application.ts";
import { generateId } from "../../../../core/common/id.ts";

// 配信関連
import { FeedAggregate, createNewFeedAggregate } from "../../../../core/delivery/aggregates/feed-aggregate.ts";
import { Feed } from "../../../../core/delivery/entities/feed.ts";
import { FeedMetadata } from "../../../../core/delivery/value-objects/feed-metadata.ts";
import { FeedRepository } from "../../../../application/delivery/repositories/feed-repository.ts";

// データベース関連
import { db } from "../../../database/client.ts";
import { feeds } from "../../../database/schema/display.ts";

// スキーマのエクスポート
export {
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
  
  // 配信関連
  createNewFeedAggregate,
  
  // データベース関連
  db
};

// 型のエクスポート
export type {
  // 配信関連
  FeedAggregate,
  Feed,
  FeedMetadata,
  FeedRepository
}; 