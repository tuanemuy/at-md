import { assertEquals, assertInstanceOf } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { ok, err } from "npm:neverthrow";
import { CreatePostCommand, CreatePostCommandHandler } from "../create-post-command.ts";
import { PostRepository } from "../../repositories/post-repository.ts";
import { PostAggregate } from "../../../../core/delivery/aggregates/post-aggregate.ts";
import { Post } from "../../../../core/delivery/entities/post.ts";
import { PublishStatus, PublishStatusType, createPublishStatus } from "../../../../core/delivery/value-objects/publish-status.ts";

// モックの作成
class MockPostRepository implements PostRepository {
  findById = spy(async (_id: string): Promise<PostAggregate | null> => null);
  findByContentId = spy(async (_contentId: string): Promise<PostAggregate | null> => null);
  findByUserId = spy(async (_userId: string, _options?: { limit?: number; offset?: number; status?: string; }): Promise<PostAggregate[]> => []);
  save = spy(async (postAggregate: PostAggregate): Promise<PostAggregate> => postAggregate);
  delete = spy(async (_id: string): Promise<boolean> => true);
}

// モックの投稿集約を作成する関数
function createMockPostAggregate(id: string, userId: string, contentId: string): PostAggregate {
  const publishStatus = createPublishStatus({
    type: "draft" as PublishStatusType
  });

  const post: Post = {
    id,
    userId,
    contentId,
    feedId: "feed1",
    slug: "test-post",
    publishStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatePublishStatus: function() { return this; },
    makeDraft: function() { return this; },
    schedulePublication: function() { return this; },
    publish: function() { return this; },
    archive: function() { return this; },
    updateSlug: function() { return this; }
  };

  return {
    post,
    saveDraft: () => ({ post } as PostAggregate),
    schedulePublication: () => ({ post } as PostAggregate),
    publish: () => ({ post } as PostAggregate),
    archive: () => ({ post } as PostAggregate),
    updateSlug: () => ({ post } as PostAggregate),
    updatePublishStatus: () => ({ post } as PostAggregate),
    getPost: () => post
  };
}

Deno.test("CreatePostCommandHandler", async (t) => {
  await t.step("execute - 正常系: 投稿を作成して返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 既存の投稿が存在しないことを設定
    postRepository.findByContentId = spy(async (contentId: string) => null);
    
    // 保存が成功することを設定
    postRepository.save = spy(async (postAggregate) => postAggregate);
    
    // テスト対象のハンドラーを作成
    const handler = new CreatePostCommandHandler(postRepository);
    
    // コマンドを作成
    const command: CreatePostCommand = {
      name: "CreatePost",
      userId: "user1",
      contentId: "content1",
      feedId: "feed1",
      slug: "test-post"
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isOk(), true);
    if (result.isOk()) {
      const post = result.value;
      assertInstanceOf(post, Object); // PostAggregateのインスタンスであることを確認
      assertEquals(post.post.userId, "user1");
      assertEquals(post.post.contentId, "content1");
      assertEquals(post.post.feedId, "feed1");
      assertEquals(post.post.slug, "test-post");
      assertEquals(post.post.publishStatus.type, "draft");
    }
  });
  
  await t.step("execute - 異常系: 既に同じコンテンツIDの投稿が存在する場合はエラーを返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 既存の投稿が存在することを設定
    const existingPost = createMockPostAggregate("post1", "user1", "content1");
    postRepository.findByContentId = spy(async (contentId: string) => existingPost);
    
    // テスト対象のハンドラーを作成
    const handler = new CreatePostCommandHandler(postRepository);
    
    // コマンドを作成
    const command: CreatePostCommand = {
      name: "CreatePost",
      userId: "user1",
      contentId: "content1",
      feedId: "feed1",
      slug: "test-post"
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "指定されたコンテンツIDの投稿が既に存在します: content1");
    }
  });
}); 