import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { ok, err } from "npm:neverthrow";
import { PublishingSchedulingService, DefaultPublishingSchedulingService } from "../publishing-scheduling-service.ts";
import { PostRepository } from "../../repositories/post-repository.ts";
import { PostAggregate } from "../../../../core/delivery/aggregates/post-aggregate.ts";
import { Post } from "../../../../core/delivery/entities/post.ts";
import { PublishStatus } from "../../../../core/delivery/value-objects/publish-status.ts";

// モックの作成
class MockPostRepository implements PostRepository {
  findById = spy(async (_id: string): Promise<PostAggregate | null> => null);
  findByContentId = spy(async (_contentId: string): Promise<PostAggregate | null> => null);
  findByUserId = spy(async (_userId: string, _options?: { limit?: number; offset?: number; status?: string; }): Promise<PostAggregate[]> => []);
  save = spy(async (postAggregate: PostAggregate): Promise<PostAggregate> => postAggregate);
  delete = spy(async (_id: string): Promise<boolean> => true);
}

// モックの投稿集約を作成する関数
function createMockPostAggregate(id: string, userId: string, contentId: string, slug: string, statusType: string, scheduledAt?: Date): PostAggregate {
  // 実際のcreatePostAggregateを使用せず、モックを作成
  const publishStatus: PublishStatus = {
    type: statusType as "draft" | "scheduled" | "published" | "archived",
    scheduledAt: statusType === "scheduled" ? scheduledAt : undefined,
    publishedAt: statusType === "published" ? new Date() : undefined,
    archivedAt: statusType === "archived" ? new Date() : undefined,
  };

  // Postインターフェースに必要なメソッドを含むモックを作成
  const post = {
    id,
    userId,
    contentId,
    feedId: "feed1",
    slug,
    publishStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // 必要なメソッド
    updatePublishStatus: function() { return this; },
    makeDraft: function() { return this; },
    schedulePublication: function() { return this; },
    publish: function() { return this; },
    archive: function() { return this; },
    updateSlug: function() { return this; }
  } as Post;

  const postAggregate = {
    post,
    saveDraft: () => postAggregate,
    schedulePublication: () => postAggregate,
    publish: () => postAggregate,
    archive: () => postAggregate,
    updateSlug: () => postAggregate,
    updatePublishStatus: () => postAggregate,
    getPost: () => post
  };

  return postAggregate;
}

