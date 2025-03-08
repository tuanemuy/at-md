import { assertEquals, assertInstanceOf } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { ok, err } from "npm:neverthrow";
import { CreateFeedCommand, CreateFeedCommandHandler } from "../create-feed-command.ts";
import { FeedRepository } from "../../repositories/feed-repository.ts";
import { FeedAggregate, createNewFeedAggregate } from "../../../../core/delivery/aggregates/feed-aggregate.ts";
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

  return {
    feed,
    updateMetadata: () => ({ feed } as FeedAggregate),
    updateName: () => ({ feed } as FeedAggregate),
    addPost: () => ({ feed } as FeedAggregate),
    removePost: () => ({ feed } as FeedAggregate),
    reorderPosts: () => ({ feed } as FeedAggregate),
    addPosts: () => ({ feed } as FeedAggregate),
    removePosts: () => ({ feed } as FeedAggregate),
    getFeed: () => feed
  };
}

Deno.test("CreateFeedCommandHandler", async (t) => {
  await t.step("execute - 正常系: フィードを作成して返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // 既存のフィードが存在しないことを設定
    feedRepository.findByName = spy(async (userId: string, name: string) => null);
    
    // 保存が成功することを設定
    feedRepository.save = spy(async (feedAggregate) => feedAggregate);
    
    // テスト対象のハンドラーを作成
    const handler = new CreateFeedCommandHandler(feedRepository);
    
    // コマンドを作成
    const command: CreateFeedCommand = {
      name: "CreateFeed",
      userId: "user1",
      feedName: "Test Feed",
      description: "Test Feed Description",
      tags: ["test"],
      isPublic: true
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isOk(), true);
    if (result.isOk()) {
      const feed = result.value.getFeed();
      assertInstanceOf(feed, Object); // Feedのインスタンスであることを確認
      assertEquals(feed.userId, "user1");
      assertEquals(feed.name, "Test Feed");
      assertEquals(feed.metadata.description, "Test Feed Description");
      assertEquals(feed.metadata.type, "personal");
    }
  });
  
  await t.step("execute - 異常系: 既に同じ名前のフィードが存在する場合はエラーを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // 既存のフィードが存在することを設定
    const existingFeed = createMockFeedAggregate("feed1", "user1", "Test Feed");
    feedRepository.findByName = spy(async (userId: string, name: string) => existingFeed);
    
    // テスト対象のハンドラーを作成
    const handler = new CreateFeedCommandHandler(feedRepository);
    
    // コマンドを作成
    const command: CreateFeedCommand = {
      name: "CreateFeed",
      userId: "user1",
      feedName: "Test Feed",
      description: "Test Feed Description",
      tags: ["test"],
      isPublic: true
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "同じ名前のフィードが既に存在します");
    }
  });
}); 