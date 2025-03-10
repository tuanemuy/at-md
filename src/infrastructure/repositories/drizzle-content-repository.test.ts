/**
 * DrizzleContentRepositoryのテスト
 * 
 * このテストでは、実際のデータベースの代わりにモックを使用して、
 * リポジトリの機能を検証します。これにより、テストが高速で安定し、
 * 外部依存を減らすことができます。
 */

import { assertEquals, assertExists } from "https://deno.land/std/assert/mod.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std/testing/bdd.ts";
import { eq } from "npm:drizzle-orm";

import {
  Result,
  ok,
  err,
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  generateId,
  type ContentAggregate,
  type Content,
  type ContentMetadata,
  createContentAggregate,
  type ContentRepository,
  contents,
  db,
  TransactionContext
} from "./__tests__/deps.ts";

import { DrizzleContentRepository } from "./drizzle-content-repository.ts";

/**
 * 簡易的なモックリポジトリ
 * 実際のデータベースの代わりに、インメモリでデータを管理します
 */
class MockContentRepository implements ContentRepository {
  // インメモリデータストア
  private contentStore: Record<string, ContentAggregate> = {};
  
  /**
   * IDによるコンテンツ集約の検索
   * @param id コンテンツID
   * @returns コンテンツ集約、または見つからない場合はnull
   */
  findById(id: string): Promise<ContentAggregate | null> {
    return Promise.resolve(this.contentStore[id] || null);
  }
  
  /**
   * リポジトリIDとパスによるコンテンツ集約の検索
   * @param repositoryId リポジトリID
   * @param path パス
   * @returns コンテンツ集約、または見つからない場合はnull
   */
  findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null> {
    const contents = Object.values(this.contentStore);
    const content = contents.find(c => 
      c.content.repositoryId === repositoryId && 
      c.content.path === path
    );
    return Promise.resolve(content || null);
  }
  
  /**
   * リポジトリIDによるコンテンツ集約の検索
   * @param repositoryId リポジトリID
   * @returns コンテンツ集約の配列
   */
  findByRepositoryId(repositoryId: string): Promise<ContentAggregate[]> {
    const contents = Object.values(this.contentStore);
    return Promise.resolve(contents.filter(c => c.content.repositoryId === repositoryId));
  }
  
  /**
   * ユーザーIDによるコンテンツ集約の検索
   * @param userId ユーザーID
   * @returns コンテンツ集約の配列
   */
  findByUserId(userId: string): Promise<ContentAggregate[]> {
    const contents = Object.values(this.contentStore);
    return Promise.resolve(contents.filter(c => c.content.userId === userId));
  }
  
  /**
   * コンテンツ集約の保存
   * @param contentAggregate 保存するコンテンツ集約
   * @returns 保存されたコンテンツ集約
   */
  save(contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    this.contentStore[contentAggregate.content.id] = contentAggregate;
    return Promise.resolve(contentAggregate);
  }
  
