import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createPostAggregate, createNewPostAggregate } from "./post-aggregate.ts";
import { createPost } from "../entities/post.ts";
import { createPublishStatus } from "../value-objects/publish-status.ts";

describe("PostAggregate", () => {
  // テスト用の投稿を作成する関数
  function createTestPost() {
    return createPost({
      id: "post-123",
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
  
  // テスト用の投稿集約を作成する関数
  function createTestPostAggregate() {
    return createPostAggregate({
      post: createTestPost()
    });
  }

  it("投稿エンティティから集約を作成できること", () => {
    const post = createTestPost();
    const aggregate = createPostAggregate({ post });
    
    expect(aggregate.post).toBe(post);
  });
  
  it("新しい投稿集約を作成できること", () => {
    const aggregate = createNewPostAggregate({
      userId: "user-123",
      contentId: "content-123",
      feedId: "feed-123",
      slug: "new-post"
    });
    
    const post = aggregate.getPost();
    expect(post.userId).toBe("user-123");
    expect(post.contentId).toBe("content-123");
    expect(post.feedId).toBe("feed-123");
    expect(post.slug).toBe("new-post");
    expect(post.publishStatus.type).toBe("draft");
    expect(post.id).toBeDefined();
    expect(post.createdAt).toBeDefined();
    expect(post.updatedAt).toBeDefined();
  });
  
  it("投稿を下書きとして保存できること", () => {
    const aggregate = createTestPostAggregate();
    const publishedAggregate = aggregate.publish();
    const draftAggregate = publishedAggregate.saveDraft();
    
    const post = draftAggregate.getPost();
    expect(post.publishStatus.type).toBe("draft");
  });
  
  it("投稿を公開予定として設定できること", () => {
    const aggregate = createTestPostAggregate();
    const scheduledAt = new Date("2023-01-15");
    const scheduledAggregate = aggregate.schedulePublication(scheduledAt);
    
    const post = scheduledAggregate.getPost();
    expect(post.publishStatus.type).toBe("scheduled");
    expect(post.publishStatus.scheduledAt).toEqual(scheduledAt);
  });
  
  it("投稿を即時公開できること", () => {
    const aggregate = createTestPostAggregate();
    const publishedAggregate = aggregate.publish();
    
    const post = publishedAggregate.getPost();
    expect(post.publishStatus.type).toBe("published");
    expect(post.publishStatus.publishedAt).toBeDefined();
  });
  
  it("投稿をアーカイブできること", () => {
    const aggregate = createTestPostAggregate();
    const archivedAggregate = aggregate.archive();
    
    const post = archivedAggregate.getPost();
    expect(post.publishStatus.type).toBe("archived");
    expect(post.publishStatus.archivedAt).toBeDefined();
  });
  
  it("投稿のスラッグを更新できること", () => {
    const aggregate = createTestPostAggregate();
    const updatedAggregate = aggregate.updateSlug("new-slug");
    
    const post = updatedAggregate.getPost();
    expect(post.slug).toBe("new-slug");
  });
  
  it("投稿の公開状態を更新できること", () => {
    const aggregate = createTestPostAggregate();
    const updatedAggregate = aggregate.updatePublishStatus({
      type: "published",
      publishedAt: new Date("2023-01-02")
    });
    
    const post = updatedAggregate.getPost();
    expect(post.publishStatus.type).toBe("published");
    expect(post.publishStatus.publishedAt).toBeDefined();
  });
  
  it("空のスラッグで新しい投稿集約を作成しようとするとエラーになること", () => {
    expect(() => {
      createNewPostAggregate({
        userId: "user-123",
        contentId: "content-123",
        feedId: "feed-123",
        slug: ""
      });
    }).toThrow();
  });
}); 