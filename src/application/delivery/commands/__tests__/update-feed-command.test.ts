import { assertEquals, assertInstanceOf } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { ok, err } from "npm:neverthrow";
import { UpdateFeedCommand, UpdateFeedCommandHandler } from "../update-feed-command.ts";
import { FeedRepository } from "../../repositories/feed-repository.ts";
import { FeedAggregate } from "../../../../core/delivery/aggregates/feed-aggregate.ts";
import { Feed } from "../../../../core/delivery/entities/feed.ts";
import { FeedMetadata, FeedMetadataProps } from "../../../../core/delivery/value-objects/feed-metadata.ts";

// モックの作成
class MockFeedRepository implements FeedRepository {
  findById = spy(async (_id: string): Promise<FeedAggregate | null> => null);
  findByUserId = spy(async (_userId: string, _options?: { limit?: number; offset?: number; }): Promise<FeedAggregate[]> => []);
  findByName = spy(async (_userId: string, _name: string): Promise<FeedAggregate | null> => null);
  save = spy(async (feedAggregate: FeedAggregate): Promise<FeedAggregate> => feedAggregate);
  delete = spy(async (_id: string): Promise<boolean> => true);
}

// モックのフィード集約を作成する関数
function createMockFeedAggregate(id: string, userId: string, name: string): FeedAggregate {
  const metadataProps: FeedMetadataProps = {
    type: "personal",
    description: "Test Feed Description",
    language: "ja"
  };

  // 実際のcreateNewFeedAggregateを使用せず、モックを作成
  const feed: Feed = {
    id,
    userId,
    name,
    metadata: {
      ...metadataProps,
    } as FeedMetadata,
    postIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    updateMetadata: function() { return this; },
    updateName: function() { return this; },
    addPost: function() { return this; },
    removePost: function() { return this; },
    reorderPosts: function() { return this; }
  };

  const feedAggregate = {
    feed,
    updateMetadata: () => {
      // 更新されたフィード集約を返す
      return feedAggregate;
    },
    updateName: (newName: string) => {
      // 名前を更新
      feed.name = newName;
      // 更新されたフィード集約を返す
      return feedAggregate;
    },
    addPost: () => feedAggregate,
    removePost: () => feedAggregate,
    reorderPosts: () => feedAggregate,
    addPosts: () => feedAggregate,
    removePosts: () => feedAggregate,
    getFeed: () => feed
  };

  return feedAggregate;
}

Deno.test("UpdateFeedCommandHandler", async (t) => {
  await t.step("execute - 正常系: フィードを更新して返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    const existingFeed = createMockFeedAggregate("feed1", "user1", "Original Feed");
    
    // フィードが存在することを設定
    feedRepository.findById = spy(async (id: string) => {
      if (id === "feed1") {
        return existingFeed;
      }
      return null;
    });
    
    // 同名のフィードが存在しないことを設定
    feedRepository.findByName = spy(async (userId: string, name: string) => null);
    
    // 保存が成功することを設定
    feedRepository.save = spy(async (feedAggregate) => feedAggregate);
    
    // テスト対象のハンドラーを作成
    const handler = new UpdateFeedCommandHandler(feedRepository);
    
    // コマンドを作成
    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "feed1",
      userId: "user1",
      feedName: "Updated Feed",
      description: "Updated Description"
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(feedRepository.findById.calls.length, 1);
    assertEquals(feedRepository.findByName.calls.length, 1);
    assertEquals(feedRepository.save.calls.length, 1);
  });
  
  await t.step("execute - 異常系: 存在しないフィードIDの場合はエラーを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // フィードが存在しないことを設定
    feedRepository.findById = spy(async (id: string) => null);
    
    // テスト対象のハンドラーを作成
    const handler = new UpdateFeedCommandHandler(feedRepository);
    
    // コマンドを作成
    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "non-existent",
      userId: "user1",
      feedName: "Updated Feed"
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "指定されたIDのフィードが見つかりません: non-existent");
    }
  });
  
  await t.step("execute - 異常系: 他のユーザーのフィードを更新しようとするとエラーを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    const existingFeed = createMockFeedAggregate("feed1", "user1", "Original Feed");
    
    // フィードが存在することを設定
    feedRepository.findById = spy(async (id: string) => {
      if (id === "feed1") {
        return existingFeed;
      }
      return null;
    });
    
    // テスト対象のハンドラーを作成
    const handler = new UpdateFeedCommandHandler(feedRepository);
    
    // コマンドを作成（別のユーザーIDを指定）
    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "feed1",
      userId: "user2", // 別のユーザーID
      feedName: "Updated Feed"
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "このフィードを更新する権限がありません");
    }
  });
  
  await t.step("execute - 異常系: 同じ名前のフィードが既に存在する場合はエラーを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    const existingFeed = createMockFeedAggregate("feed1", "user1", "Original Feed");
    const duplicateFeed = createMockFeedAggregate("feed2", "user1", "Duplicate Feed");
    
    // フィードが存在することを設定
    feedRepository.findById = spy(async (id: string) => {
      if (id === "feed1") {
        return existingFeed;
      }
      return null;
    });
    
    // 同名のフィードが存在することを設定
    feedRepository.findByName = spy(async (userId: string, name: string) => {
      if (userId === "user1" && name === "Duplicate Feed") {
        return duplicateFeed;
      }
      return null;
    });
    
    // テスト対象のハンドラーを作成
    const handler = new UpdateFeedCommandHandler(feedRepository);
    
    // コマンドを作成
    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "feed1",
      userId: "user1",
      feedName: "Duplicate Feed"
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "同じ名前のフィードが既に存在します: Duplicate Feed");
    }
  });
}); 