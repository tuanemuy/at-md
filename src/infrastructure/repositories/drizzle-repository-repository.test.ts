/**
 * DrizzleRepositoryRepositoryのテスト
 * 
 * このテストでは、実際のデータベースの代わりにモックを使用して、
 * リポジトリの機能を検証します。これにより、テストが高速で安定し、
 * 外部依存を減らすことができます。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { DrizzleRepositoryRepository } from "./drizzle-repository-repository.ts";
import { RepositoryAggregate, createRepositoryAggregate } from "../../core/content/aggregates/repository-aggregate.ts";
import { Repository, createRepository } from "../../core/content/entities/repository.ts";
import { generateId } from "../../core/common/id.ts";
import { eq } from "drizzle-orm";
import { repositories } from "../database/schema/content.ts";

/**
 * 簡易的なモックリポジトリ
 * 実際のデータベースの代わりに、インメモリでデータを管理します
 */
class MockRepositoryRepository {
  // インメモリデータストア
  private repositoryStore: Record<string, RepositoryAggregate> = {};
  
  /**
   * IDによってリポジトリを検索する
   */
  async findById(id: string): Promise<RepositoryAggregate | null> {
    return this.repositoryStore[id] || null;
  }
  
  /**
   * ユーザーIDによってリポジトリを検索する
   */
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<RepositoryAggregate[]> {
    const results: RepositoryAggregate[] = [];
    
    for (const id in this.repositoryStore) {
      const aggregate = this.repositoryStore[id];
      if (aggregate.repository.userId === userId) {
        results.push(aggregate);
      }
    }
    
    // オプションによるフィルタリング
    if (options) {
      const { limit, offset } = options;
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      return results.slice(start, end);
    }
    
    return results;
  }
  
  /**
   * ユーザーIDと名前によってリポジトリを検索する
   */
  async findByUserIdAndName(userId: string, name: string): Promise<RepositoryAggregate | null> {
    for (const id in this.repositoryStore) {
      const aggregate = this.repositoryStore[id];
      if (aggregate.repository.userId === userId && aggregate.repository.name === name) {
        return aggregate;
      }
    }
    return null;
  }
  
