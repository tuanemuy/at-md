/**
 * ユニットオブワークのユニットテスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { UnitOfWork, TransactionContext } from "../../src/infrastructure/database/unit-of-work.ts";
import { createMockContentRepository, createMockRepositoryRepository, createMockTransactionContext } from "../helpers/mock-helpers.ts";
import { createTestContent, createTestRepository } from "../helpers/test-data-factory.ts";
import { createContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";
import { createRepositoryAggregate } from "../../src/core/content/aggregates/repository-aggregate.ts";
import { Result, ok, err } from "../../src/deps.ts";
import { InfrastructureError } from "../../src/core/errors/base.ts";

// モック用のUnitOfWork実装
class MockUnitOfWork implements UnitOfWork {
  private activeTransactions = new Map<string, TransactionContext>();
  private shouldFailOnBegin = false;
  private shouldFailOnCommit = false;
  private shouldFailOnRollback = false;

  constructor(options?: {
    shouldFailOnBegin?: boolean;
    shouldFailOnCommit?: boolean;
    shouldFailOnRollback?: boolean;
  }) {
    this.shouldFailOnBegin = options?.shouldFailOnBegin || false;
    this.shouldFailOnCommit = options?.shouldFailOnCommit || false;
    this.shouldFailOnRollback = options?.shouldFailOnRollback || false;
  }

  async begin(): Promise<Result<TransactionContext, InfrastructureError>> {
    if (this.shouldFailOnBegin) {
      return err(new InfrastructureError("トランザクションの開始に失敗しました"));
    }

    const context = createMockTransactionContext();
    this.activeTransactions.set(context.id, context);
    return ok(context);
  }

  async commit(context: TransactionContext): Promise<Result<void, InfrastructureError>> {
    if (this.shouldFailOnCommit) {
      return err(new InfrastructureError("トランザクションのコミットに失敗しました"));
    }

    if (!this.activeTransactions.has(context.id)) {
      return err(new InfrastructureError(`トランザクションが見つかりません: ${context.id}`));
    }

    this.activeTransactions.delete(context.id);
    return ok(undefined);
  }

  async rollback(context: TransactionContext): Promise<Result<void, InfrastructureError>> {
    if (this.shouldFailOnRollback) {
      return err(new InfrastructureError("トランザクションのロールバックに失敗しました"));
    }

    if (!this.activeTransactions.has(context.id)) {
      return err(new InfrastructureError(`トランザクションが見つかりません: ${context.id}`));
    }

    this.activeTransactions.delete(context.id);
    return ok(undefined);
  }

  async executeInTransaction<T>(
    work: (context: TransactionContext) => Promise<Result<T, InfrastructureError>>
  ): Promise<Result<T, InfrastructureError>> {
    const beginResult = await this.begin();
    if (beginResult.isErr()) {
      return err(beginResult.error);
    }

    const context = beginResult.value;
    
    try {
      const result = await work(context);
      
      if (result.isErr()) {
        await this.rollback(context);
        return result;
      }
      
      const commitResult = await this.commit(context);
      if (commitResult.isErr()) {
        return err(commitResult.error);
      }
      
      return result;
    } catch (error) {
      await this.rollback(context);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new InfrastructureError(`トランザクション処理中にエラーが発生しました: ${errorMessage}`));
    }
  }
}

describe("ユニットオブワークのユニットテスト", () => {
  let unitOfWork: MockUnitOfWork;
  let contentRepository: ReturnType<typeof createMockContentRepository>;
  let repositoryRepository: ReturnType<typeof createMockRepositoryRepository>;
  
  beforeEach(() => {
    unitOfWork = new MockUnitOfWork();
    contentRepository = createMockContentRepository();
    repositoryRepository = createMockRepositoryRepository();
  });
  
  it("トランザクション内で複数のリポジトリ操作を実行できること", async () => {
    // テストデータを準備
    const contentAggregate = createContentAggregate(createTestContent());
    const repositoryAggregate = createRepositoryAggregate(createTestRepository());
    
    // トランザクション内で処理を実行
    const result = await unitOfWork.executeInTransaction<any>(async (context) => {
      // リポジトリを保存
      const repoResult = await repositoryRepository.saveWithTransaction(repositoryAggregate, context);
      if (repoResult.isErr()) {
        return repoResult as Result<any, InfrastructureError>;
      }
      
      // コンテンツを保存
      const contentResult = await contentRepository.saveWithTransaction(contentAggregate, context);
      if (contentResult.isErr()) {
        return contentResult as Result<any, InfrastructureError>;
      }
      
      return ok({ content: contentAggregate, repository: repositoryAggregate });
    });
    
    // 結果を検証
    expect(result.isOk()).toBe(true);
  });
  
  it("トランザクション内でエラーが発生した場合にロールバックされること", async () => {
    // テストデータを準備
    const repositoryAggregate = createRepositoryAggregate(createTestRepository());
    
    // エラーを発生させるモックを作成
    const errorContentRepository = createMockContentRepository({
      saveWithTransaction: async () => {
        return err(new InfrastructureError("コンテンツの保存に失敗しました"));
      }
    });
    
    // トランザクション内で処理を実行
    const result = await unitOfWork.executeInTransaction<any>(async (context) => {
      // リポジトリを保存
      const repoResult = await repositoryRepository.saveWithTransaction(repositoryAggregate, context);
      if (repoResult.isErr()) {
        return repoResult as Result<any, InfrastructureError>;
      }
      
      // コンテンツの保存でエラーを発生させる
      const contentResult = await errorContentRepository.saveWithTransaction(
        createContentAggregate(createTestContent()),
        context
      );
      
      if (contentResult.isErr()) {
        return contentResult as Result<any, InfrastructureError>;
      }
      
      return contentResult;
    });
    
    // 結果を検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("コンテンツの保存に失敗しました");
    }
  });
  
  it("例外が発生した場合にロールバックされること", async () => {
    // トランザクション内で処理を実行（例外を発生させる）
    const result = await unitOfWork.executeInTransaction<any>(async () => {
      // 意図的に例外を発生させる
      throw new Error("テスト用のエラー");
    });
    
    // 結果を検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("テスト用のエラー");
    }
  });
  
  it("トランザクションの開始に失敗した場合にエラーを返すこと", async () => {
    // トランザクション開始に失敗するUnitOfWorkを作成
    const failingUnitOfWork = new MockUnitOfWork({ shouldFailOnBegin: true });
    
    // トランザクション内で処理を実行
    const result = await failingUnitOfWork.executeInTransaction<any>(async () => {
      return ok("成功");
    });
    
    // 結果を検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("トランザクションの開始に失敗しました");
    }
  });
  
  it("コミットに失敗した場合にエラーを返すこと", async () => {
    // コミットに失敗するUnitOfWorkを作成
    const failingUnitOfWork = new MockUnitOfWork({ shouldFailOnCommit: true });
    
    // トランザクション内で処理を実行
    const result = await failingUnitOfWork.executeInTransaction<any>(async () => {
      return ok("成功");
    });
    
    // 結果を検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("トランザクションのコミットに失敗しました");
    }
  });
  
  it("明示的なトランザクション管理ができること", async () => {
    // トランザクションを開始
    const beginResult = await unitOfWork.begin();
    expect(beginResult.isOk()).toBe(true);
    
    if (beginResult.isOk()) {
      const context = beginResult.value;
      
      // コンテンツを保存
      const contentAggregate = createContentAggregate(createTestContent());
      const saveResult = await contentRepository.saveWithTransaction(contentAggregate, context);
      expect(saveResult.isOk()).toBe(true);
      
      // トランザクションをコミット
      const commitResult = await unitOfWork.commit(context);
      expect(commitResult.isOk()).toBe(true);
    }
  });
}); 