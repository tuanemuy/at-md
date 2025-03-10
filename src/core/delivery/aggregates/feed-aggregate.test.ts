import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { 
  FeedAggregate, 
  createFeedAggregate, 
  createNewFeedAggregate 
} from "./feed-aggregate.ts";
import { createFeed } from "../entities/feed.ts";
import { createFeedMetadata, FeedMetadataProps } from "../value-objects/feed-metadata.ts";

describe("FeedAggregate", () => {
  // テスト用のフィードを作成する関数
  function createTestFeed() {
    return createFeed({
      id: "feed-123",
      userId: "user-123",
      name: "テストフィード",
      metadata: createFeedMetadata({
        type: "personal",
        language: "ja"
      }),
      postIds: [],
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01")
    });
  }
  
  // テスト用のフィード集約を作成する関数
  function createTestFeedAggregate() {
    return createFeedAggregate({
      feed: createTestFeed()
    });
  }

  it("フィードエンティティから集約を作成できること", () => {
    const feed = createTestFeed();
    const aggregate = createFeedAggregate({ feed });
    
    expect(aggregate.feed).toBe(feed);
  });
  
  it("新しいフィード集約を作成できること", () => {
    const aggregate = createNewFeedAggregate({
      userId: "user-123",
      name: "新しいフィード",
      metadataProps: {
        type: "collection",
        language: "en",
        description: "Test Collection"
      }
    });
    
    const feed = aggregate.getFeed();
    expect(feed.userId).toBe("user-123");
    expect(feed.name).toBe("新しいフィード");
    expect(feed.metadata.type).toBe("collection");
    expect(feed.metadata.language).toBe("en");
    expect(feed.metadata.description).toBe("Test Collection");
    expect(feed.postIds).toEqual([]);
    expect(feed.id).toBeDefined();
    expect(feed.createdAt).toBeDefined();
    expect(feed.updatedAt).toBeDefined();
  });
  
  it("フィード名を更新できること", () => {
    const aggregate = createTestFeedAggregate();
    const updatedAggregate = aggregate.updateName("新しいフィード名");
    
    const feed = updatedAggregate.getFeed();
    expect(feed.name).toBe("新しいフィード名");
  });
  
  it("メタデータを更新できること", () => {
    const aggregate = createTestFeedAggregate();
    const updatedAggregate = aggregate.updateMetadata({
      type: "collection",
      language: "en",
      description: "Updated Collection"
    });
    
    const feed = updatedAggregate.getFeed();
    expect(feed.metadata.type).toBe("collection");
    expect(feed.metadata.language).toBe("en");
    expect(feed.metadata.description).toBe("Updated Collection");
  });
  
  it("投稿を追加できること", () => {
    const aggregate = createTestFeedAggregate();
    const updatedAggregate = aggregate.addPost("post-123");
    
    const feed = updatedAggregate.getFeed();
    expect(feed.postIds).toEqual(["post-123"]);
  });
  
  it("投稿を削除できること", () => {
    const aggregate = createTestFeedAggregate();
    const withPostAggregate = aggregate.addPost("post-123");
    const updatedAggregate = withPostAggregate.removePost("post-123");
    
    const feed = updatedAggregate.getFeed();
    expect(feed.postIds).toEqual([]);
  });
  
  it("投稿の順序を変更できること", () => {
    const aggregate = createTestFeedAggregate();
    const withPostsAggregate = aggregate
      .addPost("post-1")
      .addPost("post-2")
      .addPost("post-3");
    
    const reorderedAggregate = withPostsAggregate.reorderPosts(["post-3", "post-1", "post-2"]);
    
    const feed = reorderedAggregate.getFeed();
    expect(feed.postIds).toEqual(["post-3", "post-1", "post-2"]);
  });
  
  it("複数の投稿を追加できること", () => {
    const aggregate = createTestFeedAggregate();
    const updatedAggregate = aggregate.addPosts(["post-1", "post-2", "post-3"]);
    
    const feed = updatedAggregate.getFeed();
    expect(feed.postIds).toEqual(["post-1", "post-2", "post-3"]);
  });
  
  it("空の投稿リストを追加しても何も変わらないこと", () => {
    const aggregate = createTestFeedAggregate();
    const updatedAggregate = aggregate.addPosts([]);
    
    expect(updatedAggregate).toBe(aggregate);
  });
  
  it("複数の投稿を削除できること", () => {
    const aggregate = createTestFeedAggregate();
    const withPostsAggregate = aggregate.addPosts(["post-1", "post-2", "post-3", "post-4"]);
    const updatedAggregate = withPostsAggregate.removePosts(["post-1", "post-3"]);
    
    const feed = updatedAggregate.getFeed();
    expect(feed.postIds).toEqual(["post-2", "post-4"]);
  });
  
  it("空の投稿リストを削除しても何も変わらないこと", () => {
    const aggregate = createTestFeedAggregate();
    const updatedAggregate = aggregate.removePosts([]);
    
    expect(updatedAggregate).toBe(aggregate);
  });
  
  it("空のフィード名で新しいフィード集約を作成しようとするとエラーになること", () => {
    expect(() => {
      createNewFeedAggregate({
        userId: "user-123",
        name: "",
        metadataProps: {
          type: "personal",
          language: "ja"
        }
      });
    }).toThrow();
  });
  
  it("メタデータなしで新しいフィード集約を作成しようとするとエラーになること", () => {
    expect(() => {
      createNewFeedAggregate({
        userId: "user-123",
        name: "テストフィード",
        metadataProps: null as unknown as FeedMetadataProps
      });
    }).toThrow();
  });

  // 無効なメタデータの場合
  it("無効なメタデータの場合はエラーをスローする", () => {
    const feed = createFeed({
      id: "feed-1",
      userId: "user-1",
      name: "Test Feed",
      metadata: createFeedMetadata({
        type: "personal",
        description: "Test Feed",
        language: "ja"
      }),
      postIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // nullのメタデータを設定しようとするとエラーになる
    expect(() => {
      // nullをFeedMetadataPropsとして扱うことでエラーを発生させる
      feed.updateMetadata(null as unknown as FeedMetadataProps);
    }).toThrow();
  });
}); 