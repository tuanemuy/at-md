/**
 * コンテンツコントローラーのテスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { Hono } from "hono";
import { err, ok } from "neverthrow";

// モック
import { ContentRepository } from "../../../application/content/repositories/content-repository.ts";
import { RepositoryRepository } from "../../../application/content/repositories/repository-repository.ts";
import { GetContentByIdQueryHandler } from "../../../application/content/queries/get-content-by-id-query.ts";
import { CreateContentCommandHandler } from "../../../application/content/commands/create-content-command.ts";
import { EntityNotFoundError } from "../../../core/errors/application.ts";
import { 
  ContentAggregate, 
  createContentAggregate 
} from "../../../core/content/aggregates/content-aggregate.ts";
import { createContent } from "../../../core/content/entities/content.ts";
import { createContentMetadata } from "../../../core/content/value-objects/content-metadata.ts";
import { RepositoryAggregate } from "../../../core/content/aggregates/repository-aggregate.ts";

// テスト対象
import { ContentController } from "../controllers/content-controller.ts";

// モックコンテンツリポジトリ
class MockContentRepository implements ContentRepository {
  private contents: Map<string, ContentAggregate> = new Map();
  
  constructor() {
    // テスト用のコンテンツを追加
    const content = createContent({
      id: "content-1",
      userId: "user-1",
      repositoryId: "repo-1",
      path: "test/path.md",
      title: "テストコンテンツ",
      body: "# テストコンテンツ\n\nこれはテスト用のコンテンツです。",
      metadata: createContentMetadata({
        tags: ["test", "markdown"],
        categories: [],
        language: "ja"
      }),
      versions: [],
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const contentAggregate = createContentAggregate(content);
    this.contents.set(content.id, contentAggregate);
  }
  
  async findById(id: string): Promise<ContentAggregate | null> {
    return this.contents.get(id) || null;
  }
  
  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null> {
    for (const content of this.contents.values()) {
      if (content.content.repositoryId === repositoryId && content.content.path === path) {
        return content;
      }
    }
    return null;
  }
  
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const results: ContentAggregate[] = [];
    for (const content of this.contents.values()) {
      if (content.content.userId === userId) {
        results.push(content);
      }
    }
    return results;
  }
  
  async findByRepositoryId(repositoryId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const results: ContentAggregate[] = [];
    for (const content of this.contents.values()) {
      if (content.content.repositoryId === repositoryId) {
        results.push(content);
      }
    }
    return results;
  }
  
  async save(contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    this.contents.set(contentAggregate.content.id, contentAggregate);
    return contentAggregate;
  }
  
  async delete(id: string): Promise<boolean> {
    return this.contents.delete(id);
  }
}

// モックリポジトリリポジトリ
class MockRepositoryRepository implements RepositoryRepository {
  async findById(id: string): Promise<RepositoryAggregate | null> {
    if (id === "repo-1") {
      // 実際のRepositoryAggregateを返す代わりに、モックオブジェクトを返す
      return { 
        repository: { 
          id: "repo-1", 
          name: "テストリポジトリ",
          userId: "user-1",
          owner: "testuser",
          defaultBranch: "main",
          lastSyncedAt: new Date(),
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      } as unknown as RepositoryAggregate;
    }
    return null;
  }
  
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<RepositoryAggregate[]> {
    if (userId === "user-1") {
      return [
        { 
          repository: { 
            id: "repo-1", 
            name: "テストリポジトリ",
            userId: "user-1",
            owner: "testuser",
            defaultBranch: "main",
            lastSyncedAt: new Date(),
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date()
          } 
        } as unknown as RepositoryAggregate
      ];
    }
    return [];
  }
  
  async findByName(userId: string, name: string): Promise<RepositoryAggregate | null> {
    if (userId === "user-1" && name === "テストリポジトリ") {
      return { 
        repository: { 
          id: "repo-1", 
          name: "テストリポジトリ",
          userId: "user-1",
          owner: "testuser",
          defaultBranch: "main",
          lastSyncedAt: new Date(),
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      } as unknown as RepositoryAggregate;
    }
    return null;
  }
  
  async save(repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> {
    return repositoryAggregate;
  }
  
  async delete(id: string): Promise<boolean> {
    return true;
  }
}

describe("ContentController", () => {
  let app: Hono;
  let contentController: ContentController;
  let mockContentRepository: MockContentRepository;
  let mockRepositoryRepository: MockRepositoryRepository;
  let getContentByIdQueryHandler: GetContentByIdQueryHandler;
  let createContentCommandHandler: CreateContentCommandHandler;
  
  beforeEach(() => {
    // モックリポジトリの初期化
    mockContentRepository = new MockContentRepository();
    mockRepositoryRepository = new MockRepositoryRepository();
    
    // クエリハンドラーの初期化
    getContentByIdQueryHandler = new GetContentByIdQueryHandler(mockContentRepository);
    
    // コマンドハンドラーの初期化
    createContentCommandHandler = new CreateContentCommandHandler(
      mockContentRepository,
      mockRepositoryRepository
    );
    
    // コントローラーの初期化
    contentController = new ContentController(
      getContentByIdQueryHandler,
      createContentCommandHandler
    );
    
    // Honoアプリの初期化
    app = new Hono();
    app.get("/contents/:id", (c) => contentController.getContentById(c));
    app.post("/contents", (c) => contentController.createContent(c));
  });
  
  describe("getContentById", () => {
    it("存在するIDの場合、コンテンツを返すこと", async () => {
      // リクエストの実行
      const res = await app.request("/contents/content-1");
      
      // レスポンスの検証
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.id).toBe("content-1");
      expect(body.title).toBe("テストコンテンツ");
      expect(body.path).toBe("test/path.md");
    });
    
    it("存在しないIDの場合、404エラーを返すこと", async () => {
      // リクエストの実行
      const res = await app.request("/contents/non-existent-id");
      
      // レスポンスの検証
      expect(res.status).toBe(404);
      
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });
  
  describe("createContent", () => {
    it("有効なデータの場合、コンテンツを作成して返すこと", async () => {
      // リクエストデータ
      const requestData = {
        userId: "user-1",
        repositoryId: "repo-1",
        path: "new/content.md",
        title: "新しいコンテンツ",
        body: "# 新しいコンテンツ\n\nこれは新しく作成されたコンテンツです。",
        metadata: {
          tags: ["new", "content"],
          categories: [],
          language: "ja"
        }
      };
      
      // リクエストの実行
      const res = await app.request("/contents", {
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
      expect(body.title).toBe("新しいコンテンツ");
      expect(body.path).toBe("new/content.md");
    });
    
    it("既存のパスの場合、エラーを返すこと", async () => {
      // リクエストデータ（既存のパスを使用）
      const requestData = {
        userId: "user-1",
        repositoryId: "repo-1",
        path: "test/path.md", // 既存のパス
        title: "重複コンテンツ",
        body: "# 重複コンテンツ\n\nこれは既存のパスに作成しようとしたコンテンツです。",
        metadata: {
          tags: ["duplicate"],
          categories: [],
          language: "ja"
        }
      };
      
      // リクエストの実行
      const res = await app.request("/contents", {
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
        userId: "user-1",
        // repositoryIdが欠けている
        path: "new/content.md",
        title: "不完全なコンテンツ",
        body: "# 不完全なコンテンツ",
        metadata: {
          language: "ja"
        }
      };
      
      // リクエストの実行
      const res = await app.request("/contents", {
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