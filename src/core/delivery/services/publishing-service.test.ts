import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { PublishingService } from "./publishing-service.ts";
import { createPostAggregate, createNewPostAggregate } from "../aggregates/post-aggregate.ts";
import { createFeedAggregate, createNewFeedAggregate } from "../aggregates/feed-aggregate.ts";
import { createPost } from "../entities/post.ts";
import { createPublishStatus } from "../value-objects/publish-status.ts";

describe("PublishingService", () => {
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
  
  // テスト用の投稿集約を作成する関数
  function createTestPostAggregate(id: string = "post-123") {
    return createPostAggregate({
      post: createTestPost(id)
    });
  }
  
  // テスト用のフィード集約を作成する関数
  function createTestFeedAggregate() {
    return createNewFeedAggregate({
      userId: "user-123",
      name: "テストフィード",
      metadataProps: {
        type: "personal",
        language: "ja"
      }
    });
  }

  it("投稿を公開できること", () => {
    const service = new PublishingService();
    const postAggregate = createTestPostAggregate();
    
    const publishedAggregate = service.publishPost(postAggregate);
    const post = publishedAggregate.getPost();
    
    expect(post.publishStatus.type).toBe("published");
    expect(post.publishStatus.publishedAt).toBeDefined();
  });
  
  it("投稿を公開予定として設定できること", () => {
    const service = new PublishingService();
    const postAggregate = createTestPostAggregate();
    
    // 未来の日時を設定
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1日後
    
    const scheduledAggregate = service.schedulePost(postAggregate, futureDate);
    const post = scheduledAggregate.getPost();
    
    expect(post.publishStatus.type).toBe("scheduled");
    expect(post.publishStatus.scheduledAt).toEqual(futureDate);
  });
  
  it("過去の日時を公開予定として設定するとエラーになること", () => {
    const service = new PublishingService();
    const postAggregate = createTestPostAggregate();
    
    // 過去の日時を設定
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1日前
    
    expect(() => {
      service.schedulePost(postAggregate, pastDate);
    }).toThrow();
  });
  
  it("投稿を下書きに戻せること", () => {
    const service = new PublishingService();
    const postAggregate = createTestPostAggregate();
    const publishedAggregate = service.publishPost(postAggregate);
    
    const unpublishedAggregate = service.unpublishPost(publishedAggregate);
    const post = unpublishedAggregate.getPost();
    
    expect(post.publishStatus.type).toBe("draft");
  });
  
  it("投稿をアーカイブできること", () => {
    const service = new PublishingService();
    const postAggregate = createTestPostAggregate();
    
    const archivedAggregate = service.archivePost(postAggregate);
    const post = archivedAggregate.getPost();
    
    expect(post.publishStatus.type).toBe("archived");
    expect(post.publishStatus.archivedAt).toBeDefined();
  });
  
  it("フィードに投稿を追加できること", () => {
    const service = new PublishingService();
    const postAggregate = createTestPostAggregate();
    const feedAggregate = createTestFeedAggregate();
    
    const updatedFeedAggregate = service.addPostToFeed(feedAggregate, postAggregate);
    const feed = updatedFeedAggregate.getFeed();
    
    expect(feed.postIds).toContain("post-123");
  });
  
  it("フィードから投稿を削除できること", () => {
    const service = new PublishingService();
    const postAggregate = createTestPostAggregate();
    const feedAggregate = createTestFeedAggregate();
    
    const withPostFeedAggregate = service.addPostToFeed(feedAggregate, postAggregate);
    const updatedFeedAggregate = service.removePostFromFeed(withPostFeedAggregate, postAggregate);
    const feed = updatedFeedAggregate.getFeed();
    
    expect(feed.postIds).not.toContain("post-123");
  });
  
  it("フィードの投稿を並べ替えできること", () => {
    const service = new PublishingService();
    const feedAggregate = createTestFeedAggregate();
    
    // 3つの投稿を作成
    const post1Aggregate = createTestPostAggregate("post-1");
    const post2Aggregate = createTestPostAggregate("post-2");
    const post3Aggregate = createTestPostAggregate("post-3");
    
    // フィードに投稿を追加
    let updatedFeedAggregate = feedAggregate;
    updatedFeedAggregate = service.addPostToFeed(updatedFeedAggregate, post1Aggregate);
    updatedFeedAggregate = service.addPostToFeed(updatedFeedAggregate, post2Aggregate);
    updatedFeedAggregate = service.addPostToFeed(updatedFeedAggregate, post3Aggregate);
    
    // 投稿を並べ替え
    const reorderedFeedAggregate = service.reorderFeedPosts(
      updatedFeedAggregate,
      [post3Aggregate, post1Aggregate, post2Aggregate]
    );
    
    const feed = reorderedFeedAggregate.getFeed();
    expect(feed.postIds).toEqual(["post-3", "post-1", "post-2"]);
  });
  
  it("公開予定日時を過ぎた投稿を公開できること", () => {
    const service = new PublishingService();
    
    // 公開予定の投稿を作成（過去の日時を設定）
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1日前
    
    const post = createPost({
      id: "post-123",
      userId: "user-123",
      contentId: "content-123",
      feedId: "feed-123",
      slug: "test-post",
      publishStatus: createPublishStatus({
        type: "scheduled",
        scheduledAt: pastDate
      }),
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01")
    });
    
    const postAggregate = createPostAggregate({ post });
    
    // 公開予定の投稿を処理
    const processedAggregate = service.processScheduledPost(postAggregate);
    const processedPost = processedAggregate.getPost();
    
    expect(processedPost.publishStatus.type).toBe("published");
    expect(processedPost.publishStatus.publishedAt).toBeDefined();
  });
  
  it("公開予定日時が未来の投稿は公開されないこと", () => {
    const service = new PublishingService();
    
    // 公開予定の投稿を作成（未来の日時を設定）
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1日後
    
    const post = createPost({
      id: "post-123",
      userId: "user-123",
      contentId: "content-123",
      feedId: "feed-123",
      slug: "test-post",
      publishStatus: createPublishStatus({
        type: "scheduled",
        scheduledAt: futureDate
      }),
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01")
    });
    
    const postAggregate = createPostAggregate({ post });
    
    // 公開予定の投稿を処理
    const processedAggregate = service.processScheduledPost(postAggregate);
    const processedPost = processedAggregate.getPost();
    
    expect(processedPost.publishStatus.type).toBe("scheduled");
    expect(processedPost.publishStatus.scheduledAt).toEqual(futureDate);
  });
  
  it("公開予定でない投稿は処理されないこと", () => {
    const service = new PublishingService();
    const postAggregate = createTestPostAggregate(); // 下書き状態
    
    // 投稿を処理
    const processedAggregate = service.processScheduledPost(postAggregate);
    
    // 変更されていないことを確認
    expect(processedAggregate).toBe(postAggregate);
  });
  
  it("複数の公開予定投稿を処理できること", () => {
    const service = new PublishingService();
    
    // 過去の日時を設定
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1日前
    
    // 未来の日時を設定
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // 1日後
    
    // 公開予定の投稿を作成（過去の日時）
    const pastPost = createPost({
      id: "post-past",
      userId: "user-123",
      contentId: "content-123",
      feedId: "feed-123",
      slug: "past-post",
      publishStatus: createPublishStatus({
        type: "scheduled",
        scheduledAt: pastDate
      }),
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01")
    });
    
    // 公開予定の投稿を作成（未来の日時）
    const futurePost = createPost({
      id: "post-future",
      userId: "user-123",
      contentId: "content-123",
      feedId: "feed-123",
      slug: "future-post",
      publishStatus: createPublishStatus({
        type: "scheduled",
        scheduledAt: futureDate
      }),
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01")
    });
    
    // 下書きの投稿を作成
    const draftPost = createTestPost("post-draft");
    
    const pastAggregate = createPostAggregate({ post: pastPost });
    const futureAggregate = createPostAggregate({ post: futurePost });
    const draftAggregate = createPostAggregate({ post: draftPost });
    
    // 複数の投稿を処理
    const processedAggregates = service.processScheduledPosts([
      pastAggregate,
      futureAggregate,
      draftAggregate
    ]);
    
    // 過去の日時の投稿は公開されていることを確認
    expect(processedAggregates[0].getPost().publishStatus.type).toBe("published");
    
    // 未来の日時の投稿は公開予定のままであることを確認
    expect(processedAggregates[1].getPost().publishStatus.type).toBe("scheduled");
    
    // 下書きの投稿は変更されていないことを確認
    expect(processedAggregates[2].getPost().publishStatus.type).toBe("draft");
  });
}); 