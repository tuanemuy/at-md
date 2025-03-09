/**
 * モックヘルパー
 * 
 * テスト用のモックオブジェクトを生成するためのヘルパー関数を提供します。
 */

import { ContentRepository } from "../../src/application/content/repositories/content-repository.ts";
import { RepositoryRepository } from "../../src/application/content/repositories/repository-repository.ts";
import { ContentAggregate, createContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../src/core/content/aggregates/repository-aggregate.ts";
import { createTestContent, createTestRepository, createTestContentAggregate } from "./test-data-factory.ts";
import { Result, ok, err } from "../../src/deps.ts";
import { InfrastructureError } from "../../src/core/errors/base.ts";
import { TransactionContext } from "../../src/infrastructure/database/unit-of-work.ts";

/**
 * モックトランザクションコンテキストを作成する
 */
export function createMockTransactionContext(): TransactionContext {
  return {
    id: "mock-transaction-id"
  };
}

/**
 * モックコンテンツリポジトリを作成する
 * @param overrides メソッドのオーバーライド
 * @returns モックコンテンツリポジトリ
 */
export function createMockContentRepository(
  overrides: Partial<ContentRepository> = {}
): ContentRepository {
  return {
    findById: async (id: string): Promise<ContentAggregate | null> => {
      return createTestContentAggregate(createTestContent({ id }));
    },
    findByRepositoryIdAndPath: async (repositoryId: string, path: string): Promise<ContentAggregate | null> => {
      return createTestContentAggregate(createTestContent({ repositoryId, path }));
    },
    findByUserId: async (userId: string, options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<ContentAggregate[]> => {
      return [createTestContentAggregate(createTestContent({ userId }))];
    },
    findByRepositoryId: async (repositoryId: string, options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<ContentAggregate[]> => {
      return [createTestContentAggregate(createTestContent({ repositoryId }))];
    },
    save: async (contentAggregate: ContentAggregate): Promise<ContentAggregate> => {
      return contentAggregate;
    },
    saveWithTransaction: async (
      contentAggregate: ContentAggregate,
      _context: TransactionContext
    ): Promise<Result<ContentAggregate, InfrastructureError>> => {
      return ok(contentAggregate);
    },
    delete: async (id: string): Promise<boolean> => {
      return true;
    },
    deleteWithTransaction: async (
      _id: string,
      _context: TransactionContext
    ): Promise<Result<boolean, InfrastructureError>> => {
      return ok(true);
    },
    ...overrides
  };
}

/**
 * モックリポジトリリポジトリを作成する
 * @param overrides メソッドのオーバーライド
 * @returns モックリポジトリリポジトリ
 */
export function createMockRepositoryRepository(
  overrides: Partial<RepositoryRepository> = {}
): RepositoryRepository {
  // RepositoryAggregateのモック作成
  const createMockRepositoryAggregate = (repository = createTestRepository()): RepositoryAggregate => {
    return {
      repository,
      updateName: () => createMockRepositoryAggregate(),
      changeDefaultBranch: () => createMockRepositoryAggregate(),
      startSync: () => createMockRepositoryAggregate(),
      completeSync: () => createMockRepositoryAggregate(),
      deactivate: () => createMockRepositoryAggregate(),
      activate: () => createMockRepositoryAggregate()
    };
  };

  return {
    findById: async (id: string): Promise<RepositoryAggregate | null> => {
      return createMockRepositoryAggregate(createTestRepository({ id }));
    },
    findByUserId: async (userId: string, options?: {
      limit?: number;
      offset?: number;
    }): Promise<RepositoryAggregate[]> => {
      return [createMockRepositoryAggregate(createTestRepository({ userId }))];
    },
    findByName: async (userId: string, name: string): Promise<RepositoryAggregate | null> => {
      return createMockRepositoryAggregate(createTestRepository({ userId, name }));
    },
    save: async (repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> => {
      return repositoryAggregate;
    },
    saveWithTransaction: async (
      repositoryAggregate: RepositoryAggregate,
      _context: TransactionContext
    ): Promise<Result<RepositoryAggregate, InfrastructureError>> => {
      return ok(repositoryAggregate);
    },
    delete: async (id: string): Promise<boolean> => {
      return true;
    },
    deleteWithTransaction: async (
      _id: string,
      _context: TransactionContext
    ): Promise<Result<boolean, InfrastructureError>> => {
      return ok(true);
    },
    ...overrides
  };
} 