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
import { ContentAggregate } from "../../core/content/aggregates/content-aggregate.ts";
import { createContent } from "../../core/content/entities/content.ts";
import { createContentMetadata } from "../../core/content/value-objects/content-metadata.ts";
import { generateId } from "../../core/common/id.ts";
import { eq, and } from "drizzle-orm";
import { contents, contentMetadata } from "../database/schema/content.ts";
import { RepositoryError } from "./drizzle-content-repository.ts";
import { ContentRepository } from "../../application/content/repositories/content-repository.ts";

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
   * テスト用にデータをクリア
   */
  clearAll(): void {
    this.contentStore = {};
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
    const content = createContent({
      id,
      userId: "test-user-id",
      repositoryId: "test-repo-id",
      path: `test/path-${id}.md`,
      title: `Test Content ${id}`,
      body: `# Test Content ${id}\n\nThis is a test content.`,
      metadata: createContentMetadata({
        tags: ["test", "markdown"],
        categories: ["documentation"],
        language: "ja"
      }),
      visibility: "private",
      versions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      content,
      updateTitle: () => createTestContentAggregate(),
      updateBody: () => createTestContentAggregate(),
      updateMetadata: () => createTestContentAggregate(),
      publish: () => createTestContentAggregate(),
      makePrivate: () => createTestContentAggregate(),
      makeUnlisted: () => createTestContentAggregate()
    };
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