import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { ok, err } from "npm:neverthrow";
import { DeleteFeedCommand, DeleteFeedCommandHandler } from "../delete-feed-command.ts";
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

Deno.test("DeleteFeedCommandHandler", async (t) => {
  await t.step("execute - 正常系: フィードを削除して成功を返す", async () => {
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
    
    // 削除が成功することを設定
    feedRepository.delete = spy(async (id: string) => true);
    
    // テスト対象のハンドラーを作成
    const handler = new DeleteFeedCommandHandler(feedRepository);
    
    // コマンドを作成
    const command: DeleteFeedCommand = {
      name: "DeleteFeed",
      feedId: "feed1",
      userId: "user1"
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(feedRepository.findById.calls.length, 1);
    assertEquals(feedRepository.delete.calls.length, 1);
    if (result.isOk()) {
      assertEquals(result.value, true);
    }
  });
  
  await t.step("execute - 異常系: 存在しないフィードIDの場合はエラーを返す", async () => {
    // モックの準備
    const feedRepository = new MockFeedRepository();
    
    // フィードが存在しないことを設定
    feedRepository.findById = spy(async (id: string) => null);
    
    // テスト対象のハンドラーを作成
    const handler = new DeleteFeedCommandHandler(feedRepository);
    
    // コマンドを作成
    const command: DeleteFeedCommand = {
      name: "DeleteFeed",
      feedId: "non-existent",
      userId: "user1"
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "指定されたIDのフィードが見つかりません: non-existent");
    }
  });
  
  await t.step("execute - 異常系: 他のユーザーのフィードを削除しようとするとエラーを返す", async () => {
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
    const handler = new DeleteFeedCommandHandler(feedRepository);
    
    // コマンドを作成（別のユーザーIDを指定）
    const command: DeleteFeedCommand = {
      name: "DeleteFeed",
      feedId: "feed1",
      userId: "user2" // 別のユーザーID
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "このフィードを削除する権限がありません");
    }
  });
}); 