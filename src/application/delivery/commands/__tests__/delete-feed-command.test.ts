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

import { DeleteFeedCommand, DeleteFeedCommandHandler } from "../delete-feed-command.ts";

describe("DeleteFeedCommandHandler", () => {
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

  const createTestFeed = (id: string): FeedAggregate => {
    const feed: Feed = {
      id,
      userId: "user-1",
      name: "Test Feed",
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
  };

  let mockFeedRepository: MockFeedRepository;
  let handler: DeleteFeedCommandHandler;

  beforeEach(() => {
    const feed1 = createTestFeed("feed-1");
    const feed2 = createTestFeed("feed-2");
    mockFeedRepository = new MockFeedRepository([feed1, feed2]);
    handler = new DeleteFeedCommandHandler(mockFeedRepository);
  });

  it("should delete a feed", async () => {
    const command: DeleteFeedCommand = {
      name: "DeleteFeed",
      feedId: "feed-1",
      userId: "user-1",
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    
    const feed = await mockFeedRepository.findById("feed-1");
    expect(feed).toBe(null);
  });

  it("should return an error if the feed does not exist", async () => {
    const command: DeleteFeedCommand = {
      name: "DeleteFeed",
      feedId: "feed-3",
      userId: "user-1",
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("見つかりません");
    }
  });

  it("should return an error if the feed belongs to a different user", async () => {
    const command: DeleteFeedCommand = {
      name: "DeleteFeed",
      feedId: "feed-1",
      userId: "user-2",
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("権限がありません");
    }
  });

  it("should return an error if the repository fails", async () => {
    mockFeedRepository.setError(new Error("Repository error"));

    const command: DeleteFeedCommand = {
      name: "DeleteFeed",
      feedId: "feed-1",
      userId: "user-1",
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
  });
}); 