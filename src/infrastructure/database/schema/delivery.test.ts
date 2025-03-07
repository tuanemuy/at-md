/**
 * 配信関連のデータベーススキーマのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { 
  posts, 
  feeds,
  feedItems
} from "./delivery.ts";
import { sql } from "npm:drizzle-orm";

describe("配信スキーマ", () => {
  it("postsテーブルが正しく定義されていること", () => {
    // カラムの存在確認
    expect(posts.id).toBeDefined();
    expect(posts.userId).toBeDefined();
    expect(posts.contentId).toBeDefined();
    expect(posts.feedId).toBeDefined();
    expect(posts.slug).toBeDefined();
    expect(posts.publishStatus).toBeDefined();
    expect(posts.publishedAt).toBeDefined();
    expect(posts.createdAt).toBeDefined();
    expect(posts.updatedAt).toBeDefined();
    
    // 型の確認
    expect(posts.id.dataType).toBe("string");
    expect(posts.userId.dataType).toBe("string");
    expect(posts.contentId.dataType).toBe("string");
    expect(posts.feedId.dataType).toBe("string");
    expect(posts.slug.dataType).toBe("string");
    expect(posts.publishStatus.dataType).toBe("string");
    expect(posts.publishedAt.dataType).toBe("date");
    expect(posts.createdAt.dataType).toBe("date");
    expect(posts.updatedAt.dataType).toBe("date");
  });
  
  it("feedsテーブルが正しく定義されていること", () => {
    // カラムの存在確認
    expect(feeds.id).toBeDefined();
    expect(feeds.userId).toBeDefined();
    expect(feeds.name).toBeDefined();
    expect(feeds.description).toBeDefined();
    expect(feeds.isDefault).toBeDefined();
    expect(feeds.createdAt).toBeDefined();
    expect(feeds.updatedAt).toBeDefined();
    
    // 型の確認
    expect(feeds.id.dataType).toBe("string");
    expect(feeds.userId.dataType).toBe("string");
    expect(feeds.name.dataType).toBe("string");
    expect(feeds.description.dataType).toBe("string");
    expect(feeds.isDefault.dataType).toBe("boolean");
    expect(feeds.createdAt.dataType).toBe("date");
    expect(feeds.updatedAt.dataType).toBe("date");
  });
  
  it("feedItemsテーブルが正しく定義されていること", () => {
    // カラムの存在確認
    expect(feedItems.id).toBeDefined();
    expect(feedItems.feedId).toBeDefined();
    expect(feedItems.postId).toBeDefined();
    expect(feedItems.order).toBeDefined();
    expect(feedItems.createdAt).toBeDefined();
    expect(feedItems.updatedAt).toBeDefined();
    
    // 型の確認
    expect(feedItems.id.dataType).toBe("string");
    expect(feedItems.feedId.dataType).toBe("string");
    expect(feedItems.postId.dataType).toBe("string");
    expect(feedItems.order.dataType).toBe("number");
    expect(feedItems.createdAt.dataType).toBe("date");
    expect(feedItems.updatedAt.dataType).toBe("date");
  });
}); 