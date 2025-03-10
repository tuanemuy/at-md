/**
 * DrizzleRepositoryRepositoryのテスト
 * 
 * このテストでは、実際のデータベースの代わりにモックを使用して、
 * リポジトリの機能を検証します。これにより、テストが高速で安定し、
 * 外部依存を減らすことができます。
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { beforeEach, describe, it } from "https://deno.land/std/testing/bdd.ts";

import {
  Result,
  ok,
  err,
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  generateId,
  type RepositoryAggregate,
  type Repository,
  createRepositoryAggregate,
  type RepositoryRepository,
  repositories,
  db
} from "./__tests__/deps.ts";

import { DrizzleRepositoryRepository } from "./drizzle-repository-repository.ts";
import { eq } from "drizzle-orm";

/**
 * 簡易的なモックリポジトリ
 * 実際のデータベースの代わりに、インメモリでデータを管理します
 */
class MockRepositoryRepository implements RepositoryRepository {
  // インメモリデータストア
  private repositoryStore: Record<string, RepositoryAggregate> = {};
  
  /**
   * IDによってリポジトリを検索する
   */
  findById(id: string): Promise<RepositoryAggregate | null> {
    return Promise.resolve(this.repositoryStore[id] || null);
  }
  
  /**
   * ユーザーIDによってリポジトリを検索する
   */
  findByUserId(userId: string, options?: {
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
      return Promise.resolve(results.slice(start, end));
    }
    
    return Promise.resolve(results);
  }
  
  /**
   * ユーザーIDと名前によってリポジトリを検索する
   */
  findByName(userId: string, name: string): Promise<RepositoryAggregate | null> {
    for (const id in this.repositoryStore) {
      const aggregate = this.repositoryStore[id];
      if (aggregate.repository.userId === userId && aggregate.repository.name === name) {
        return Promise.resolve(aggregate);
      }
    }
    return Promise.resolve(null);
  }
  
