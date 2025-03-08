import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { ok, err } from "npm:neverthrow";
import { GetFeedByIdQuery, GetFeedByIdQueryHandler, GetFeedsByUserIdQuery, GetFeedsByUserIdQueryHandler, GetFeedByNameQuery, GetFeedByNameQueryHandler } from "../feed-query.ts";
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
    updateMetadata: () => feedAggregate,
    updateName: () => feedAggregate,
    addPost: () => feedAggregate,
    removePost: () => feedAggregate,
    reorderPosts: () => feedAggregate,
    addPosts: () => feedAggregate,
    removePosts: () => feedAggregate,
    getFeed: () => feed
  };

  return feedAggregate;
}

Deno.test("GetFeedByIdQueryHandler", async (t) => {
  await t.step("execute - 正常系: 存在するフィードIDの場合はフィードを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    const existingFeed = createMockFeedAggregate("feed1", "user1", "Test Feed");
    
    // フィードが存在することを設定
    feedRepository.findById = spy(async (id: string) => {
      if (id === "feed1") {
        return existingFeed;
      }
      return null;
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedByIdQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedByIdQuery = {
      name: "GetFeedById",
      id: "feed1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(feedRepository.findById.calls.length, 1);
    if (result.isOk()) {
      const feed = result.value;
      assertEquals(feed?.getFeed().id, "feed1");
      assertEquals(feed?.getFeed().userId, "user1");
      assertEquals(feed?.getFeed().name, "Test Feed");
    }
  });
  
  await t.step("execute - 正常系: 存在しないフィードIDの場合はnullを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // フィードが存在しないことを設定
    feedRepository.findById = spy(async (id: string) => null);
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedByIdQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedByIdQuery = {
      name: "GetFeedById",
      id: "non-existent"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(feedRepository.findById.calls.length, 1);
    if (result.isOk()) {
      assertEquals(result.value, null);
    }
  });
  
  await t.step("execute - 異常系: リポジトリでエラーが発生した場合はエラーを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // エラーが発生することを設定
    feedRepository.findById = spy(async (id: string) => {
      throw new Error("Repository error");
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedByIdQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedByIdQuery = {
      name: "GetFeedById",
      id: "feed1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(feedRepository.findById.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message, "Repository error");
    }
  });
});

Deno.test("GetFeedsByUserIdQueryHandler", async (t) => {
  await t.step("execute - 正常系: ユーザーのフィード一覧を返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    const feed1 = createMockFeedAggregate("feed1", "user1", "Test Feed 1");
    const feed2 = createMockFeedAggregate("feed2", "user1", "Test Feed 2");
    
    // フィードが存在することを設定
    feedRepository.findByUserId = spy(async (userId: string, options?: { limit?: number; offset?: number; }) => {
      if (userId === "user1") {
        return [feed1, feed2];
      }
      return [];
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedsByUserIdQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedsByUserIdQuery = {
      name: "GetFeedsByUserId",
      userId: "user1",
      limit: 10,
      offset: 0
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(feedRepository.findByUserId.calls.length, 1);
    if (result.isOk()) {
      const feeds = result.value;
      assertEquals(feeds.length, 2);
      assertEquals(feeds[0].getFeed().id, "feed1");
      assertEquals(feeds[1].getFeed().id, "feed2");
    }
  });
  
  await t.step("execute - 正常系: フィードが存在しない場合は空配列を返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // フィードが存在しないことを設定
    feedRepository.findByUserId = spy(async (userId: string, options?: { limit?: number; offset?: number; }) => []);
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedsByUserIdQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedsByUserIdQuery = {
      name: "GetFeedsByUserId",
      userId: "user2"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(feedRepository.findByUserId.calls.length, 1);
    if (result.isOk()) {
      assertEquals(result.value.length, 0);
    }
  });
  
  await t.step("execute - 異常系: リポジトリでエラーが発生した場合はエラーを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // エラーが発生することを設定
    feedRepository.findByUserId = spy(async (userId: string, options?: { limit?: number; offset?: number; }) => {
      throw new Error("Repository error");
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedsByUserIdQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedsByUserIdQuery = {
      name: "GetFeedsByUserId",
      userId: "user1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(feedRepository.findByUserId.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message, "Repository error");
    }
  });
});

Deno.test("GetFeedByNameQueryHandler", async (t) => {
  await t.step("execute - 正常系: 存在するフィード名の場合はフィードを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    const existingFeed = createMockFeedAggregate("feed1", "user1", "Test Feed");
    
    // フィードが存在することを設定
    feedRepository.findByName = spy(async (userId: string, name: string) => {
      if (userId === "user1" && name === "Test Feed") {
        return existingFeed;
      }
      return null;
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedByNameQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedByNameQuery = {
      name: "GetFeedByName",
      userId: "user1",
      feedName: "Test Feed"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(feedRepository.findByName.calls.length, 1);
    if (result.isOk()) {
      const feed = result.value;
      assertEquals(feed?.getFeed().id, "feed1");
      assertEquals(feed?.getFeed().userId, "user1");
      assertEquals(feed?.getFeed().name, "Test Feed");
    }
  });
  
  await t.step("execute - 正常系: 存在しないフィード名の場合はnullを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // フィードが存在しないことを設定
    feedRepository.findByName = spy(async (userId: string, name: string) => null);
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedByNameQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedByNameQuery = {
      name: "GetFeedByName",
      userId: "user1",
      feedName: "Non-existent Feed"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(feedRepository.findByName.calls.length, 1);
    if (result.isOk()) {
      assertEquals(result.value, null);
    }
  });
  
  await t.step("execute - 異常系: リポジトリでエラーが発生した場合はエラーを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // エラーが発生することを設定
    feedRepository.findByName = spy(async (userId: string, name: string) => {
      throw new Error("Repository error");
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetFeedByNameQueryHandler(feedRepository);
    
    // クエリを作成
    const query: GetFeedByNameQuery = {
      name: "GetFeedByName",
      userId: "user1",
      feedName: "Test Feed"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(feedRepository.findByName.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message, "Repository error");
    }
  });
}); 