/**
 * DrizzleFeedRepositoryのテスト
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { beforeEach, describe, it } from "https://deno.land/std/testing/bdd.ts";

import {
  Result,
  ok,
  err,
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  generateId,
  type FeedAggregate,
  type Feed,
  type FeedMetadata,
  createNewFeedAggregate,
  type FeedRepository,
  feeds,
  db
} from "./__tests__/deps.ts";

import { DrizzleFeedRepository } from "./drizzle-feed-repository.ts";

describe("DrizzleFeedRepository", () => {
  let repository: FeedRepository;
  let testFeedId: string;
  
  beforeEach(async () => {
    // テスト用リポジトリの作成
    repository = new DrizzleFeedRepository(db);
    
    // テストデータのクリーンアップ
    await db.delete(feeds).execute();
    
    // テスト用フィードIDの生成
    testFeedId = generateId();
  });
  
  describe("findById", () => {
    it("存在するフィードを取得できる", async () => {
      // テスト用フィードの作成
      const feedAggregate = createNewFeedAggregate({
        userId: "test-user-id",
        name: "テストフィード",
        metadata: {
          tags: ["test", "feed"],
          categories: [],
          language: "ja"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // フィードの保存
      await repository.save(feedAggregate);
      
      // フィードの取得
      const result = await repository.findById(testFeedId);
      
      // 検証
      assertEquals(result?.feed.id, testFeedId);
      assertEquals(result?.feed.slug, "test-feed");
      assertEquals(result?.feed.title, "テストフィード");
      assertEquals(result?.feed.description, "これはテストフィードです。");
    });
    
    it("存在しないフィードIDの場合はnullを返す", async () => {
      const result = await repository.findById("non-existent-id");
      assertEquals(result, null);
    });
  });
  
  describe("findBySlug", () => {
    it("スラッグによってフィードを取得できる", async () => {
      // テスト用フィードの作成
      const feedAggregate = createNewFeedAggregate({
        id: testFeedId,
        slug: "test-feed-slug",
        title: "テストフィード",
        description: "これはテストフィードです。",
        metadata: {
          keywords: ["test", "feed"]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // フィードの保存
      await repository.save(feedAggregate);
      
      // スラッグでフィードを検索
      const result = await repository.findBySlug("test-feed-slug");
      
      // 検証
      assertEquals(result?.feed.id, testFeedId);
      assertEquals(result?.feed.slug, "test-feed-slug");
      assertEquals(result?.feed.title, "テストフィード");
    });
    
    it("存在しないスラッグの場合はnullを返す", async () => {
      const result = await repository.findBySlug("non-existent-slug");
      assertEquals(result, null);
    });
  });
  
  describe("save", () => {
    it("新しいフィードを保存できる", async () => {
      // テスト用フィードの作成
      const feedAggregate = createNewFeedAggregate({
        userId: "test-user-id",
        name: "テストフィード",
        metadata: {
          tags: ["test", "feed"],
          categories: [],
          language: "ja"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // フィードの保存
      const savedFeed = await repository.save(feedAggregate);
      
      // 検証
      assertEquals(savedFeed.feed.id, testFeedId);
      assertEquals(savedFeed.feed.slug, "new-feed");
      assertEquals(savedFeed.feed.title, "新しいフィード");
      assertEquals(savedFeed.feed.description, "これは新しいフィードです。");
      
      // データベースから直接取得して検証
      const [dbFeed] = await db.select().from(feeds).where(eq(feeds.id, testFeedId)).execute();
      assertEquals(dbFeed.id, testFeedId);
      assertEquals(dbFeed.slug, "new-feed");
      assertEquals(dbFeed.title, "新しいフィード");
      assertEquals(dbFeed.description, "これは新しいフィードです。");
    });
    
    it("既存のフィードを更新できる", async () => {
      // テスト用フィードの作成と保存
      const feedAggregate = createNewFeedAggregate({
        id: testFeedId,
        slug: "update-feed",
        title: "更新前フィード",
        description: "これは更新前のフィードです。",
        metadata: {
          keywords: ["before", "update"]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await repository.save(feedAggregate);
      
      // フィード情報の更新
      const updatedFeedAggregate = feedAggregate.updateTitle("更新後フィード");
      const updatedFeedAggregate2 = updatedFeedAggregate.updateDescription("これは更新後のフィードです。");
      
      const savedFeed = await repository.save(updatedFeedAggregate2);
      
      // 検証
      assertEquals(savedFeed.feed.id, testFeedId);
      assertEquals(savedFeed.feed.slug, "update-feed");
      assertEquals(savedFeed.feed.title, "更新後フィード");
      assertEquals(savedFeed.feed.description, "これは更新後のフィードです。");
      
      // データベースから直接取得して検証
      const [dbFeed] = await db.select().from(feeds).where(eq(feeds.id, testFeedId)).execute();
      assertEquals(dbFeed.id, testFeedId);
      assertEquals(dbFeed.slug, "update-feed");
      assertEquals(dbFeed.title, "更新後フィード");
      assertEquals(dbFeed.description, "これは更新後のフィードです。");
    });
  });
  
  describe("delete", () => {
    it("フィードを削除できる", async () => {
      // テスト用フィードの作成と保存
      const feedAggregate = createNewFeedAggregate({
        id: testFeedId,
        slug: "delete-feed",
        title: "削除対象フィード",
        description: "これは削除対象のフィードです。",
        metadata: {
          keywords: ["delete", "feed"]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await repository.save(feedAggregate);
      
      // 削除前に存在することを確認
      const beforeDelete = await repository.findById(testFeedId);
      assertEquals(beforeDelete !== null, true);
      
      // フィードの削除
      const result = await repository.delete(testFeedId);
      assertEquals(result, true);
      
      // 削除後に存在しないことを確認
      const afterDelete = await repository.findById(testFeedId);
      assertEquals(afterDelete, null);
    });
    
    it("存在しないフィードIDの場合はfalseを返す", async () => {
      const result = await repository.delete("non-existent-id");
      assertEquals(result, false);
    });
  });
});

// eq関数の定義
function eq(
  column: unknown, 
  value: unknown
) {
  return { equals: (value: unknown) => ({ column, value, operator: "=" }) };
} 