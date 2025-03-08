/**
 * DrizzleFeedRepositoryのテスト
 */
import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { eq } from "drizzle-orm";
import { feeds } from "../../database/schema/display.ts";
import { DrizzleFeedRepository } from "./drizzle-feed-repository.ts";
import { FeedAggregate, createNewFeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
import { FeedMetadataProps } from "../../../core/delivery/value-objects/feed-metadata.ts";
import { DrizzleClient, createDrizzleClient } from "../../database/client.ts";

// 環境変数を設定
Deno.env.set("DATABASE_URL", "postgres://test:test@localhost:55432/at-md");

// テスト用のフィード集約を作成する関数
function createTestFeedAggregate(userId: string, name: string, description = "テスト用フィード"): FeedAggregate {
  const metadataProps: FeedMetadataProps = {
    type: "personal",
    description,
    language: "ja"
  };

  return createNewFeedAggregate({
    userId,
    name,
    metadataProps
  });
}

describe("DrizzleFeedRepository", () => {
  let client: DrizzleClient;
  let repository: DrizzleFeedRepository;
  let testFeeds: { id: string }[] = [];

  beforeEach(async () => {
    // 明示的に接続文字列を指定してクライアントを作成
    client = createDrizzleClient("postgres://test:test@localhost:55432/at-md");
    
    // テスト対象のリポジトリを作成
    repository = new DrizzleFeedRepository(client.db);
    
    // テスト用のデータをクリーンアップ
    await cleanupTestData();
  });

  afterEach(async () => {
    // テスト用のデータをクリーンアップ
    await cleanupTestData();
    
    // データベース接続を閉じる
    await client.close();
  });
  
  // テスト用のデータをクリーンアップする関数
  async function cleanupTestData() {
    if (testFeeds.length > 0) {
      for (const feed of testFeeds) {
        try {
          await client.db.delete(feeds).where(eq(feeds.id, feed.id)).execute();
        } catch (error) {
          console.error(`テストデータのクリーンアップ中にエラーが発生しました: ${feed.id}`, error);
        }
      }
      testFeeds = [];
    }
  }
  
  it("save - 新しいフィードを保存できること", async () => {
    // テスト用のフィード集約を作成
    const userId = "user1";
    const feedName = "テストフィード";
    const feedAggregate = createTestFeedAggregate(userId, feedName);
    
    // フィードを保存
    const savedFeed = await repository.save(feedAggregate);
    testFeeds.push({ id: savedFeed.getFeed().id });
    
    // 検証
    expect(savedFeed).toBeDefined();
    expect(savedFeed.getFeed().id).toBeDefined();
    expect(savedFeed.getFeed().userId).toBe(userId);
    expect(savedFeed.getFeed().name).toBe(feedName);
    expect(savedFeed.getFeed().metadata.type).toBe("personal");
    expect(savedFeed.getFeed().metadata.description).toBe("テスト用フィード");
    expect(savedFeed.getFeed().postIds).toEqual([]);
  });
  
  it("findById - IDによってフィードを検索できること", async () => {
    // テスト用のフィード集約を作成して保存
    const userId = "user2";
    const feedName = "検索テストフィード";
    const feedAggregate = createTestFeedAggregate(userId, feedName);
    const savedFeed = await repository.save(feedAggregate);
    const feedId = savedFeed.getFeed().id;
    testFeeds.push({ id: feedId });
    
    // IDでフィードを検索
    const foundFeed = await repository.findById(feedId);
    
    // 検証
    expect(foundFeed).toBeDefined();
    expect(foundFeed?.getFeed().id).toBe(feedId);
    expect(foundFeed?.getFeed().userId).toBe(userId);
    expect(foundFeed?.getFeed().name).toBe(feedName);
  });
  
  it("findById - 存在しないIDの場合はnullを返すこと", async () => {
    // 存在しないIDでフィードを検索
    const nonExistentId = "non-existent-id";
    const foundFeed = await repository.findById(nonExistentId);
    
    // 検証
    expect(foundFeed).toBeNull();
  });
  
  it("findByUserId - ユーザーIDによってフィードを検索できること", async () => {
    // テスト用のユーザーID
    const userId = "user3";
    
    // 同じユーザーIDで複数のフィードを作成して保存
    const feed1 = createTestFeedAggregate(userId, "ユーザーフィード1");
    const feed2 = createTestFeedAggregate(userId, "ユーザーフィード2");
    const savedFeed1 = await repository.save(feed1);
    const savedFeed2 = await repository.save(feed2);
    testFeeds.push({ id: savedFeed1.getFeed().id });
    testFeeds.push({ id: savedFeed2.getFeed().id });
    
    // ユーザーIDでフィードを検索
    const foundFeeds = await repository.findByUserId(userId);
    
    // 検証
    expect(foundFeeds).toBeDefined();
    expect(foundFeeds.length).toBeGreaterThanOrEqual(2);
    expect(foundFeeds.some(feed => feed.getFeed().name === "ユーザーフィード1")).toBe(true);
    expect(foundFeeds.some(feed => feed.getFeed().name === "ユーザーフィード2")).toBe(true);
  });
  
  it("findByUserId - 存在しないユーザーIDの場合は空配列を返すこと", async () => {
    // 存在しないユーザーIDでフィードを検索
    const nonExistentUserId = "non-existent-user-id";
    const foundFeeds = await repository.findByUserId(nonExistentUserId);
    
    // 検証
    expect(foundFeeds).toEqual([]);
  });
  
  it("findByName - ユーザーIDとフィード名によってフィードを検索できること", async () => {
    // テスト用のユーザーIDとフィード名
    const userId = "user4";
    const feedName = "名前検索テストフィード";
    
    // フィードを作成して保存
    const feed = createTestFeedAggregate(userId, feedName);
    const savedFeed = await repository.save(feed);
    testFeeds.push({ id: savedFeed.getFeed().id });
    
    // ユーザーIDとフィード名でフィードを検索
    const foundFeed = await repository.findByName(userId, feedName);
    
    // 検証
    expect(foundFeed).toBeDefined();
    expect(foundFeed?.getFeed().userId).toBe(userId);
    expect(foundFeed?.getFeed().name).toBe(feedName);
  });
  
  it("findByName - 存在しないフィード名の場合はnullを返すこと", async () => {
    // 存在しないフィード名でフィードを検索
    const userId = "user4";
    const nonExistentName = "non-existent-name";
    const foundFeed = await repository.findByName(userId, nonExistentName);
    
    // 検証
    expect(foundFeed).toBeNull();
  });
  
  it("save - 既存のフィードを更新できること", async () => {
    // テスト用のフィード集約を作成して保存
    const userId = "user5";
    const feedName = "更新テストフィード";
    const feedAggregate = createTestFeedAggregate(userId, feedName);
    const savedFeed = await repository.save(feedAggregate);
    const feedId = savedFeed.getFeed().id;
    testFeeds.push({ id: feedId });
    
    // フィード名を更新
    const updatedName = "更新後のフィード名";
    const updatedFeedAggregate = savedFeed.updateName(updatedName);
    
    // 更新したフィードを保存
    const updatedSavedFeed = await repository.save(updatedFeedAggregate);
    
    // 検証
    expect(updatedSavedFeed).toBeDefined();
    expect(updatedSavedFeed.getFeed().id).toBe(feedId);
    expect(updatedSavedFeed.getFeed().name).toBe(updatedName);
    
    // データベースから直接確認
    const dbFeed = await client.db.select().from(feeds).where(eq(feeds.id, feedId)).execute();
    expect(dbFeed.length).toBe(1);
    expect(dbFeed[0].name).toBe(updatedName);
  });
  
  it("delete - フィードを削除できること", async () => {
    // テスト用のフィード集約を作成して保存
    const userId = "user6";
    const feedName = "削除テストフィード";
    const feedAggregate = createTestFeedAggregate(userId, feedName);
    
    // 新しいクライアントとリポジトリを作成（テスト間の分離のため）
    const deleteClient = createDrizzleClient("postgres://test:test@localhost:55432/at-md");
    const deleteRepository = new DrizzleFeedRepository(deleteClient.db);
    
    // フィードを保存
    const savedFeed = await deleteRepository.save(feedAggregate);
    const feedId = savedFeed.getFeed().id;
    
    // 保存されたことを確認
    const foundFeed = await deleteRepository.findById(feedId);
    expect(foundFeed).not.toBeNull();
    
    // フィードを削除
    const result = await deleteRepository.delete(feedId);
    
    // 検証
    expect(result).toBe(true);
    
    // 削除されたことを確認
    const deletedFeed = await deleteRepository.findById(feedId);
    expect(deletedFeed).toBeNull();
    
    // クライアントを閉じる
    await deleteClient.close();
  });
  
  it("delete - 存在しないIDの場合はfalseを返すこと", async () => {
    // 存在しないIDでフィードを削除
    const nonExistentId = "non-existent-id";
    const result = await repository.delete(nonExistentId);
    
    // 検証
    expect(result).toBe(false);
  });
}); 