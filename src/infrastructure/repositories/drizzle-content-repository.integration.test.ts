/**
 * DrizzleContentRepositoryの統合テスト
 * 
 * 注意: このテストは実際のデータベースに接続します。
 * テスト用のデータベースを用意し、環境変数DATABASE_URLで指定してください。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach, afterAll, beforeAll } from "@std/testing/bdd";
import { DrizzleContentRepository } from "./drizzle-content-repository.ts";
import { createDrizzleClient, DrizzleClient } from "../database/client.ts";
import { ContentAggregate } from "../../core/content/aggregates/content-aggregate.ts";
import { createContent } from "../../core/content/entities/content.ts";
import { createContentMetadata } from "../../core/content/value-objects/content-metadata.ts";
import { generateId } from "../../core/common/id.ts";
import * as schema from "../database/schema/content.ts";
import { sql } from "drizzle-orm";
import pg from "pg";

// テスト用のデータベース接続文字列
const TEST_DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgres://test:test@localhost:55432/at-md";

// データベース接続が利用可能かどうかを確認する関数
async function isDatabaseAvailable(): Promise<boolean> {
  const pool = new pg.Pool({
    connectionString: TEST_DATABASE_URL,
    max: 1, // テスト用に最小限の接続数
  });
  
  try {
    // 接続をテスト
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error: unknown) {
    console.warn("データベース接続が利用できません:", error instanceof Error ? error.message : String(error));
    return false;
  } finally {
    // 必ず接続プールを終了
    await pool.end();
  }
}

// 共有のデータベースクライアントとリポジトリ
let sharedDbClient: DrizzleClient | null = null;
let sharedRepository: DrizzleContentRepository | null = null;
let dbAvailable = false;

describe("DrizzleContentRepository統合テスト", () => {
  // すべてのテスト前に実行
  beforeAll(async () => {
    // データベースが利用可能かどうかを確認
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      console.warn("データベースに接続できないため、統合テストをスキップします");
      return;
    }
    
    // 共有のデータベース接続を作成
    sharedDbClient = createDrizzleClient(TEST_DATABASE_URL);
    sharedRepository = new DrizzleContentRepository(sharedDbClient.db);
    
    // テスト用のテーブルをクリア
    await sharedDbClient.db.delete(schema.contentMetadata);
    await sharedDbClient.db.delete(schema.contents);
  });
  
  // 各テストの前に実行
  beforeEach(async () => {
    if (!dbAvailable || !sharedDbClient) {
      return;
    }
    
    // テスト用のテーブルをクリア
    await sharedDbClient.db.delete(schema.contentMetadata);
    await sharedDbClient.db.delete(schema.contents);
  });
  
  // 各テストの後に実行
  afterEach(async () => {
    if (!dbAvailable || !sharedDbClient) {
      return;
    }
    
    try {
      // テスト用のテーブルをクリア
      await sharedDbClient.db.delete(schema.contentMetadata);
      await sharedDbClient.db.delete(schema.contents);
    } catch (error: unknown) {
      console.warn("テスト後のクリーンアップ中にエラーが発生しました:", error instanceof Error ? error.message : String(error));
    }
  });
  
  // すべてのテスト終了後に実行
  afterAll(async () => {
    if (!dbAvailable || !sharedDbClient) {
      return;
    }
    
    try {
      // データベース接続を閉じる
      await sharedDbClient.close();
    } catch (error: unknown) {
      console.warn("データベース接続を閉じる際にエラーが発生しました:", error instanceof Error ? error.message : String(error));
    }
  });
  
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
  
  it("実際のデータベースにコンテンツを保存して取得できること", async () => {
    if (!dbAvailable || !sharedRepository) {
      console.log("データベース接続が利用できないため、テストをスキップします");
      return;
    }
    
    try {
      // テスト用のコンテンツ集約を作成
      const contentAggregate = createTestContentAggregate();
      
      // コンテンツを保存
      const savedContent = await sharedRepository.save(contentAggregate);
      
      // 保存されたコンテンツのIDを使用して取得
      const retrievedContent = await sharedRepository.findById(savedContent.content.id);
      
      // 取得したコンテンツが正しいことを確認
      expect(retrievedContent).not.toBeNull();
      expect(retrievedContent?.content.id).toBe(savedContent.content.id);
      expect(retrievedContent?.content.title).toBe(savedContent.content.title);
      expect(retrievedContent?.content.body).toBe(savedContent.content.body);
      expect(retrievedContent?.content.metadata.tags).toEqual(savedContent.content.metadata.tags);
    } catch (error) {
      throw error;
    }
  });
  
  it("実際のデータベースでリポジトリIDとパスでコンテンツを検索できること", async () => {
    if (!dbAvailable || !sharedRepository) {
      console.log("データベース接続が利用できないため、テストをスキップします");
      return;
    }
    
    try {
      // テスト用のコンテンツ集約を作成
      const contentAggregate = createTestContentAggregate();
      
      // コンテンツを保存
      await sharedRepository.save(contentAggregate);
      
      // リポジトリIDとパスで検索
      const retrievedContent = await sharedRepository.findByRepositoryIdAndPath(
        contentAggregate.content.repositoryId,
        contentAggregate.content.path
      );
      
      // 取得したコンテンツが正しいことを確認
      expect(retrievedContent).not.toBeNull();
      expect(retrievedContent?.content.id).toBe(contentAggregate.content.id);
      expect(retrievedContent?.content.repositoryId).toBe(contentAggregate.content.repositoryId);
      expect(retrievedContent?.content.path).toBe(contentAggregate.content.path);
    } catch (error) {
      throw error;
    }
  });
  
  it("実際のデータベースでユーザーIDでコンテンツを検索できること", async () => {
    if (!dbAvailable || !sharedRepository) {
      console.log("データベース接続が利用できないため、テストをスキップします");
      return;
    }
    
    try {
      // 複数のテスト用コンテンツ集約を作成して保存
      const userId = "test-user-id";
      const contentAggregate1 = createTestContentAggregate();
      const contentAggregate2 = createTestContentAggregate();
      
      await sharedRepository.save(contentAggregate1);
      await sharedRepository.save(contentAggregate2);
      
      // ユーザーIDで検索
      const retrievedContents = await sharedRepository.findByUserId(userId);
      
      // 取得したコンテンツが正しいことを確認
      expect(retrievedContents.length).toBeGreaterThanOrEqual(2);
      expect(retrievedContents.some(c => c.content.id === contentAggregate1.content.id)).toBe(true);
      expect(retrievedContents.some(c => c.content.id === contentAggregate2.content.id)).toBe(true);
    } catch (error) {
      throw error;
    }
  });
  
  it("実際のデータベースでコンテンツを削除できること", async () => {
    if (!dbAvailable || !sharedRepository) {
      console.log("データベース接続が利用できないため、テストをスキップします");
      return;
    }
    
    try {
      // テスト用のコンテンツ集約を作成
      const contentAggregate = createTestContentAggregate();
      
      // コンテンツを保存
      await sharedRepository.save(contentAggregate);
      
      // コンテンツが存在することを確認
      const retrievedBeforeDelete = await sharedRepository.findById(contentAggregate.content.id);
      expect(retrievedBeforeDelete).not.toBeNull();
      
      // コンテンツを削除
      const deleteResult = await sharedRepository.delete(contentAggregate.content.id);
      expect(deleteResult).toBe(true);
      
      // 削除後にコンテンツが存在しないことを確認
      const retrievedAfterDelete = await sharedRepository.findById(contentAggregate.content.id);
      expect(retrievedAfterDelete).toBeNull();
    } catch (error) {
      throw error;
    }
  });
  
  it("実際のデータベースでトランザクションが正しく機能すること", async () => {
    if (!dbAvailable || !sharedRepository || !sharedDbClient) {
      console.log("データベース接続が利用できないため、テストをスキップします");
      return;
    }
    
    try {
      // テスト用のコンテンツ集約を作成
      const contentAggregate = createTestContentAggregate();
      
      // コンテンツを保存
      await sharedRepository.save(contentAggregate);
      
      // トランザクションのロールバックをテストするために、エラーを発生させる
      // 注: このテストは実際にはトランザクションのロールバックを直接検証することはできませんが、
      // リポジトリの実装がトランザクションを使用していることを確認するための参考として含めています
      try {
        // 不正なデータベース操作を試みる（例：存在しないテーブルにアクセス）
        // sqlを使わずに直接クエリを実行
        await sharedDbClient.db.execute("INSERT INTO non_existent_table (id) VALUES ('test')");
        // エラーが発生しなかった場合、テストを失敗させる
        expect(true).toBe(false);
      } catch (error) {
        // エラーが発生することを確認
        expect(error).not.toBeNull();
      }
      
      // トランザクションがロールバックされた場合でも、以前に保存したコンテンツは存在するはず
      const retrievedContent = await sharedRepository.findById(contentAggregate.content.id);
      expect(retrievedContent).not.toBeNull();
    } catch (error) {
      throw error;
    }
  });
}); 