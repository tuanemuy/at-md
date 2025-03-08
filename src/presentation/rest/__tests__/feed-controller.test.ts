/**
 * フィードコントローラーのテスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { Hono } from "hono";
import { err, ok } from "neverthrow";

// モック
import { FeedRepository } from "../../../application/delivery/repositories/feed-repository.ts";
import { EntityNotFoundError } from "../../../core/errors/application.ts";
import { 
  FeedAggregate, 
  createFeedAggregate 
} from "../../../core/delivery/aggregates/feed-aggregate.ts";
import { createFeed } from "../../../core/delivery/entities/feed.ts";
import { createFeedMetadata } from "../../../core/delivery/value-objects/feed-metadata.ts";

// テスト対象のインターフェース
interface FeedController {
  getFeedById(c: any): Promise<Response>;
  getFeedsByUserId(c: any): Promise<Response>;
  createFeed(c: any): Promise<Response>;
}

// モッククエリハンドラーとコマンドハンドラー
interface GetFeedByIdQueryHandler {
  execute(query: { name: string; id: string }): Promise<any>;
}

interface GetFeedsByUserIdQueryHandler {
  execute(query: { name: string; userId: string; limit?: number; offset?: number }): Promise<any>;
}

interface CreateFeedCommandHandler {
  execute(command: { 
    name: string; 
    userId: string; 
    feedName: string; 
    description?: string; 
    tags?: string[]; 
    isPublic?: boolean 
  }): Promise<any>;
}

// モックフィードリポジトリ
class MockFeedRepository implements FeedRepository {
  private feeds: Map<string, FeedAggregate> = new Map();
  
  constructor() {
    // テスト用のフィードを追加
    const feed = createFeed({
      id: "feed-1",
      userId: "user-1",
      name: "テストフィード",
      metadata: createFeedMetadata({
        type: "personal",
        language: "ja"
      }),
      postIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const feedAggregate = createFeedAggregate({ feed });
    this.feeds.set(feed.id, feedAggregate);
  }
  
  async findById(id: string): Promise<FeedAggregate | null> {
    return this.feeds.get(id) || null;
  }
  
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<FeedAggregate[]> {
    const results: FeedAggregate[] = [];
    for (const feed of this.feeds.values()) {
      if (feed.feed.userId === userId) {
        results.push(feed);
      }
    }
    return results;
  }
  
  async findByName(userId: string, name: string): Promise<FeedAggregate | null> {
    for (const feed of this.feeds.values()) {
      if (feed.feed.userId === userId && feed.feed.name === name) {
        return feed;
      }
    }
    return null;
  }
  
  async save(feedAggregate: FeedAggregate): Promise<FeedAggregate> {
    this.feeds.set(feedAggregate.feed.id, feedAggregate);
    return feedAggregate;
  }
  
  async delete(id: string): Promise<boolean> {
    return this.feeds.delete(id);
  }
}

describe("FeedController", () => {
  let app: Hono;
  let feedController: FeedController;
  let mockFeedRepository: MockFeedRepository;
  let getFeedByIdQueryHandler: GetFeedByIdQueryHandler;
  let getFeedsByUserIdQueryHandler: GetFeedsByUserIdQueryHandler;
  let createFeedCommandHandler: CreateFeedCommandHandler;
  
  beforeEach(() => {
    // モックリポジトリの初期化
    mockFeedRepository = new MockFeedRepository();
    
    // クエリハンドラーの初期化
    getFeedByIdQueryHandler = {
      execute: async (query) => {
        const feed = await mockFeedRepository.findById(query.id);
        if (!feed) {
          return err(new EntityNotFoundError("Feed", query.id));
        }
        return ok(feed);
      }
    };
    
    getFeedsByUserIdQueryHandler = {
      execute: async (query) => {
        const feeds = await mockFeedRepository.findByUserId(query.userId, {
          limit: query.limit,
          offset: query.offset
        });
        return ok(feeds);
      }
    };
    
    // コマンドハンドラーの初期化
    createFeedCommandHandler = {
      execute: async (command) => {
        // 同じ名前のフィードが存在するか確認
        const existingFeed = await mockFeedRepository.findByName(command.userId, command.feedName);
        
        if (existingFeed) {
          return err(new Error(`同じ名前のフィードが既に存在します`));
        }
        
        // メタデータの作成
        const metadataProps = {
          type: "personal" as const,
          description: command.description,
          language: "ja",
        };
        
        // フィード集約の作成
        const feed = createFeed({
          id: `feed-${Date.now()}`,
          userId: command.userId,
          name: command.feedName,
          metadata: createFeedMetadata(metadataProps),
          postIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        const feedAggregate = createFeedAggregate({ feed });
        
        // フィードの保存
        const savedFeed = await mockFeedRepository.save(feedAggregate);
        
        return ok(savedFeed);
      }
    };
    
    // モックコントローラーの作成（実装前のテスト用）
    feedController = {
      async getFeedById(c) {
        const id = c.req.param("id");
        
        if (!id) {
          return c.json({ error: "フィードIDが指定されていません" }, 400);
        }
        
        const result = await getFeedByIdQueryHandler.execute({ name: "GetFeedById", id });
        
        if (result.isErr()) {
          if (result.error instanceof EntityNotFoundError) {
            return c.json({ error: result.error.message }, 404);
          }
          return c.json({ error: result.error.message }, 500);
        }
        
        return c.json(result.value.feed);
      },
      
      async getFeedsByUserId(c) {
        const userId = c.req.param("userId");
        
        if (!userId) {
          return c.json({ error: "ユーザーIDが指定されていません" }, 400);
        }
        
        const result = await getFeedsByUserIdQueryHandler.execute({ 
          name: "GetFeedsByUserId", 
          userId,
          limit: Number(c.req.query("limit")) || undefined,
          offset: Number(c.req.query("offset")) || undefined
        });
        
        if (result.isErr()) {
          return c.json({ error: result.error.message }, 500);
        }
        
        return c.json(result.value.map((feed: FeedAggregate) => feed.feed));
      },
      
      async createFeed(c) {
        try {
          const body = await c.req.json();
          
          if (!body.userId || !body.name) {
            return c.json({ error: "ユーザーIDとフィード名は必須です" }, 400);
          }
          
          const result = await createFeedCommandHandler.execute({
            name: "CreateFeed",
            userId: body.userId,
            feedName: body.name,
            description: body.description || "",
            tags: body.tags || [],
            isPublic: body.isPublic !== undefined ? body.isPublic : false
          });
          
          if (result.isErr()) {
            return c.json({ error: result.error.message }, 400);
          }
          
          return c.json(result.value.feed, 201);
        } catch (error) {
          return c.json({ error: "リクエストの解析に失敗しました" }, 400);
        }
      }
    };
    
    // Honoアプリの初期化
    app = new Hono();
    app.get("/feeds/:id", (c) => feedController.getFeedById(c));
    app.get("/users/:userId/feeds", (c) => feedController.getFeedsByUserId(c));
    app.post("/feeds", (c) => feedController.createFeed(c));
  });
  
  describe("getFeedById", () => {
    it("存在するIDの場合、フィードを返すこと", async () => {
      // リクエストの実行
      const res = await app.request("/feeds/feed-1");
      
      // レスポンスの検証
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.id).toBe("feed-1");
      expect(body.name).toBe("テストフィード");
    });
    
    it("存在しないIDの場合、404エラーを返すこと", async () => {
      // リクエストの実行
      const res = await app.request("/feeds/non-existent-id");
      
      // レスポンスの検証
      expect(res.status).toBe(404);
      
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });
  
  describe("getFeedsByUserId", () => {
    it("ユーザーIDに一致するフィードを返すこと", async () => {
      // リクエストの実行
      const res = await app.request("/users/user-1/feeds");
      
      // レスポンスの検証
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(body[0].id).toBe("feed-1");
      expect(body[0].name).toBe("テストフィード");
    });
    
    it("存在しないユーザーIDの場合、空配列を返すこと", async () => {
      // リクエストの実行
      const res = await app.request("/users/non-existent-user/feeds");
      
      // レスポンスの検証
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });
  });
  
  describe("createFeed", () => {
    it("有効なデータの場合、フィードを作成して返すこと", async () => {
      // リクエストデータ
      const requestData = {
        userId: "user-1",
        name: "新しいフィード",
        description: "新しく作成されたフィードです。",
        tags: ["new", "feed"],
        isPublic: true
      };
      
      // リクエストの実行
      const res = await app.request("/feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      // レスポンスの検証
      expect(res.status).toBe(201);
      
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.name).toBe("新しいフィード");
    });
    
    it("既存の名前の場合、エラーを返すこと", async () => {
      // リクエストデータ（既存の名前を使用）
      const requestData = {
        userId: "user-1",
        name: "テストフィード", // 既存の名前
        description: "既存の名前を使用したフィードです。",
        tags: ["duplicate"],
        isPublic: true
      };
      
      // リクエストの実行
      const res = await app.request("/feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      // レスポンスの検証
      expect(res.status).toBe(400);
      
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
    
    it("必須フィールドが欠けている場合、エラーを返すこと", async () => {
      // 必須フィールドが欠けているリクエストデータ
      const requestData = {
        // userIdが欠けている
        name: "不完全なフィード",
        description: "必須フィールドが欠けているフィードです。",
        isPublic: true
      };
      
      // リクエストの実行
      const res = await app.request("/feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      // レスポンスの検証
      expect(res.status).toBe(400);
      
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });
}); 