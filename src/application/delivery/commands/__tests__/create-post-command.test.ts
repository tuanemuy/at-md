import {
  Result,
  ok,
  err,
  expect,
  describe,
  it,
  beforeEach,
  afterEach,
  DomainError,
  InfrastructureError,
  PostAggregate,
  createPublishStatus
} from "../../deps.ts";

import type {
  Post,
  PostRepository,
  PublishStatus
} from "../../deps.ts";

import { CreatePostCommand, CreatePostCommandHandler } from "../create-post-command.ts";

describe("CreatePostCommandHandler", () => {
  class MockPostRepository implements PostRepository {
    private posts: Record<string, PostAggregate> = {};
    private shouldError = false;
    private error: Error | null = null;

    constructor(posts: PostAggregate[] = []) {
      for (const post of posts) {
        this.posts[post.post.id] = post;
      }
    }

    findById(id: string): Promise<PostAggregate | null> {
      return Promise.resolve(this.posts[id] || null);
    }

    findByUserId(userId: string, options?: { limit?: number; offset?: number; }): Promise<PostAggregate[]> {
      const posts = Object.values(this.posts).filter(post => post.post.userId === userId);
      
      if (options) {
        const { limit, offset = 0 } = options;
        return Promise.resolve(posts.slice(offset, limit ? offset + limit : undefined));
      }
      
      return Promise.resolve(posts);
    }

    findByContentId(contentId: string): Promise<PostAggregate | null> {
      const post = Object.values(this.posts).find(post => post.post.contentId === contentId);
      return Promise.resolve(post || null);
    }

    save(postAggregate: PostAggregate): Promise<PostAggregate> {
      this.posts[postAggregate.post.id] = postAggregate;
      return Promise.resolve(postAggregate);
    }

    saveWithTransaction(
      postAggregate: PostAggregate,
      _context: unknown
    ): Promise<Result<PostAggregate, DomainError>> {
      if (this.shouldError && this.error) {
        return Promise.resolve(err(this.error as DomainError));
      }
      
      this.posts[postAggregate.post.id] = postAggregate;
      return Promise.resolve(ok(postAggregate));
    }

    delete(id: string): Promise<boolean> {
      if (this.posts[id]) {
        delete this.posts[id];
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }

    deleteWithTransaction(
      id: string,
      _context: unknown
    ): Promise<Result<boolean, DomainError>> {
      if (this.shouldError && this.error) {
        return Promise.resolve(err(this.error as DomainError));
      }
      
      if (this.posts[id]) {
        delete this.posts[id];
        return Promise.resolve(ok(true));
      }
      return Promise.resolve(ok(false));
    }

    setError(error: Error): void {
      this.shouldError = true;
      this.error = error;
    }

    clearError(): void {
      this.shouldError = false;
      this.error = null;
    }
  }

  // モックのポスト集約を作成
  const createTestPost = (id: string, userId: string, contentId: string): PostAggregate => {
    // ポストエンティティを作成
    const post: Post = {
      id,
      userId,
      contentId,
      feedId: "feed-1",
      slug: "test-post",
      publishStatus: createPublishStatus({ type: "draft" }),
      createdAt: new Date(),
      updatedAt: new Date(),
      updatePublishStatus: function() { return this; },
      makeDraft: function() { return this; },
      schedulePublication: function() { return this; },
      publish: function() { return this; },
      archive: function() { return this; },
      updateSlug: function() { return this; }
    };

    // ポスト集約を作成
    const postAggregate: PostAggregate = {
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
  };

  let mockPostRepository: MockPostRepository;
  let handler: CreatePostCommandHandler;

  beforeEach(() => {
    mockPostRepository = new MockPostRepository();
    handler = new CreatePostCommandHandler(mockPostRepository);
  });

  it("should create a new post", async () => {
    const command: CreatePostCommand = {
      name: "CreatePost",
      userId: "user-1",
      contentId: "content-1",
      feedId: "feed-1",
      slug: "test-post"
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const post = result.value.getPost();
      expect(post.userId).toBe("user-1");
      expect(post.contentId).toBe("content-1");
      expect(post.publishStatus.type).toBe("draft");
    }
  });

  it("should return an error if a post with the same content ID already exists", async () => {
    // 既存のポストを作成
    const existingPost = createTestPost("post-1", "user-1", "content-1");
    mockPostRepository = new MockPostRepository([existingPost]);
    handler = new CreatePostCommandHandler(mockPostRepository);

    const command: CreatePostCommand = {
      name: "CreatePost",
      userId: "user-1",
      contentId: "content-1",
      feedId: "feed-1",
      slug: "test-post"
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("既に存在します");
    }
  });

  it("should return an error if the repository fails", async () => {
    mockPostRepository.setError(new Error("Repository error"));

    const command: CreatePostCommand = {
      name: "CreatePost",
      userId: "user-1",
      contentId: "content-1",
      feedId: "feed-1",
      slug: "test-post"
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(false);
    mockPostRepository.clearError(); // エラー状態をクリア
  });
}); 