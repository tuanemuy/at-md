/**
 * DrizzleUserRepositoryのテスト
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
  type UserAggregate,
  type User,
  createUserAggregate,
  type UserRepository,
  users,
  db
} from "./__tests__/deps.ts";

import { DrizzleUserRepository } from "./drizzle-user-repository.ts";

/**
 * 簡易的なモックリポジトリ
 * 実際のデータベースの代わりに、インメモリでデータを管理します
 */
class MockUserRepository implements UserRepository {
  // インメモリデータストア
  private userStore: Record<string, UserAggregate> = {};
  
  /**
   * IDによってユーザーを検索する
   */
  findById(id: string): Promise<UserAggregate | null> {
    return Promise.resolve(this.userStore[id] || null);
  }
  
  /**
   * ユーザー名によってユーザーを検索する
   */
  findByUsername(username: string): Promise<UserAggregate | null> {
    for (const id in this.userStore) {
      const aggregate = this.userStore[id];
      if (aggregate.user.username.value === username) {
        return Promise.resolve(aggregate);
      }
    }
    return Promise.resolve(null);
  }
  
  /**
   * メールアドレスによってユーザーを検索する
   */
  findByEmail(email: string): Promise<UserAggregate | null> {
    for (const id in this.userStore) {
      const aggregate = this.userStore[id];
      if (aggregate.user.email.value === email) {
        return Promise.resolve(aggregate);
      }
    }
    return Promise.resolve(null);
  }
  
  /**
   * AT DIDによってユーザーを検索する
   */
  findByDid(did: string): Promise<UserAggregate | null> {
    for (const id in this.userStore) {
      const aggregate = this.userStore[id];
      if (aggregate.user.atIdentifier.value === did) {
        return Promise.resolve(aggregate);
      }
    }
    return Promise.resolve(null);
  }
  
  /**
   * AT Handleによってユーザーを検索する
   */
  findByHandle(handle: string): Promise<UserAggregate | null> {
    for (const id in this.userStore) {
      const aggregate = this.userStore[id];
      if (aggregate.user.atIdentifier.handle === handle) {
        return Promise.resolve(aggregate);
      }
    }
    return Promise.resolve(null);
  }
  
  /**
   * ユーザーを保存する
   */
  save(userAggregate: UserAggregate): Promise<UserAggregate> {
    this.userStore[userAggregate.user.id] = userAggregate;
    return Promise.resolve(userAggregate);
  }
  
  /**
   * ユーザーを削除する
   */
  delete(id: string): Promise<boolean> {
    if (this.userStore[id]) {
      delete this.userStore[id];
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
  
  saveWithTransaction(userAggregate: UserAggregate, _context: unknown): Promise<Result<UserAggregate, DomainError>> {
    this.userStore[userAggregate.user.id] = userAggregate;
    return Promise.resolve(ok(userAggregate));
  }
  
  deleteWithTransaction(id: string, _context: unknown): Promise<Result<boolean, DomainError>> {
    if (this.userStore[id]) {
      delete this.userStore[id];
      return Promise.resolve(ok(true));
    }
    return Promise.resolve(ok(false));
  }
  
  /**
   * すべてのユーザーを削除する（テスト用）
   */
  clearAll(): void {
    this.userStore = {};
  }
}

/**
 * テスト用のユーザー集約を作成する
 */
function createTestUserAggregate(): UserAggregate {
  return createUserAggregate({
    id: generateId(),
    username: "testuser",
    email: "test@example.com",
    atIdentifier: {
      did: "did:plc:testuser",
      handle: "@testuser.bsky.social"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

describe("DrizzleUserRepository", () => {
  let repository: UserRepository;
  let testUserId: string;
  
  beforeEach(async () => {
    // テスト用リポジトリの作成
    repository = new DrizzleUserRepository(db);
    
    // テストデータのクリーンアップ
    await db.delete(users).execute();
    
    // テスト用ユーザーIDの生成
    testUserId = generateId();
  });
  
  describe("findById", () => {
    it("存在するユーザーを取得できる", async () => {
      // テスト用ユーザーの作成
      const userAggregate = createUserAggregate({
        id: testUserId,
        username: "testuser",
        email: "test@example.com",
        atIdentifier: "test.bsky.social",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // ユーザーの保存
      await repository.save(userAggregate);
      
      // ユーザーの取得
      const result = await repository.findById(testUserId);
      
      // 検証
      assertEquals(result?.user.id, testUserId);
      assertEquals(result?.user.username.value, "testuser");
      assertEquals(result?.user.email.value, "test@example.com");
    });
    
    it("存在しないユーザーIDの場合はnullを返す", async () => {
      const result = await repository.findById("non-existent-id");
      assertEquals(result, null);
    });
  });
  
  describe("save", () => {
    it("新しいユーザーを保存できる", async () => {
      // テスト用ユーザーの作成
      const userAggregate = createUserAggregate({
        id: testUserId,
        username: "newuser",
        email: "new@example.com",
        atIdentifier: "new.bsky.social",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // ユーザーの保存
      const savedUser = await repository.save(userAggregate);
      
      // 検証
      assertEquals(savedUser.user.id, testUserId);
      assertEquals(savedUser.user.username.value, "newuser");
      assertEquals(savedUser.user.email.value, "new@example.com");
      
      // データベースから直接取得して検証
      const [dbUser] = await db.select().from(users).where(eq(users.id, testUserId)).execute();
      assertEquals(dbUser.id, testUserId);
      assertEquals(dbUser.username, "newuser");
      assertEquals(dbUser.email, "new@example.com");
    });
    
    it("既存のユーザーを更新できる", async () => {
      // テスト用ユーザーの作成と保存
      const userAggregate = createUserAggregate({
        id: testUserId,
        username: "beforeuser",
        email: "before@example.com",
        atIdentifier: "before.bsky.social",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await repository.save(userAggregate);
      
      // ユーザー情報の更新
      const updatedUserAggregate = userAggregate.updateUsername("afteruser");
      
      const savedUser = await repository.save(updatedUserAggregate);
      
      // 検証
      assertEquals(savedUser.user.id, testUserId);
      assertEquals(savedUser.user.username.value, "afteruser");
      assertEquals(savedUser.user.email.value, "before@example.com");
      
      // データベースから直接取得して検証
      const [dbUser] = await db.select().from(users).where(eq(users.id, testUserId)).execute();
      assertEquals(dbUser.id, testUserId);
      assertEquals(dbUser.username, "afteruser");
      assertEquals(dbUser.email, "before@example.com");
    });
  });
});