Deno.test("DefaultPublishingSchedulingService", async (t) => {
  await t.step("getScheduledPosts - 正常系: 指定された日付の公開予定投稿を返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 今日の日付
    const today = new Date();
    
    // 昨日の日付
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 明日の日付
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 公開予定の投稿を作成
    const post1 = createMockPostAggregate("post1", "user1", "content1", "test-post-1", "scheduled", today);
    const post2 = createMockPostAggregate("post2", "user1", "content2", "test-post-2", "scheduled", yesterday);
    const post3 = createMockPostAggregate("post3", "user1", "content3", "test-post-3", "scheduled", tomorrow);
    const post4 = createMockPostAggregate("post4", "user1", "content4", "test-post-4", "draft");
    
    // 投稿が存在することを設定
    postRepository.findByUserId = spy(async (userId: string, options?: { limit?: number; offset?: number; status?: string; }) => {
      if (options?.status === "scheduled") {
        return [post1, post2, post3];
      }
      return [];
    });
    
    // テスト対象のサービスを作成
    const service = new DefaultPublishingSchedulingService(postRepository);
    
    // テスト実行
    const result = await service.getScheduledPosts(today);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findByUserId.calls.length, 1);
    if (result.isOk()) {
      const posts = result.value;
      // 今日の日付の投稿のみが含まれていることを確認
      assertEquals(posts.length, 1);
      assertEquals(posts[0].getPost().id, "post1");
    }
  });
  
  await t.step("publishScheduledPost - 正常系: 公開予定の投稿を公開する", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 公開予定の投稿を作成
    const scheduledPost = createMockPostAggregate("post1", "user1", "content1", "test-post", "scheduled", new Date());
    
    // 投稿が存在することを設定
    postRepository.findById = spy(async (id: string) => {
      if (id === "post1") {
        return scheduledPost;
      }
      return null;
    });
    
    // 公開された投稿を作成
    const publishedPost = createMockPostAggregate("post1", "user1", "content1", "test-post", "published");
    
    // 投稿の公開メソッドをモック
    const publishSpy = spy(() => publishedPost);
    scheduledPost.publish = publishSpy;
    
    // 保存が成功することを設定
    postRepository.save = spy(async (postAggregate: PostAggregate) => postAggregate);
    
    // テスト対象のサービスを作成
    const service = new DefaultPublishingSchedulingService(postRepository);
    
    // テスト実行
    const result = await service.publishScheduledPost("post1");
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findById.calls.length, 1);
    assertEquals(publishSpy.calls.length, 1);
    assertEquals(postRepository.save.calls.length, 1);
    if (result.isOk()) {
      const post = result.value;
      assertEquals(post.getPost().id, "post1");
      assertEquals(post.getPost().publishStatus.type, "published");
    }
  });
  
  await t.step("publishScheduledPost - 異常系: 投稿が存在しない場合はエラーを返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 投稿が存在しないことを設定
    postRepository.findById = spy(async (id: string) => null);
    
    // テスト対象のサービスを作成
    const service = new DefaultPublishingSchedulingService(postRepository);
    
    // テスト実行
    const result = await service.publishScheduledPost("non-existent");
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(postRepository.findById.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message, "投稿が見つかりません: non-existent");
    }
  });
  
  await t.step("publishScheduledPost - 異常系: 投稿が公開予定状態でない場合はエラーを返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 下書き状態の投稿を作成
    const draftPost = createMockPostAggregate("post1", "user1", "content1", "test-post", "draft");
    
    // 投稿が存在することを設定
    postRepository.findById = spy(async (id: string) => {
      if (id === "post1") {
        return draftPost;
      }
      return null;
    });
    
    // テスト対象のサービスを作成
    const service = new DefaultPublishingSchedulingService(postRepository);
    
    // テスト実行
    const result = await service.publishScheduledPost("post1");
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(postRepository.findById.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message, "投稿は公開予定状態ではありません: post1");
    }
  });
  
  await t.step("publishScheduledPostsByDate - 正常系: 指定された日付の公開予定投稿を一括で公開する", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 今日の日付
    const today = new Date();
    
    // 公開予定の投稿を作成
    const post1 = createMockPostAggregate("post1", "user1", "content1", "test-post-1", "scheduled", new Date(today.getTime() - 1000 * 60 * 60)); // 1時間前
    const post2 = createMockPostAggregate("post2", "user1", "content2", "test-post-2", "scheduled", new Date(today.getTime() + 1000 * 60 * 60)); // 1時間後
    
    // 投稿が存在することを設定
    postRepository.findByUserId = spy(async (userId: string, options?: { limit?: number; offset?: number; status?: string; }) => {
      if (options?.status === "scheduled") {
        return [post1, post2];
      }
      return [];
    });
    
    // 投稿が存在することを設定
    postRepository.findById = spy(async (id: string) => {
      if (id === "post1") {
        return post1;
      } else if (id === "post2") {
        return post2;
      }
      return null;
    });
    
    // 公開された投稿を作成
    const publishedPost1 = createMockPostAggregate("post1", "user1", "content1", "test-post-1", "published");
    
    // 投稿の公開メソッドをモック
    const publishSpy1 = spy(() => publishedPost1);
    const publishSpy2 = spy(() => post2);
    post1.publish = publishSpy1;
    post2.publish = publishSpy2; // post2は公開されない
    
    // 保存が成功することを設定
    postRepository.save = spy(async (postAggregate: PostAggregate) => postAggregate);
    
    // テスト対象のサービスを作成
    const service = new DefaultPublishingSchedulingService(postRepository);
    
    // テスト実行
    const result = await service.publishScheduledPostsByDate(today);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findByUserId.calls.length, 1);
    assertEquals(publishSpy1.calls.length, 1); // post1は公開される
    assertEquals(publishSpy2.calls.length, 0); // post2は公開されない
    assertEquals(postRepository.save.calls.length, 1);
    if (result.isOk()) {
      const posts = result.value;
      assertEquals(posts.length, 1);
      assertEquals(posts[0].getPost().id, "post1");
      assertEquals(posts[0].getPost().publishStatus.type, "published");
    }
  });
}); 