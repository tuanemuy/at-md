/**
 * DrizzleUserRepositoryのテスト
 * 
 * このテストでは、実際のデータベースの代わりにモックを使用して、
 * リポジトリの機能を検証します。これにより、テストが高速で安定し、
 * 外部依存を減らすことができます。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { DrizzleUserRepository } from "./drizzle-user-repository.ts";
import { UserAggregate, createUserAggregate } from "../../core/account/aggregates/user-aggregate.ts";
import { generateId } from "../../core/common/id.ts";
import { eq } from "drizzle-orm";
import { users } from "../database/schema/user.ts";

/**
 * 簡易的なモックリポジトリ
 * 実際のデータベースの代わりに、インメモリでデータを管理します
 */
class MockUserRepository {
  // インメモリデータストア
  private userStore: Record<string, UserAggregate> = {};
  
  /**
   * IDによってユーザーを検索する
   */
  async findById(id: string): Promise<UserAggregate | null> {
    return this.userStore[id] || null;
  }
  
  /**
   * ユーザー名によってユーザーを検索する
   */
  async findByUsername(username: string): Promise<UserAggregate | null> {
    for (const id in this.userStore) {
      const aggregate = this.userStore[id];
      if (aggregate.user.username.value === username) {
        return aggregate;
      }
    }
    return null;
  }
  
  /**
   * メールアドレスによってユーザーを検索する
   */
  async findByEmail(email: string): Promise<UserAggregate | null> {
    for (const id in this.userStore) {
      const aggregate = this.userStore[id];
      if (aggregate.user.email.value === email) {
        return aggregate;
      }
    }
    return null;
  }
  
  /**
   * AT DIDによってユーザーを検索する
   */
  async findByAtDid(atDid: string): Promise<UserAggregate | null> {
    for (const id in this.userStore) {
      const aggregate = this.userStore[id];
      if (aggregate.user.atIdentifier.value === atDid) {
        return aggregate;
      }
    }
    return null;
  }
  
  /**
   * AT Handleによってユーザーを検索する
   */
  async findByAtHandle(atHandle: string): Promise<UserAggregate | null> {
    for (const id in this.userStore) {
      const aggregate = this.userStore[id];
      if (aggregate.user.atIdentifier.handle === atHandle) {
        return aggregate;
      }
    }
    return null;
  }
  
  /**
   * ユーザーを保存する
   */
  async save(userAggregate: UserAggregate): Promise<UserAggregate> {
    this.userStore[userAggregate.user.id] = userAggregate;
    return userAggregate;
  }
  
  /**
   * ユーザーを削除する
   */
  async delete(id: string): Promise<boolean> {
    if (this.userStore[id]) {
      delete this.userStore[id];
      return true;
    }
    return false;
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
  let mockRepo: MockUserRepository;
  
  beforeEach(() => {
    mockRepo = new MockUserRepository();
    mockRepo.clearAll();
  });
  
  describe("findById", () => {
    it("存在するIDでユーザーを取得できる", async () => {
      const userAggregate = createTestUserAggregate();
      await mockRepo.save(userAggregate);
      
      const result = await mockRepo.findById(userAggregate.user.id);
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe(userAggregate.user.id);
    });
    
    it("存在しないIDの場合はnullを返す", async () => {
      const result = await mockRepo.findById("non-existent-id");
      expect(result).toBeNull();
    });
  });
  
  describe("findByUsername", () => {
    it("存在するユーザー名でユーザーを取得できる", async () => {
      const userAggregate = createTestUserAggregate();
      await mockRepo.save(userAggregate);
      
      const result = await mockRepo.findByUsername(userAggregate.user.username.value);
      expect(result).not.toBeNull();
      expect(result?.user.username.value).toBe(userAggregate.user.username.value);
    });
    
    it("存在しないユーザー名の場合はnullを返す", async () => {
      const result = await mockRepo.findByUsername("non-existent-username");
      expect(result).toBeNull();
    });
  });
  
  describe("save", () => {
    it("新しいユーザーを保存できる", async () => {
      const userAggregate = createTestUserAggregate();
      const savedAggregate = await mockRepo.save(userAggregate);
      
      expect(savedAggregate).not.toBeNull();
      expect(savedAggregate.user.id).toBe(userAggregate.user.id);
      
      const retrievedAggregate = await mockRepo.findById(userAggregate.user.id);
      expect(retrievedAggregate).not.toBeNull();
      expect(retrievedAggregate?.user.id).toBe(userAggregate.user.id);
    });
    
    it("既存のユーザーを更新できる", async () => {
      const userAggregate = createTestUserAggregate();
      await mockRepo.save(userAggregate);
      
      const updatedAggregate = userAggregate.updateUsername("updateduser");
      const savedAggregate = await mockRepo.save(updatedAggregate);
      
      expect(savedAggregate).not.toBeNull();
      expect(savedAggregate.user.id).toBe(userAggregate.user.id);
      expect(savedAggregate.user.username.value).toBe("updateduser");
      
      const retrievedAggregate = await mockRepo.findById(userAggregate.user.id);
      expect(retrievedAggregate).not.toBeNull();
      expect(retrievedAggregate?.user.username.value).toBe("updateduser");
    });
  });
  
  describe("delete", () => {
    it("存在するユーザーを削除できる", async () => {
      const userAggregate = createTestUserAggregate();
      await mockRepo.save(userAggregate);
      
      const result = await mockRepo.delete(userAggregate.user.id);
      expect(result).toBe(true);
      
      const retrievedAggregate = await mockRepo.findById(userAggregate.user.id);
      expect(retrievedAggregate).toBeNull();
    });
    
    it("存在しないユーザーの削除はfalseを返す", async () => {
      const result = await mockRepo.delete("non-existent-id");
      expect(result).toBe(false);
    });
  });
}); 