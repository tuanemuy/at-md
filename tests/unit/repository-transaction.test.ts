/**
 * リポジトリのトランザクション対応メソッドのユニットテスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { createMockTransactionContext } from "../helpers/mock-helpers.ts";
import { createTestContent, createTestRepository } from "../helpers/test-data-factory.ts";
import { createContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";
import { createRepositoryAggregate } from "../../src/core/content/aggregates/repository-aggregate.ts";
import { Result, ok, err } from "../../src/deps.ts";
import { InfrastructureError } from "../../src/core/errors/base.ts";
import { TransactionContext } from "../../src/infrastructure/database/unit-of-work.ts";
import { ContentRepository } from "../../src/application/content/repositories/content-repository.ts";
import { RepositoryRepository } from "../../src/application/content/repositories/repository-repository.ts";
import { ContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../src/core/content/aggregates/repository-aggregate.ts";

// モックリポジトリの実装
class MockContentRepositoryWithTransaction implements ContentRepository {
  private contents = new Map<string, ContentAggregate>();
  private transactionContents = new Map<string, Map<string, ContentAggregate>>();
  private shouldFailOnSave = false;
  private shouldFailOnDelete = false;

  constructor(options?: {
    shouldFailOnSave?: boolean;
    shouldFailOnDelete?: boolean;
  }) {
    this.shouldFailOnSave = options?.shouldFailOnSave || false;
    this.shouldFailOnDelete = options?.shouldFailOnDelete || false;
  }

  async findById(id: string): Promise<ContentAggregate | null> {
    return this.contents.get(id) || null;
  }

  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null> {
    for (const content of this.contents.values()) {
      if (content.content.repositoryId === repositoryId && content.content.path === path) {
        return content;
      }
    }
    return null;
  }

  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const results: ContentAggregate[] = [];
    for (const content of this.contents.values()) {
      if (content.content.userId === userId) {
        results.push(content);
      }
    }
    return results;
  }

  async findByRepositoryId(repositoryId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const results: ContentAggregate[] = [];
    for (const content of this.contents.values()) {
      if (content.content.repositoryId === repositoryId) {
        results.push(content);
      }
    }
    return results;
  }

  async save(contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    this.contents.set(contentAggregate.content.id, contentAggregate);
    return contentAggregate;
  }

  async saveWithTransaction(
    contentAggregate: ContentAggregate,
    context: TransactionContext
  ): Promise<Result<ContentAggregate, InfrastructureError>> {
    if (this.shouldFailOnSave) {
      return err(new InfrastructureError("コンテンツの保存に失敗しました"));
    }

    // トランザクションIDごとに一時的なコンテンツを保存
    if (!this.transactionContents.has(context.id)) {
      this.transactionContents.set(context.id, new Map());
    }
    this.transactionContents.get(context.id)!.set(contentAggregate.content.id, contentAggregate);
    
    return ok(contentAggregate);
  }

  async delete(id: string): Promise<boolean> {
    if (!this.contents.has(id)) {
      return false;
    }
    this.contents.delete(id);
    return true;
  }

  async deleteWithTransaction(
    id: string,
    context: TransactionContext
  ): Promise<Result<boolean, InfrastructureError>> {
    if (this.shouldFailOnDelete) {
      return err(new InfrastructureError("コンテンツの削除に失敗しました"));
    }

    // トランザクションIDごとに一時的なコンテンツを削除
    if (!this.transactionContents.has(context.id)) {
      return ok(false);
    }
    
    const transactionContent = this.transactionContents.get(context.id)!;
    if (!transactionContent.has(id)) {
      return ok(false);
    }
    
    transactionContent.delete(id);
    return ok(true);
  }

  // トランザクションをコミット
  commitTransaction(contextId: string): void {
    if (!this.transactionContents.has(contextId)) {
      return;
    }
    
    const transactionContent = this.transactionContents.get(contextId)!;
    for (const [id, content] of transactionContent.entries()) {
      this.contents.set(id, content);
    }
    
    this.transactionContents.delete(contextId);
  }

  // トランザクションをロールバック
  rollbackTransaction(contextId: string): void {
    this.transactionContents.delete(contextId);
  }
}

// モックリポジトリリポジトリの実装
class MockRepositoryRepositoryWithTransaction implements RepositoryRepository {
  private repositories = new Map<string, RepositoryAggregate>();
  private transactionRepositories = new Map<string, Map<string, RepositoryAggregate>>();
  private shouldFailOnSave = false;
  private shouldFailOnDelete = false;

  constructor(options?: {
    shouldFailOnSave?: boolean;
    shouldFailOnDelete?: boolean;
  }) {
    this.shouldFailOnSave = options?.shouldFailOnSave || false;
    this.shouldFailOnDelete = options?.shouldFailOnDelete || false;
  }

  async findById(id: string): Promise<RepositoryAggregate | null> {
    return this.repositories.get(id) || null;
  }

  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<RepositoryAggregate[]> {
    const results: RepositoryAggregate[] = [];
    for (const repository of this.repositories.values()) {
      if (repository.repository.userId === userId) {
        results.push(repository);
      }
    }
    return results;
  }

  async findByName(userId: string, name: string): Promise<RepositoryAggregate | null> {
    for (const repository of this.repositories.values()) {
      if (repository.repository.userId === userId && repository.repository.name === name) {
        return repository;
      }
    }
    return null;
  }

  async save(repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> {
    this.repositories.set(repositoryAggregate.repository.id, repositoryAggregate);
    return repositoryAggregate;
  }

  async saveWithTransaction(
    repositoryAggregate: RepositoryAggregate,
    context: TransactionContext
  ): Promise<Result<RepositoryAggregate, InfrastructureError>> {
    if (this.shouldFailOnSave) {
      return err(new InfrastructureError("リポジトリの保存に失敗しました"));
    }

    // トランザクションIDごとに一時的なリポジトリを保存
    if (!this.transactionRepositories.has(context.id)) {
      this.transactionRepositories.set(context.id, new Map());
    }
    this.transactionRepositories.get(context.id)!.set(repositoryAggregate.repository.id, repositoryAggregate);
    
    return ok(repositoryAggregate);
  }

  async delete(id: string): Promise<boolean> {
    if (!this.repositories.has(id)) {
      return false;
    }
    this.repositories.delete(id);
    return true;
  }

  async deleteWithTransaction(
    id: string,
    context: TransactionContext
  ): Promise<Result<boolean, InfrastructureError>> {
    if (this.shouldFailOnDelete) {
      return err(new InfrastructureError("リポジトリの削除に失敗しました"));
    }

    // トランザクションIDごとに一時的なリポジトリを削除
    if (!this.transactionRepositories.has(context.id)) {
      return ok(false);
    }
    
    const transactionRepository = this.transactionRepositories.get(context.id)!;
    if (!transactionRepository.has(id)) {
      return ok(false);
    }
    
    transactionRepository.delete(id);
    return ok(true);
  }

  // トランザクションをコミット
  commitTransaction(contextId: string): void {
    if (!this.transactionRepositories.has(contextId)) {
      return;
    }
    
    const transactionRepository = this.transactionRepositories.get(contextId)!;
    for (const [id, repository] of transactionRepository.entries()) {
      this.repositories.set(id, repository);
    }
    
    this.transactionRepositories.delete(contextId);
  }

  // トランザクションをロールバック
  rollbackTransaction(contextId: string): void {
    this.transactionRepositories.delete(contextId);
  }
}

describe("リポジトリのトランザクション対応メソッドのテスト", () => {
  let contentRepository: MockContentRepositoryWithTransaction;
  let repositoryRepository: MockRepositoryRepositoryWithTransaction;
  let context: TransactionContext;
  
  beforeEach(() => {
    contentRepository = new MockContentRepositoryWithTransaction();
    repositoryRepository = new MockRepositoryRepositoryWithTransaction();
    context = createMockTransactionContext();
  });
  
  it("コンテンツをトランザクション内で保存できること", async () => {
    // テストデータを準備
    const contentAggregate = createContentAggregate(createTestContent());
    
    // トランザクション内で保存
    const saveResult = await contentRepository.saveWithTransaction(contentAggregate, context);
    
    // 結果を検証
    expect(saveResult.isOk()).toBe(true);
    
    // コミット前はメインのコンテンツに反映されていないことを確認
    const beforeCommit = await contentRepository.findById(contentAggregate.content.id);
    expect(beforeCommit).toBeNull();
    
    // コミット
    contentRepository.commitTransaction(context.id);
    
    // コミット後はメインのコンテンツに反映されていることを確認
    const afterCommit = await contentRepository.findById(contentAggregate.content.id);
    expect(afterCommit).not.toBeNull();
    expect(afterCommit?.content.id).toBe(contentAggregate.content.id);
  });
  
  it("リポジトリをトランザクション内で保存できること", async () => {
    // テストデータを準備
    const repositoryAggregate = createRepositoryAggregate(createTestRepository());
    
    // トランザクション内で保存
    const saveResult = await repositoryRepository.saveWithTransaction(repositoryAggregate, context);
    
    // 結果を検証
    expect(saveResult.isOk()).toBe(true);
    
    // コミット前はメインのリポジトリに反映されていないことを確認
    const beforeCommit = await repositoryRepository.findById(repositoryAggregate.repository.id);
    expect(beforeCommit).toBeNull();
    
    // コミット
    repositoryRepository.commitTransaction(context.id);
    
    // コミット後はメインのリポジトリに反映されていることを確認
    const afterCommit = await repositoryRepository.findById(repositoryAggregate.repository.id);
    expect(afterCommit).not.toBeNull();
    expect(afterCommit?.repository.id).toBe(repositoryAggregate.repository.id);
  });
  
  it("コンテンツの保存に失敗した場合にエラーを返すこと", async () => {
    // 保存に失敗するリポジトリを作成
    const failingContentRepository = new MockContentRepositoryWithTransaction({ shouldFailOnSave: true });
    
    // テストデータを準備
    const contentAggregate = createContentAggregate(createTestContent());
    
    // トランザクション内で保存
    const saveResult = await failingContentRepository.saveWithTransaction(contentAggregate, context);
    
    // 結果を検証
    expect(saveResult.isErr()).toBe(true);
    if (saveResult.isErr()) {
      expect(saveResult.error.message).toContain("コンテンツの保存に失敗しました");
    }
  });
  
  it("リポジトリの保存に失敗した場合にエラーを返すこと", async () => {
    // 保存に失敗するリポジトリを作成
    const failingRepositoryRepository = new MockRepositoryRepositoryWithTransaction({ shouldFailOnSave: true });
    
    // テストデータを準備
    const repositoryAggregate = createRepositoryAggregate(createTestRepository());
    
    // トランザクション内で保存
    const saveResult = await failingRepositoryRepository.saveWithTransaction(repositoryAggregate, context);
    
    // 結果を検証
    expect(saveResult.isErr()).toBe(true);
    if (saveResult.isErr()) {
      expect(saveResult.error.message).toContain("リポジトリの保存に失敗しました");
    }
  });
  
  it("トランザクションをロールバックするとコミットされないこと", async () => {
    // テストデータを準備
    const contentAggregate = createContentAggregate(createTestContent());
    const repositoryAggregate = createRepositoryAggregate(createTestRepository());
    
    // トランザクション内で保存
    await contentRepository.saveWithTransaction(contentAggregate, context);
    await repositoryRepository.saveWithTransaction(repositoryAggregate, context);
    
    // ロールバック
    contentRepository.rollbackTransaction(context.id);
    repositoryRepository.rollbackTransaction(context.id);
    
    // ロールバック後はメインのデータに反映されていないことを確認
    const contentAfterRollback = await contentRepository.findById(contentAggregate.content.id);
    const repositoryAfterRollback = await repositoryRepository.findById(repositoryAggregate.repository.id);
    
    expect(contentAfterRollback).toBeNull();
    expect(repositoryAfterRollback).toBeNull();
  });
  
  it("複数のリポジトリ操作を一つのトランザクションで実行できること", async () => {
    // テストデータを準備
    const contentAggregate = createContentAggregate(createTestContent());
    const repositoryAggregate = createRepositoryAggregate(createTestRepository());
    
    // トランザクション内で保存
    const contentResult = await contentRepository.saveWithTransaction(contentAggregate, context);
    const repositoryResult = await repositoryRepository.saveWithTransaction(repositoryAggregate, context);
    
    // 結果を検証
    expect(contentResult.isOk()).toBe(true);
    expect(repositoryResult.isOk()).toBe(true);
    
    // コミット
    contentRepository.commitTransaction(context.id);
    repositoryRepository.commitTransaction(context.id);
    
    // コミット後はメインのデータに反映されていることを確認
    const contentAfterCommit = await contentRepository.findById(contentAggregate.content.id);
    const repositoryAfterCommit = await repositoryRepository.findById(repositoryAggregate.repository.id);
    
    expect(contentAfterCommit).not.toBeNull();
    expect(repositoryAfterCommit).not.toBeNull();
  });
}); 