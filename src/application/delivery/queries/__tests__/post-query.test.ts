import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { ok, err } from "npm:neverthrow";
import { GetPostByIdQuery, GetPostByIdQueryHandler, GetPostByContentIdQuery, GetPostByContentIdQueryHandler, GetPostsByUserIdQuery, GetPostsByUserIdQueryHandler } from "../post-query.ts";
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
function createMockPostAggregate(id: string, userId: string, contentId: string, slug: string): PostAggregate {
  // 実際のcreatePostAggregateを使用せず、モックを作成
  const publishStatus: PublishStatus = {
    type: "draft",
    scheduledAt: undefined,
    publishedAt: undefined,
    archivedAt: undefined,
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

Deno.test("GetPostByIdQueryHandler", async (t) => {
  await t.step("execute - 正常系: 存在する投稿IDの場合は投稿を返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    const existingPost = createMockPostAggregate("post1", "user1", "content1", "test-post");
    
    // 投稿が存在することを設定
    postRepository.findById = spy(async (id: string) => {
      if (id === "post1") {
        return existingPost;
      }
      return null;
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostByIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostByIdQuery = {
      name: "GetPostById",
      id: "post1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findById.calls.length, 1);
    if (result.isOk()) {
      const post = result.value;
      assertEquals(post?.getPost().id, "post1");
      assertEquals(post?.getPost().userId, "user1");
      assertEquals(post?.getPost().contentId, "content1");
    }
  });
  
  await t.step("execute - 正常系: 存在しない投稿IDの場合はnullを返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 投稿が存在しないことを設定
    postRepository.findById = spy(async (id: string) => null);
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostByIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostByIdQuery = {
      name: "GetPostById",
      id: "non-existent"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findById.calls.length, 1);
    if (result.isOk()) {
      assertEquals(result.value, null);
    }
  });
  
  await t.step("execute - 異常系: リポジトリでエラーが発生した場合はエラーを返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // エラーが発生することを設定
    postRepository.findById = spy(async (id: string) => {
      throw new Error("Repository error");
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostByIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostByIdQuery = {
      name: "GetPostById",
      id: "post1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(postRepository.findById.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message, "Repository error");
    }
  });
});

Deno.test("GetPostByContentIdQueryHandler", async (t) => {
  await t.step("execute - 正常系: 存在するコンテンツIDの場合は投稿を返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    const existingPost = createMockPostAggregate("post1", "user1", "content1", "test-post");
    
    // 投稿が存在することを設定
    postRepository.findByContentId = spy(async (contentId: string) => {
      if (contentId === "content1") {
        return existingPost;
      }
      return null;
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostByContentIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostByContentIdQuery = {
      name: "GetPostByContentId",
      contentId: "content1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findByContentId.calls.length, 1);
    if (result.isOk()) {
      const post = result.value;
      assertEquals(post?.getPost().id, "post1");
      assertEquals(post?.getPost().contentId, "content1");
    }
  });
  
  await t.step("execute - 正常系: 存在しないコンテンツIDの場合はnullを返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 投稿が存在しないことを設定
    postRepository.findByContentId = spy(async (contentId: string) => null);
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostByContentIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostByContentIdQuery = {
      name: "GetPostByContentId",
      contentId: "non-existent"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findByContentId.calls.length, 1);
    if (result.isOk()) {
      assertEquals(result.value, null);
    }
  });
  
  await t.step("execute - 異常系: リポジトリでエラーが発生した場合はエラーを返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // エラーが発生することを設定
    postRepository.findByContentId = spy(async (contentId: string) => {
      throw new Error("Repository error");
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostByContentIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostByContentIdQuery = {
      name: "GetPostByContentId",
      contentId: "content1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(postRepository.findByContentId.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message, "Repository error");
    }
  });
});

Deno.test("GetPostsByUserIdQueryHandler", async (t) => {
  await t.step("execute - 正常系: ユーザーの投稿一覧を返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    const post1 = createMockPostAggregate("post1", "user1", "content1", "test-post-1");
    const post2 = createMockPostAggregate("post2", "user1", "content2", "test-post-2");
    
    // 投稿が存在することを設定
    postRepository.findByUserId = spy(async (userId: string, options?: { limit?: number; offset?: number; status?: string; }) => {
      if (userId === "user1") {
        return [post1, post2];
      }
      return [];
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostsByUserIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostsByUserIdQuery = {
      name: "GetPostsByUserId",
      userId: "user1",
      limit: 10,
      offset: 0,
      status: "draft"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findByUserId.calls.length, 1);
    if (result.isOk()) {
      const posts = result.value;
      assertEquals(posts.length, 2);
      assertEquals(posts[0].getPost().id, "post1");
      assertEquals(posts[1].getPost().id, "post2");
    }
  });
  
  await t.step("execute - 正常系: 投稿が存在しない場合は空配列を返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // 投稿が存在しないことを設定
    postRepository.findByUserId = spy(async (userId: string, options?: { limit?: number; offset?: number; status?: string; }) => []);
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostsByUserIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostsByUserIdQuery = {
      name: "GetPostsByUserId",
      userId: "user2"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isOk(), true);
    assertEquals(postRepository.findByUserId.calls.length, 1);
    if (result.isOk()) {
      assertEquals(result.value.length, 0);
    }
  });
  
  await t.step("execute - 異常系: リポジトリでエラーが発生した場合はエラーを返す", async () => {
    // モックの準備
    const postRepository = new MockPostRepository();
    
    // エラーが発生することを設定
    postRepository.findByUserId = spy(async (userId: string, options?: { limit?: number; offset?: number; status?: string; }) => {
      throw new Error("Repository error");
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetPostsByUserIdQueryHandler(postRepository);
    
    // クエリを作成
    const query: GetPostsByUserIdQuery = {
      name: "GetPostsByUserId",
      userId: "user1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(postRepository.findByUserId.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message, "Repository error");
    }
  });
}); 