  /**
   * コンテンツの削除
   * @param id 削除するコンテンツのID
   * @returns 削除が成功したかどうか
   */
  delete(id: string): Promise<boolean> {
    if (this.contentStore[id]) {
      delete this.contentStore[id];
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
  
  /**
   * すべてのコンテンツを削除する（テスト用）
   */
  clearAll(): void {
    this.contentStore = {};
  }
  
  /**
   * トランザクション内でコンテンツ集約を保存する
   * @param contentAggregate 保存するコンテンツ集約
   * @param _context トランザクションコンテキスト
   * @returns 保存されたコンテンツ集約のResult
   */
  async saveWithTransaction(
    contentAggregate: ContentAggregate, 
    _context: unknown
  ): Promise<Result<ContentAggregate, DomainError>> {
    try {
      const saved = await this.save(contentAggregate);
      return ok(saved);
    } catch (error) {
      return err(new DomainError(`コンテンツの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
  
  /**
   * トランザクション内でコンテンツを削除する
   * @param id 削除するコンテンツのID
   * @param _context トランザクションコンテキスト
   * @returns 削除結果のResult
   */
  async deleteWithTransaction(
    id: string, 
    _context: unknown
  ): Promise<Result<boolean, DomainError>> {
    try {
      const result = await this.delete(id);
      return ok(result);
    } catch (error) {
      return err(new DomainError(`コンテンツの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
}

// エラーをスローするモックリポジトリ
class ErrorThrowingRepository extends MockContentRepository {
  override save(_contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    return Promise.reject(new Error("保存エラー"));
  }
}

describe("DrizzleContentRepository", () => {
  let repository: ContentRepository;
  let testContentId: string;
  
  beforeEach(async () => {
    // テスト用リポジトリの作成
    repository = new DrizzleContentRepository(db);
    
    // テストデータのクリーンアップ
    await db.delete(contents).execute();
    
    // テスト用コンテンツIDの生成
    testContentId = generateId();
  });
  
  describe("findById", () => {
    it("存在するコンテンツを取得できる", async () => {
      // テスト用コンテンツの作成
      const contentAggregate = createContentAggregate({
        id: testContentId,
        userId: "test-user-id",
        title: "テストコンテンツ",
        body: "これはテストコンテンツです。",
        metadata: {
          keywords: ["test", "content"],
          description: "テスト用のコンテンツ説明"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // コンテンツの保存
      await repository.save(contentAggregate);
      
      // コンテンツの取得
      const result = await repository.findById(testContentId);
      
      // 検証
      assertEquals(result?.content.id, testContentId);
      assertEquals(result?.content.title, "テストコンテンツ");
      assertEquals(result?.content.body, "これはテストコンテンツです。");
    });
    
    it("存在しないコンテンツIDの場合はnullを返す", async () => {
      const result = await repository.findById("non-existent-id");
      assertEquals(result, null);
    });
  });
  
  describe("save", () => {
    it("新しいコンテンツを保存できる", async () => {
      // テスト用コンテンツの作成
      const contentAggregate = createContentAggregate({
        id: testContentId,
        userId: "test-user-id",
        title: "新しいコンテンツ",
        body: "これは新しいコンテンツです。",
        metadata: {
          keywords: ["new", "content"],
          description: "新しいコンテンツの説明"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // コンテンツの保存
      const savedContent = await repository.save(contentAggregate);
      
      // 検証
      assertEquals(savedContent.content.id, testContentId);
      assertEquals(savedContent.content.title, "新しいコンテンツ");
      assertEquals(savedContent.content.body, "これは新しいコンテンツです。");
      
      // データベースから直接取得して検証
      const [dbContent] = await db.select().from(contents).where(eq(contents.id, testContentId)).execute();
      assertEquals(dbContent.id, testContentId);
      assertEquals(dbContent.title, "新しいコンテンツ");
      assertEquals(dbContent.body, "これは新しいコンテンツです。");
    });
    
    it("既存のコンテンツを更新できる", async () => {
      // テスト用コンテンツの作成と保存
      const contentAggregate = createContentAggregate({
        id: testContentId,
        userId: "test-user-id",
        title: "更新前コンテンツ",
        body: "これは更新前のコンテンツです。",
        metadata: {
          keywords: ["before", "update"],
          description: "更新前のコンテンツ説明"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await repository.save(contentAggregate);
      
      // コンテンツ情報の更新
      const updatedContentAggregate = contentAggregate.updateTitle("更新後コンテンツ");
      const updatedContentAggregate2 = updatedContentAggregate.updateBody("これは更新後のコンテンツです。");
      
      const savedContent = await repository.save(updatedContentAggregate2);
      
      // 検証
      assertEquals(savedContent.content.id, testContentId);
      assertEquals(savedContent.content.title, "更新後コンテンツ");
      assertEquals(savedContent.content.body, "これは更新後のコンテンツです。");
      
      // データベースから直接取得して検証
      const [dbContent] = await db.select().from(contents).where(eq(contents.id, testContentId)).execute();
      assertEquals(dbContent.id, testContentId);
      assertEquals(dbContent.title, "更新後コンテンツ");
      assertEquals(dbContent.body, "これは更新後のコンテンツです。");
    });
  });
});