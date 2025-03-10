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
  FeedAggregate
} from "../../deps.ts";

import type {
  Feed,
  FeedRepository,
  TransactionContext,
  FeedMetadata
} from "../../deps.ts";

import { CreateFeedCommand, CreateFeedCommandHandler } from "../create-feed-command.ts";

describe("CreateFeedCommandHandler", () => {
  class MockFeedRepository implements FeedRepository {
    private feeds: Map<string, FeedAggregate> = new Map();
    private shouldError = false;
    private error: Error | null = null;

    constructor(feeds: FeedAggregate[] = []) {
      feeds.forEach(feed => {
        this.feeds.set(feed.getFeed().id, feed);
      });
    }

    findById(id: string): Promise<FeedAggregate | null> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      return Promise.resolve(this.feeds.get(id) || null);
    }

    findByUserId(userId: string, options?: { limit?: number; offset?: number; }): Promise<FeedAggregate[]> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      return Promise.resolve(Array.from(this.feeds.values()).filter(feed => feed.getFeed().userId === userId));
    }

    findByName(userId: string, name: string): Promise<FeedAggregate | null> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      return Promise.resolve(Array.from(this.feeds.values()).find(feed => 
        feed.getFeed().userId === userId && feed.getFeed().name === name
      ) || null);
    }

    save(feedAggregate: FeedAggregate): Promise<FeedAggregate> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      this.feeds.set(feedAggregate.getFeed().id, feedAggregate);
      return Promise.resolve(feedAggregate);
    }

    saveWithTransaction(
      feedAggregate: FeedAggregate, 
      _context: TransactionContext
    ): Promise<Result<FeedAggregate, DomainError>> {
      if (this.shouldError && this.error) {
        return Promise.resolve(err(this.error as DomainError));
      }

      this.feeds.set(feedAggregate.getFeed().id, feedAggregate);
      return Promise.resolve(ok(feedAggregate));
    }

    delete(id: string): Promise<boolean> {
      if (this.shouldError && this.error) {
        throw this.error;
      }

      return Promise.resolve(this.feeds.delete(id));
    }

    deleteWithTransaction(
      id: string, 
      _context: TransactionContext
    ): Promise<Result<boolean, DomainError>> {
      if (this.shouldError && this.error) {
        return Promise.resolve(err(this.error as DomainError));
      }

      const result = this.feeds.delete(id);
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

  let mockFeedRepository: MockFeedRepository;
  let handler: CreateFeedCommandHandler;

  beforeEach(() => {
    mockFeedRepository = new MockFeedRepository();
    handler = new CreateFeedCommandHandler(mockFeedRepository);
  });

  it("should create a new feed", async () => {
    const command: CreateFeedCommand = {
      name: "CreateFeed",
      userId: "user-1",
      feedName: "Test Feed",
      description: "This is a test feed",
      tags: ["test"],
      isPublic: true
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const feed = result.value.getFeed();
      expect(feed.userId).toBe("user-1");
      expect(feed.name).toBe("Test Feed");
      expect(feed.metadata.description).toBe("This is a test feed");
    }
  });

  it("should return an error if a feed with the same name already exists", async () => {
    // 既存のフィードを作成
    const existingFeed = createTestFeed("feed-1", "user-1", "Test Feed");
    mockFeedRepository = new MockFeedRepository([existingFeed]);
    handler = new CreateFeedCommandHandler(mockFeedRepository);

    const command: CreateFeedCommand = {
      name: "CreateFeed",
      userId: "user-1",
      feedName: "Test Feed",
      description: "This is a test feed",
      tags: ["test"],
      isPublic: true
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("同じ名前のフィードが既に存在します");
    }
  });

  it("should return an error if the repository fails", async () => {
    mockFeedRepository.setError(new Error("Repository error"));

    const command: CreateFeedCommand = {
      name: "CreateFeed",
      userId: "user-1",
      feedName: "Test Feed",
      description: "This is a test feed",
      tags: ["test"],
      isPublic: true
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
  });
});

// モックのフィード集約を作成
function createTestFeed(id: string, userId: string, name: string): FeedAggregate {
  // フィードエンティティを作成
  const feed: Feed = {
    id,
    userId,
    name,
    metadata: {
      type: "personal",
      description: "This is a test feed",
      language: "ja"
    },
    postIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    updateMetadata: function() { return this; },
    updateName: function() { return this; },
    addPost: function() { return this; },
    removePost: function() { return this; },
    reorderPosts: function() { return this; }
  };

  // フィード集約を作成
  const feedAggregate: FeedAggregate = {
    feed,
    updateName: () => feedAggregate,
    updateMetadata: () => feedAggregate,
    addPost: () => feedAggregate,
    removePost: () => feedAggregate,
    reorderPosts: () => feedAggregate,
    addPosts: () => feedAggregate,
    removePosts: () => feedAggregate,
    getFeed: () => feed
  };

  return feedAggregate;
} 