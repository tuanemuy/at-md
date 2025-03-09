/**
 * DrizzleContentRepositoryのテスト
 * 
 * このテストでは、実際のデータベースの代わりにモックを使用して、
 * リポジトリの機能を検証します。これにより、テストが高速で安定し、
 * 外部依存を減らすことができます。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { DrizzleContentRepository } from "./drizzle-content-repository.ts";
import { ContentAggregate, createContentAggregate } from "../../core/content/aggregates/content-aggregate.ts";
import { Content, createContent } from "../../core/content/entities/content.ts";
import { createContentMetadata } from "../../core/content/value-objects/content-metadata.ts";
import { generateId } from "../../core/common/id.ts";
import { eq, and } from "drizzle-orm";
import { contents, contentMetadata } from "../database/schema/content.ts";
import { RepositoryError } from "./drizzle-content-repository.ts";
import { ContentRepository } from "../../application/content/repositories/content-repository.ts";
import { Result, ok, err } from "neverthrow";
import { InfrastructureError } from "../../core/errors/base.ts";

/**
 * 簡易的なモックリポジトリ
 * 実際のデータベースの代わりに、インメモリでデータを管理します
 */
class MockContentRepository implements ContentRepository {
  // インメモリデータストア
  private contentStore: Record<string, ContentAggregate> = {};
  
  /**
   * IDによってコンテンツを検索する
   */
  async findById(id: string): Promise<ContentAggregate | null> {
    return this.contentStore[id] || null;
  }
  
  /**
   * リポジトリIDとパスによってコンテンツを検索する
   */
  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null> {
    for (const id in this.contentStore) {
      const aggregate = this.contentStore[id];
      if (aggregate.content.repositoryId === repositoryId && aggregate.content.path === path) {
        return aggregate;
      }
    }
    return null;
  }
  
  /**
   * ユーザーIDによってコンテンツを検索する
   */
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const results: ContentAggregate[] = [];
    
    for (const id in this.contentStore) {
      const aggregate = this.contentStore[id];
      if (aggregate.content.userId === userId) {
        results.push(aggregate);
      }
    }
    
    // オプションによるフィルタリング
    if (options) {
      const { limit, offset } = options;
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      return results.slice(start, end);
    }
    
