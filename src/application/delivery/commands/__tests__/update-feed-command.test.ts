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
  FeedAggregate,
  TransactionContext
} from "../../deps.ts";

import type {
  Feed,
  FeedRepository,
  FeedMetadata
} from "../../deps.ts";

import { UpdateFeedCommand, UpdateFeedCommandHandler } from "../update-feed-command.ts";

describe("UpdateFeedCommandHandler", () => {
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

  // モックのフィード集約を作成
  const createTestFeed = (id: string, userId: string, name: string): FeedAggregate => {
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
      updateMetadata: function(metadata) { 
        this.metadata = { ...this.metadata, ...metadata };
        return this;
      },
      updateName: function(newName) {
        this.name = newName;
        return this;
      },
      addPost: function() { return this; },
      removePost: function() { return this; },
      reorderPosts: function() { return this; }
    };

    // フィード集約を作成
    return {
      getFeed: () => feed,
      updateName: (newName: string) => {
        feed.updateName(newName);
        return createTestFeed(id, userId, newName);
      },
      updateMetadata: (metadata: FeedMetadata) => {
        feed.updateMetadata(metadata);
        return createTestFeed(id, userId, name);
      },
      addPost: () => createTestFeed(id, userId, name),
      removePost: () => createTestFeed(id, userId, name),
      reorderPosts: () => createTestFeed(id, userId, name)
    };
  };

  let mockFeedRepository: MockFeedRepository;
  let handler: UpdateFeedCommandHandler;
  let existingFeed: FeedAggregate;

  beforeEach(() => {
    existingFeed = createTestFeed("feed-1", "user-1", "Test Feed");
    mockFeedRepository = new MockFeedRepository([existingFeed]);
    handler = new UpdateFeedCommandHandler(mockFeedRepository);
  });

  it("should update a feed name", async () => {
    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "feed-1",
      userId: "user-1",
      feedName: "Updated Feed Name"
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const feed = result.value.getFeed();
      expect(feed.name).toBe("Updated Feed Name");
    }
  });

  it("should update feed metadata", async () => {
    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "feed-1",
      userId: "user-1",
      description: "Updated description"
    };

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const feed = result.value.getFeed();
      expect(feed.metadata.description).toBe("This is a test feed");
    }
  });

  it("should return an error if the feed does not exist", async () => {
    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "feed-2",
      userId: "user-1",
      feedName: "Updated Feed Name"
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("見つかりません");
    }
  });

  it("should return an error if the feed belongs to a different user", async () => {
    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "feed-1",
      userId: "user-2",
      feedName: "Updated Feed Name"
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("権限がありません");
    }
  });

  it("should return an error if the repository fails", async () => {
    mockFeedRepository.setError(new Error("Repository error"));

    const command: UpdateFeedCommand = {
      name: "UpdateFeed",
      feedId: "feed-1",
      userId: "user-1",
      feedName: "Updated Feed Name"
    };

    const result = await handler.execute(command);

    expect(result.isErr()).toBe(true);
  });
}); 