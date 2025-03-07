import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createFeed } from "./feed.ts";
import { createFeedMetadata } from "../value-objects/feed-metadata.ts";

describe("Feedエンティティ", () => {
  // テスト用のフィードを作成する関数
  function createTestFeed(id: string = "feed-123") {
    return createFeed({
      id,
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

  it("すべてのプロパティを指定して作成できること", () => {
    const feed = createTestFeed();
    
    expect(feed.id).toBe("feed-123");
    expect(feed.userId).toBe("user-123");
    expect(feed.name).toBe("テストフィード");
    expect(feed.metadata.type).toBe("personal");
    expect(feed.metadata.language).toBe("ja");
    expect(feed.postIds).toEqual([]);
    expect(feed.createdAt).toEqual(new Date("2023-01-01"));
    expect(feed.updatedAt).toEqual(new Date("2023-01-01"));
  });
  
  it("フィード名を更新できること", () => {
    const feed = createTestFeed();
    const updatedFeed = feed.updateName("新しいフィード名");
    
    expect(updatedFeed.id).toBe(feed.id);
    expect(updatedFeed.name).toBe("新しいフィード名");
    expect(updatedFeed.updatedAt.getTime()).toBeGreaterThan(feed.updatedAt.getTime());
  });
  
  it("メタデータを更新できること", () => {
    const feed = createTestFeed();
    const updatedFeed = feed.updateMetadata({
      type: "collection",
      language: "en",
      description: "Test Collection"
    });
    
    expect(updatedFeed.id).toBe(feed.id);
    expect(updatedFeed.metadata.type).toBe("collection");
    expect(updatedFeed.metadata.language).toBe("en");
    expect(updatedFeed.metadata.description).toBe("Test Collection");
    expect(updatedFeed.updatedAt.getTime()).toBeGreaterThan(feed.updatedAt.getTime());
  });
  
  it("投稿を追加できること", () => {
    const feed = createTestFeed();
    const updatedFeed = feed.addPost("post-123");
    
    expect(updatedFeed.id).toBe(feed.id);
    expect(updatedFeed.postIds).toEqual(["post-123"]);
    expect(updatedFeed.updatedAt.getTime()).toBeGreaterThan(feed.updatedAt.getTime());
  });
  
  it("同じ投稿を追加しても重複しないこと", () => {
    const feed = createTestFeed();
    const updatedFeed1 = feed.addPost("post-123");
    const updatedFeed2 = updatedFeed1.addPost("post-123");
    
    expect(updatedFeed2.id).toBe(feed.id);
    expect(updatedFeed2.postIds).toEqual(["post-123"]);
    // 変更がないので更新日時も変わらない
    expect(updatedFeed2.updatedAt).toEqual(updatedFeed1.updatedAt);
  });
  
  it("投稿を削除できること", () => {
    const feed = createTestFeed();
    const updatedFeed1 = feed.addPost("post-123");
    const updatedFeed2 = updatedFeed1.addPost("post-456");
    const updatedFeed3 = updatedFeed2.removePost("post-123");
    
    expect(updatedFeed3.id).toBe(feed.id);
    expect(updatedFeed3.postIds).toEqual(["post-456"]);
    // 投稿が削除されていることを確認
    expect(updatedFeed3.postIds.includes("post-123")).toBe(false);
  });
  
  it("投稿の順序を変更できること", () => {
    const feed = createTestFeed();
    const updatedFeed1 = feed.addPost("post-123");
    const updatedFeed2 = updatedFeed1.addPost("post-456");
    const updatedFeed3 = updatedFeed2.addPost("post-789");
    const reorderedFeed = updatedFeed3.reorderPosts(["post-789", "post-456", "post-123"]);
    
    expect(reorderedFeed.id).toBe(feed.id);
    expect(reorderedFeed.postIds).toEqual(["post-789", "post-456", "post-123"]);
    // 順序が変更されていることを確認
    expect(reorderedFeed.postIds[0]).toBe("post-789");
    expect(reorderedFeed.postIds[2]).toBe("post-123");
  });
  
  it("IDが指定されていない場合はエラーになること", () => {
    expect(() => {
      createFeed({
        id: "",
        userId: "user-123",
        name: "テストフィード",
        metadata: createFeedMetadata({
          type: "personal",
          language: "ja"
        }),
        postIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }).toThrow();
  });
  
  it("空のフィード名で更新しようとするとエラーになること", () => {
    const feed = createTestFeed();
    
    expect(() => {
      feed.updateName("");
    }).toThrow();
  });
  
  it("空の投稿IDで追加しようとするとエラーになること", () => {
    const feed = createTestFeed();
    
    expect(() => {
      feed.addPost("");
    }).toThrow();
  });
  
  it("無効な投稿IDリストで順序変更しようとするとエラーになること", () => {
    const feed = createTestFeed();
    const updatedFeed = feed.addPost("post-123");
    
    expect(() => {
      updatedFeed.reorderPosts(["post-456"]);
    }).toThrow();
  });
}); 