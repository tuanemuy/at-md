import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createPost } from "./post.ts";
import { createPublishStatus } from "../value-objects/publish-status.ts";

describe("Postエンティティ", () => {
  // テスト用の投稿を作成する関数
  function createTestPost(id: string = "post-123") {
    return createPost({
      id,
      userId: "user-123",
      contentId: "content-123",
      feedId: "feed-123",
      slug: "test-post",
      publishStatus: createPublishStatus({
        type: "draft"
      }),
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01")
    });
  }

  it("すべてのプロパティを指定して作成できること", () => {
    const post = createTestPost();
    
    expect(post.id).toBe("post-123");
    expect(post.userId).toBe("user-123");
    expect(post.contentId).toBe("content-123");
    expect(post.feedId).toBe("feed-123");
    expect(post.slug).toBe("test-post");
    expect(post.publishStatus.type).toBe("draft");
    expect(post.createdAt).toEqual(new Date("2023-01-01"));
    expect(post.updatedAt).toEqual(new Date("2023-01-01"));
  });
  
  it("公開状態を更新できること", () => {
    const post = createTestPost();
    const updatedPost = post.updatePublishStatus({
      type: "published",
      publishedAt: new Date("2023-01-02")
    });
    
    expect(updatedPost.id).toBe(post.id);
    expect(updatedPost.publishStatus.type).toBe("published");
    expect(updatedPost.publishStatus.publishedAt).toBeDefined();
    expect(updatedPost.updatedAt.getTime()).toBeGreaterThan(post.updatedAt.getTime());
  });
  
  it("投稿を下書きにできること", () => {
    const post = createTestPost();
    
    // 一度公開状態に変更
    const publishedPost = post.publish();
    
    // 下書きに変更
    const draftPost = publishedPost.makeDraft();
    
    expect(draftPost.id).toBe(post.id);
    expect(draftPost.publishStatus.type).toBe("draft");
    expect(draftPost.publishStatus.type).not.toBe(publishedPost.publishStatus.type);
  });
  
  it("投稿を公開予定にできること", () => {
    const post = createTestPost();
    const scheduledAt = new Date("2023-01-15");
    const scheduledPost = post.schedulePublication(scheduledAt);
    
    expect(scheduledPost.id).toBe(post.id);
    expect(scheduledPost.publishStatus.type).toBe("scheduled");
    expect(scheduledPost.publishStatus.scheduledAt).toEqual(scheduledAt);
    expect(scheduledPost.updatedAt.getTime()).toBeGreaterThan(post.updatedAt.getTime());
  });
  
  it("投稿を公開できること", () => {
    const post = createTestPost();
    const publishedPost = post.publish();
    
    expect(publishedPost.id).toBe(post.id);
    expect(publishedPost.publishStatus.type).toBe("published");
    expect(publishedPost.publishStatus.publishedAt).toBeDefined();
    expect(publishedPost.updatedAt.getTime()).toBeGreaterThan(post.updatedAt.getTime());
  });
  
  it("投稿をアーカイブできること", () => {
    const post = createTestPost();
    const archivedPost = post.archive();
    
    expect(archivedPost.id).toBe(post.id);
    expect(archivedPost.publishStatus.type).toBe("archived");
    expect(archivedPost.publishStatus.archivedAt).toBeDefined();
    expect(archivedPost.updatedAt.getTime()).toBeGreaterThan(post.updatedAt.getTime());
  });
  
  it("スラッグを更新できること", () => {
    const post = createTestPost();
    const updatedPost = post.updateSlug("new-slug");
    
    expect(updatedPost.id).toBe(post.id);
    expect(updatedPost.slug).toBe("new-slug");
    expect(updatedPost.updatedAt.getTime()).toBeGreaterThan(post.updatedAt.getTime());
  });
  
  it("IDが指定されていない場合はエラーになること", () => {
    expect(() => {
      createPost({
        id: "",
        userId: "user-123",
        contentId: "content-123",
        feedId: "feed-123",
        slug: "test-post",
        publishStatus: createPublishStatus({
          type: "draft"
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }).toThrow();
  });
  
  it("空のスラッグで更新しようとするとエラーになること", () => {
    const post = createTestPost();
    
    expect(() => {
      post.updateSlug("");
    }).toThrow();
  });
}); 