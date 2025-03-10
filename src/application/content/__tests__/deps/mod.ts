/**
 * contentドメイン用のテスト依存関係をエクスポートするモジュール
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

// コンテンツ関連
import { ContentAggregate, createContentAggregate } from "../../../../core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate, createRepositoryAggregate } from "../../../../core/content/aggregates/repository-aggregate.ts";
import type { Content } from "../../../../core/content/entities/content.ts";
import type { Repository } from "../../../../core/content/entities/repository.ts";
import type { ContentRepository } from "../../../content/repositories/content-repository.ts";
import type { RepositoryRepository } from "../../../content/repositories/repository-repository.ts";
import type { ContentMetadata } from "../../../../core/content/value-objects/content-metadata.ts";

// 共通モジュール
import { generateId } from "../../../../core/common/mod.ts";

// クエリ
import { GetContentByIdQuery, GetContentByIdQueryHandler } from "../../../content/queries/get-content-by-id-query.ts";

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
  
  // コンテンツ関連
  createContentAggregate,
  createRepositoryAggregate,
  
  // 共通モジュール
  generateId,
  
  // クエリ
  GetContentByIdQueryHandler
};

// 型のエクスポート
export type {
  // コンテンツ関連
  Content,
  Repository,
  ContentRepository,
  RepositoryRepository,
  ContentAggregate,
  RepositoryAggregate,
  ContentMetadata,
  
  // クエリ
  GetContentByIdQuery
}; 