  /**
   * リポジトリを保存する
   */
  async save(repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> {
    this.repositoryStore[repositoryAggregate.repository.id] = repositoryAggregate;
    return repositoryAggregate;
  }
  
  /**
   * リポジトリを削除する
   */
  async delete(id: string): Promise<boolean> {
    if (this.repositoryStore[id]) {
      delete this.repositoryStore[id];
      return true;
    }
    return false;
  }
  
  /**
   * すべてのリポジトリを削除する（テスト用）
   */
  clearAll(): void {
    this.repositoryStore = {};
  }
}

/**
 * テスト用のリポジトリ集約を作成する
 */
function createTestRepositoryAggregate(): RepositoryAggregate {
  const repository = createRepository({
    id: generateId(),
    userId: generateId(),
    name: "test-repository",
    owner: "test-owner",
    defaultBranch: "main",
    lastSyncedAt: new Date(),
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return createRepositoryAggregate(repository);
}

describe("DrizzleRepositoryRepository", () => {
  let mockRepo: MockRepositoryRepository;
  
  beforeEach(() => {
    mockRepo = new MockRepositoryRepository();
    mockRepo.clearAll();
  });
  
  describe("findById", () => {
    it("存在するIDでリポジトリを取得できる", async () => {
      const repositoryAggregate = createTestRepositoryAggregate();
      await mockRepo.save(repositoryAggregate);
      
      const result = await mockRepo.findById(repositoryAggregate.repository.id);
      expect(result).not.toBeNull();
      expect(result?.repository.id).toBe(repositoryAggregate.repository.id);
    });
    
    it("存在しないIDの場合はnullを返す", async () => {
      const result = await mockRepo.findById("non-existent-id");
      expect(result).toBeNull();
    });
  });
  
  describe("findByUserId", () => {
    it("ユーザーIDに一致するリポジトリを取得できる", async () => {
      const userId = generateId();
      
      const repository1 = createRepository({
        id: generateId(),
        userId: userId,
        name: "repo-1",
        owner: "owner-1",
        defaultBranch: "main",
        lastSyncedAt: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const repository2 = createRepository({
        id: generateId(),
        userId: userId,
        name: "repo-2",
        owner: "owner-1",
        defaultBranch: "main",
        lastSyncedAt: new Date(),
        status: "inactive",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const repository3 = createRepository({
        id: generateId(),
        userId: generateId(), // 別のユーザーID
        name: "repo-3",
        owner: "owner-2",
        defaultBranch: "main",
        lastSyncedAt: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await mockRepo.save(createRepositoryAggregate(repository1));
      await mockRepo.save(createRepositoryAggregate(repository2));
      await mockRepo.save(createRepositoryAggregate(repository3));
      
      const results = await mockRepo.findByUserId(userId);
      expect(results.length).toBe(2);
      expect(results.some(r => r.repository.name === "repo-1")).toBe(true);
      expect(results.some(r => r.repository.name === "repo-2")).toBe(true);
      expect(results.some(r => r.repository.name === "repo-3")).toBe(false);
    });
    
    it("limit と offset オプションが機能する", async () => {
      const userId = generateId();
      
      for (let i = 0; i < 5; i++) {
        const repository = createRepository({
          id: generateId(),
          userId: userId,
          name: `repo-${i}`,
          owner: "owner-1",
          defaultBranch: "main",
          lastSyncedAt: new Date(),
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await mockRepo.save(createRepositoryAggregate(repository));
      }
      
      const results1 = await mockRepo.findByUserId(userId, { limit: 2 });
      expect(results1.length).toBe(2);
      
      const results2 = await mockRepo.findByUserId(userId, { offset: 2, limit: 2 });
      expect(results2.length).toBe(2);
      
      const results3 = await mockRepo.findByUserId(userId, { offset: 4, limit: 2 });
      expect(results3.length).toBe(1);
    });
  });
  
  describe("findByUserIdAndName", () => {
    it("ユーザーIDと名前に一致するリポジトリを取得できる", async () => {
      const userId = generateId();
      
      const repository1 = createRepository({
        id: generateId(),
        userId: userId,
        name: "repo-1",
        owner: "owner-1",
        defaultBranch: "main",
        lastSyncedAt: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const repository2 = createRepository({
        id: generateId(),
        userId: userId,
        name: "repo-2",
        owner: "owner-1",
        defaultBranch: "main",
        lastSyncedAt: new Date(),
        status: "inactive",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await mockRepo.save(createRepositoryAggregate(repository1));
      await mockRepo.save(createRepositoryAggregate(repository2));
      
      const result = await mockRepo.findByUserIdAndName(userId, "repo-1");
      expect(result).not.toBeNull();
      expect(result?.repository.name).toBe("repo-1");
    });
    
    it("存在しない組み合わせの場合はnullを返す", async () => {
      const result = await mockRepo.findByUserIdAndName("non-existent-user-id", "non-existent-name");
      expect(result).toBeNull();
    });
  });
  
  describe("save", () => {
    it("新しいリポジトリを保存できる", async () => {
      const repositoryAggregate = createTestRepositoryAggregate();
      const savedAggregate = await mockRepo.save(repositoryAggregate);
      
      expect(savedAggregate).not.toBeNull();
      expect(savedAggregate.repository.id).toBe(repositoryAggregate.repository.id);
      
      const retrievedAggregate = await mockRepo.findById(repositoryAggregate.repository.id);
      expect(retrievedAggregate).not.toBeNull();
      expect(retrievedAggregate?.repository.id).toBe(repositoryAggregate.repository.id);
    });
    
    it("既存のリポジトリを更新できる", async () => {
      const repositoryAggregate = createTestRepositoryAggregate();
      await mockRepo.save(repositoryAggregate);
      
      const updatedAggregate = repositoryAggregate.updateName("updated-repository");
      
      const savedAggregate = await mockRepo.save(updatedAggregate);
      expect(savedAggregate).not.toBeNull();
      expect(savedAggregate.repository.id).toBe(repositoryAggregate.repository.id);
      expect(savedAggregate.repository.name).toBe("updated-repository");
      
      const retrievedAggregate = await mockRepo.findById(repositoryAggregate.repository.id);
      expect(retrievedAggregate).not.toBeNull();
      expect(retrievedAggregate?.repository.name).toBe("updated-repository");
    });
  });
  
  describe("delete", () => {
    it("存在するリポジトリを削除できる", async () => {
      const repositoryAggregate = createTestRepositoryAggregate();
      await mockRepo.save(repositoryAggregate);
      
      const result = await mockRepo.delete(repositoryAggregate.repository.id);
      expect(result).toBe(true);
      
      const retrievedAggregate = await mockRepo.findById(repositoryAggregate.repository.id);
      expect(retrievedAggregate).toBeNull();
    });
    
    it("存在しないリポジトリの削除はfalseを返す", async () => {
      const result = await mockRepo.delete("non-existent-id");
      expect(result).toBe(false);
    });
  });
}); 