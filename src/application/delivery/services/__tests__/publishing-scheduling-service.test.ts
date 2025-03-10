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
  ApplicationError,
  InfrastructureError,
  PostAggregate,
  createPublishStatus
} from "../../deps.ts";

import type {
  Post,
  PostRepository,
  TransactionContext,
  PublishStatusType
} from "../../deps.ts";

import { PublishingSchedulingService } from "../publishing-scheduling-service.ts";

import { DefaultPublishingSchedulingService } from "../publishing-scheduling-service.ts";

describe("DefaultPublishingSchedulingService", () => {
  class MockPostRepository implements PostRepository {
    private posts: Map<string, PostAggregate> = new Map();
    private shouldError = false;
    private error: Error | null = null;

    constructor(posts: PostAggregate[] = []) {
      posts.forEach(post => {
        this.posts.set(post.getPost().id, post);
      });
    }

    findById(id: string): Promise<PostAggregate | null> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      return Promise.resolve(this.posts.get(id) || null);
    }

    findByUserId(userId: string, options?: { limit?: number; offset?: number; status?: string; }): Promise<PostAggregate[]> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      if (options?.status === "scheduled") {
        return Promise.resolve(Array.from(this.posts.values()).filter(post => 
          post.getPost().publishStatus.type === "scheduled"
        ));
      }

      return Promise.resolve(Array.from(this.posts.values()).filter(post => post.getPost().userId === userId));
    }

    findByContentId(contentId: string): Promise<PostAggregate | null> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      return Promise.resolve(Array.from(this.posts.values()).find(post => post.getPost().contentId === contentId) || null);
    }

    save(postAggregate: PostAggregate): Promise<PostAggregate> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      this.posts.set(postAggregate.getPost().id, postAggregate);
      return Promise.resolve(postAggregate);
    }

    saveWithTransaction(
      postAggregate: PostAggregate, 
      _context: TransactionContext
    ): Promise<Result<PostAggregate, DomainError>> {
      if (this.shouldError && this.error) {
        return Promise.resolve(err(this.error as DomainError));
      }

      this.posts.set(postAggregate.getPost().id, postAggregate);
      return Promise.resolve(ok(postAggregate));
    }

    delete(id: string): Promise<boolean> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      return Promise.resolve(this.posts.delete(id));
    }

    deleteWithTransaction(
      id: string, 
      _context: TransactionContext
    ): Promise<Result<boolean, DomainError>> {
      if (this.shouldError && this.error) {
        return Promise.resolve(err(this.error as DomainError));
      }

      const result = this.posts.delete(id);
      return Promise.resolve(ok(result));
    }

    setError(error: Error) {
      this.shouldError = true;
      this.error = error;
    }

    clearError() {
      this.shouldError = false;
      this.error = null;
    }
  }

  // モックのポスト集約を作成
  const createTestPost = (id: string, userId: string, contentId: string, scheduledAt?: Date): PostAggregate => {
    // ポストエンティティを作成
    const post: Post = {
      id,
      userId,
      contentId,
      feedId: "feed-1",
      slug: "test-post",
      publishStatus: scheduledAt 
        ? createPublishStatus({ type: "scheduled", scheduledAt }) 
        : createPublishStatus({ type: "draft" }),
      createdAt: new Date(),
      updatedAt: new Date(),
      updatePublishStatus: function(statusProps) { 
        this.publishStatus = createPublishStatus(statusProps);
        return this; 
      },
      makeDraft: function() { return this; },
      schedulePublication: function() { return this; },
      publish: function() { 
        this.publishStatus = createPublishStatus({ type: "published", publishedAt: new Date() });
        return this; 
      },
      archive: function() { return this; },
      updateSlug: function() { return this; }
    };

    // ポスト集約を作成
    const postAggregate: PostAggregate = {
      post,
      saveDraft: () => postAggregate,
      schedulePublication: () => postAggregate,
      publish: () => {
        post.publish();
        return postAggregate;
      },
      archive: () => postAggregate,
      updateSlug: () => postAggregate,
      updatePublishStatus: () => postAggregate,
      getPost: () => post
    };

    return postAggregate;
  };

  let mockPostRepository: MockPostRepository;
  let service: DefaultPublishingSchedulingService;

  beforeEach(() => {
    mockPostRepository = new MockPostRepository();
    service = new DefaultPublishingSchedulingService(mockPostRepository);
  });

  it("should publish scheduled posts by date", async () => {
    // 現在時刻より前に予定されたポストを作成
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    
    const scheduledPost1 = createTestPost("post-1", "user-1", "content-1", pastDate);
    const scheduledPost2 = createTestPost("post-2", "user-2", "content-2", pastDate);
    
    // 現在時刻より後に予定されたポストを作成
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    
    const scheduledPost3 = createTestPost("post-3", "user-3", "content-3", futureDate);
    
    // 下書きのポストを作成
    const draftPost = createTestPost("post-4", "user-4", "content-4");
    
    mockPostRepository = new MockPostRepository([
      scheduledPost1, 
      scheduledPost2, 
      scheduledPost3, 
      draftPost
    ]);
    
    service = new DefaultPublishingSchedulingService(mockPostRepository);

    const result = await service.publishScheduledPostsByDate(new Date());

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(2);
      
      // 公開されたポストを確認
      const post1 = await mockPostRepository.findById("post-1");
      const post2 = await mockPostRepository.findById("post-2");
      
      expect(post1?.getPost().publishStatus.type).toBe("published");
      expect(post2?.getPost().publishStatus.type).toBe("published");
      
      // 他のポストは変更されていないことを確認
      const post3 = await mockPostRepository.findById("post-3");
      const post4 = await mockPostRepository.findById("post-4");
      
      expect(post3?.getPost().publishStatus.type).toBe("scheduled");
      expect(post4?.getPost().publishStatus.type).toBe("draft");
    }
  });

  it("should return an error if the repository fails", async () => {
    mockPostRepository.setError(new Error("Repository error"));

    const result = await service.publishScheduledPostsByDate(new Date());

    expect(result.isErr()).toBe(true);
  });
}); 