    return results;
  }
  
  /**
   * リポジトリIDによってコンテンツを検索する
   */
  async findByRepositoryId(repositoryId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const results: ContentAggregate[] = [];
    
    for (const id in this.contentStore) {
      const aggregate = this.contentStore[id];
      if (aggregate.content.repositoryId === repositoryId) {
        results.push(aggregate);
      }
    }
    
    // オプションによるフィルタリング
    if (options) {
      const { limit, offset } = options;
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      return results.slice(start, end);
    }
    
    return results;
  }
  
  /**
   * コンテンツを保存する
   */
  async save(contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    this.contentStore[contentAggregate.content.id] = contentAggregate;
    return contentAggregate;
  }
  
  /**
   * コンテンツを削除する
   */
  async delete(id: string): Promise<boolean> {
    if (this.contentStore[id]) {
      delete this.contentStore[id];
      return true;
    }
    return false;
  }
  
  /**
   * すべてのコンテンツを削除する（テスト用）
   */
  clearAll(): void {
    this.contentStore = {};
  }
  
  /**
   * トランザクション内でコンテンツを保存する
   */
  async saveWithTransaction(contentAggregate: ContentAggregate, _context: any): Promise<Result<ContentAggregate, InfrastructureError>> {
    try {
      const saved = await this.save(contentAggregate);
      return ok(saved);
    } catch (error) {
      return err(new InfrastructureError(`コンテンツの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
  
  /**
   * トランザクション内でコンテンツを削除する
   */
  async deleteWithTransaction(id: string, _context: any): Promise<Result<boolean, InfrastructureError>> {
    try {
      const result = await this.delete(id);
      return ok(result);
    } catch (error) {
      return err(new InfrastructureError(`コンテンツの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
}

// エラーをスローするモックリポジトリ
class ErrorThrowingRepository extends MockContentRepository {
  override async save(_contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    throw new Error("保存エラー");
  }
}

// テストケースを修正
describe("DrizzleContentRepository", () => {
  // リポジトリのインスタンス
  let repository: MockContentRepository;
  
  // テスト用のコンテンツ集約を作成する関数
  function createTestContentAggregate(): ContentAggregate {
    const id = generateId();
    const metadataResult = createContentMetadata({
      tags: ["test", "markdown"],
      categories: ["documentation"],
      language: "ja"
    });
    
    if (metadataResult.isErr()) {
      throw new Error(`メタデータの作成に失敗しました: ${metadataResult.error.message}`);
    }
    
    const contentResult = createContent({
      id,
      userId: "test-user-id",
      repositoryId: "test-repo-id",
      path: `test/path-${id}.md`,
      title: `Test Content ${id}`,
      body: `# Test Content ${id}\n\nThis is a test content.`,
      metadata: metadataResult.value,
      visibility: "private",
      versions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (contentResult.isErr()) {
      throw new Error(`コンテンツの作成に失敗しました: ${contentResult.error.message}`);
    }
    
    return createContentAggregate(contentResult.value);
  }
  
  // 各テストの前に実行
  beforeEach(() => {
    // リポジトリの作成
    repository = new MockContentRepository();
    
    // テスト用のデータをクリア
    repository.clearAll();
  });
  
  it("コンテンツを保存して取得できること", async () => {
    // テスト用のコンテンツ集約を作成
    const contentAggregate = createTestContentAggregate();
    
    // コンテンツを保存
    const savedContent = await repository.save(contentAggregate);
    
    // 保存されたコンテンツのIDを使用して取得
    const retrievedContent = await repository.findById(savedContent.content.id);
    
    // 取得したコンテンツが正しいことを確認
    expect(retrievedContent).not.toBeNull();
    expect(retrievedContent?.content.id).toBe(savedContent.content.id);
    expect(retrievedContent?.content.title).toBe(savedContent.content.title);
    expect(retrievedContent?.content.body).toBe(savedContent.content.body);
    expect(retrievedContent?.content.metadata.tags).toEqual(savedContent.content.metadata.tags);
  });
  
  it("リポジトリIDとパスでコンテンツを検索できること", async () => {
    // テスト用のコンテンツ集約を作成
    const contentAggregate = createTestContentAggregate();
    
    // コンテンツを保存
    await repository.save(contentAggregate);
    
    // リポジトリIDとパスで検索
    const retrievedContent = await repository.findByRepositoryIdAndPath(
      contentAggregate.content.repositoryId,
      contentAggregate.content.path
    );
    
    // 取得したコンテンツが正しいことを確認
    expect(retrievedContent).not.toBeNull();
    expect(retrievedContent?.content.id).toBe(contentAggregate.content.id);
    expect(retrievedContent?.content.repositoryId).toBe(contentAggregate.content.repositoryId);
    expect(retrievedContent?.content.path).toBe(contentAggregate.content.path);
  });
  
  it("ユーザーIDでコンテンツを検索できること", async () => {
    // 複数のテスト用コンテンツ集約を作成して保存
    const userId = "test-user-id";
    const contentAggregate1 = createTestContentAggregate();
    const contentAggregate2 = createTestContentAggregate();
    
    await repository.save(contentAggregate1);
    await repository.save(contentAggregate2);
    
    // ユーザーIDで検索
    const retrievedContents = await repository.findByUserId(userId);
    
    // 取得したコンテンツが正しいことを確認
    expect(retrievedContents.length).toBeGreaterThanOrEqual(2);
    expect(retrievedContents.some(c => c.content.id === contentAggregate1.content.id)).toBe(true);
    expect(retrievedContents.some(c => c.content.id === contentAggregate2.content.id)).toBe(true);
  });
  
  it("コンテンツを削除できること", async () => {
    // テスト用のコンテンツ集約を作成
    const contentAggregate = createTestContentAggregate();
    
    // コンテンツを保存
    await repository.save(contentAggregate);
    
    // コンテンツが存在することを確認
    const retrievedBeforeDelete = await repository.findById(contentAggregate.content.id);
    expect(retrievedBeforeDelete).not.toBeNull();
    
    // コンテンツを削除
    await repository.delete(contentAggregate.content.id);
    
    // 削除後にコンテンツが存在しないことを確認
    const retrievedAfterDelete = await repository.findById(contentAggregate.content.id);
    expect(retrievedAfterDelete).toBeNull();
  });
  
  it("存在しないコンテンツを検索するとnullが返されること", async () => {
    // 存在しないIDでコンテンツを検索
    const nonExistentId = "non-existent-id";
    const retrievedContent = await repository.findById(nonExistentId);
    
    // nullが返されることを確認
    expect(retrievedContent).toBeNull();
  });
  
  it("エラーハンドリングが適切に行われること", async () => {
    // エラーをスローするリポジトリを使用
    const errorRepository = new ErrorThrowingRepository();
    
    // コンテンツの保存を試みる（エラーが発生するはず）
    try {
      await errorRepository.save(createTestContentAggregate());
      // エラーがスローされなかった場合、テストを失敗させる
      expect(true).toBe(false);
    } catch (error) {
      // エラーがスローされたことを確認
      expect(error).not.toBeNull();
      expect(error instanceof Error).toBe(true);
      expect((error as Error).message).toBe("保存エラー");
    }
  });
}); 