  /**
   * リポジトリを保存する
   */
  save(repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> {
    this.repositoryStore[repositoryAggregate.repository.id] = repositoryAggregate;
    return Promise.resolve(repositoryAggregate);
  }
  
  /**
   * リポジトリを削除する
   */
  delete(id: string): Promise<boolean> {
    if (this.repositoryStore[id]) {
      delete this.repositoryStore[id];
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
  
  saveWithTransaction(repositoryAggregate: RepositoryAggregate, _context: unknown): Promise<Result<RepositoryAggregate, DomainError>> {
    this.repositoryStore[repositoryAggregate.repository.id] = repositoryAggregate;
    return Promise.resolve(ok(repositoryAggregate));
  }
  
  deleteWithTransaction(id: string, _context: unknown): Promise<Result<boolean, DomainError>> {
    if (this.repositoryStore[id]) {
      delete this.repositoryStore[id];
      return Promise.resolve(ok(true));
    }
    return Promise.resolve(ok(false));
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
  let repository: RepositoryRepository;
  let testRepositoryId: string;
  
  beforeEach(async () => {
    // テスト用リポジトリの作成
    repository = new DrizzleRepositoryRepository(db);
    
    // テストデータのクリーンアップ
    await db.delete(repositories).execute();
    
    // テスト用リポジトリIDの生成
    testRepositoryId = generateId();
  });
  
  describe("findById", () => {
    it("存在するリポジトリを取得できる", async () => {
      // テスト用リポジトリの作成
      const repositoryAggregate = createRepositoryAggregate({
        id: testRepositoryId,
        userId: "test-user-id",
        name: "テストリポジトリ",
        description: "これはテストリポジトリです。",
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // リポジトリの保存
      await repository.save(repositoryAggregate);
      
      // リポジトリの取得
      const result = await repository.findById(testRepositoryId);
      
      // 検証
      assertEquals(result?.repository.id, testRepositoryId);
      assertEquals(result?.repository.name, "テストリポジトリ");
      assertEquals(result?.repository.description, "これはテストリポジトリです。");
      assertEquals(result?.repository.isPublic, true);
    });
    
    it("存在しないリポジトリIDの場合はnullを返す", async () => {
      const result = await repository.findById("non-existent-id");
      assertEquals(result, null);
    });
  });
  
  describe("findByUserId", () => {
    it("ユーザーIDに一致するリポジトリを取得できる", async () => {
      const userId = "test-user-id";
      
      // テスト用リポジトリの作成
      const repositoryAggregate1 = createRepositoryAggregate({
        id: testRepositoryId,
        userId: userId,
        name: "テストリポジトリ1",
        description: "これはテストリポジトリ1です。",
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const repositoryAggregate2 = createRepositoryAggregate({
        id: generateId(),
        userId: userId,
        name: "テストリポジトリ2",
        description: "これはテストリポジトリ2です。",
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // リポジトリの保存
      await repository.save(repositoryAggregate1);
      await repository.save(repositoryAggregate2);
      
      // ユーザーIDでリポジトリを検索
      const results = await repository.findByUserId(userId);
      
      // 検証
      assertEquals(results.length, 2);
      assertEquals(results.some(r => r.repository.name === "テストリポジトリ1"), true);
      assertEquals(results.some(r => r.repository.name === "テストリポジトリ2"), true);
    });
    
    it("存在しないユーザーIDの場合は空配列を返す", async () => {
      const results = await repository.findByUserId("non-existent-user-id");
      assertEquals(results.length, 0);
    });
  });
  
  describe("save", () => {
    it("新しいリポジトリを保存できる", async () => {
      // テスト用リポジトリの作成
      const repositoryAggregate = createRepositoryAggregate({
        id: testRepositoryId,
        userId: "test-user-id",
        name: "新しいリポジトリ",
        description: "これは新しいリポジトリです。",
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // リポジトリの保存
      const savedRepository = await repository.save(repositoryAggregate);
      
      // 検証
      assertEquals(savedRepository.repository.id, testRepositoryId);
      assertEquals(savedRepository.repository.name, "新しいリポジトリ");
      assertEquals(savedRepository.repository.description, "これは新しいリポジトリです。");
      assertEquals(savedRepository.repository.isPublic, true);
      
      // データベースから直接取得して検証
      const [dbRepository] = await db.select().from(repositories).where(eq(repositories.id, testRepositoryId)).execute();
      assertEquals(dbRepository.id, testRepositoryId);
      assertEquals(dbRepository.name, "新しいリポジトリ");
      assertEquals(dbRepository.description, "これは新しいリポジトリです。");
      assertEquals(dbRepository.isPublic, 1); // SQLiteではbooleanは0/1で保存される
    });
    
    it("既存のリポジトリを更新できる", async () => {
      // テスト用リポジトリの作成と保存
      const repositoryAggregate = createRepositoryAggregate({
        id: testRepositoryId,
        userId: "test-user-id",
        name: "更新前リポジトリ",
        description: "これは更新前のリポジトリです。",
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await repository.save(repositoryAggregate);
      
      // リポジトリ情報の更新
      const updatedRepositoryAggregate = repositoryAggregate.updateName("更新後リポジトリ");
      const updatedRepositoryAggregate2 = updatedRepositoryAggregate.updateDescription("これは更新後のリポジトリです。");
      const updatedRepositoryAggregate3 = updatedRepositoryAggregate2.updateIsPublic(true);
      
      const savedRepository = await repository.save(updatedRepositoryAggregate3);
      
      // 検証
      assertEquals(savedRepository.repository.id, testRepositoryId);
      assertEquals(savedRepository.repository.name, "更新後リポジトリ");
      assertEquals(savedRepository.repository.description, "これは更新後のリポジトリです。");
      assertEquals(savedRepository.repository.isPublic, true);
      
      // データベースから直接取得して検証
      const [dbRepository] = await db.select().from(repositories).where(eq(repositories.id, testRepositoryId)).execute();
      assertEquals(dbRepository.id, testRepositoryId);
      assertEquals(dbRepository.name, "更新後リポジトリ");
      assertEquals(dbRepository.description, "これは更新後のリポジトリです。");
      assertEquals(dbRepository.isPublic, 1); // SQLiteではbooleanは0/1で保存される
    });
  });
  
  describe("delete", () => {
    it("リポジトリを削除できる", async () => {
      // テスト用リポジトリの作成と保存
      const repositoryAggregate = createRepositoryAggregate({
        id: testRepositoryId,
        userId: "test-user-id",
        name: "削除対象リポジトリ",
        description: "これは削除対象のリポジトリです。",
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await repository.save(repositoryAggregate);
      
      // 削除前に存在することを確認
      const beforeDelete = await repository.findById(testRepositoryId);
      assertEquals(beforeDelete !== null, true);
      
      // リポジトリの削除
      const result = await repository.delete(testRepositoryId);
      assertEquals(result, true);
      
      // 削除後に存在しないことを確認
      const afterDelete = await repository.findById(testRepositoryId);
      assertEquals(afterDelete, null);
    });
    
    it("存在しないリポジトリIDの場合はfalseを返す", async () => {
      const result = await repository.delete("non-existent-id");
      assertEquals(result, false);
    });
  });
});