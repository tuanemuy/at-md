import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createUser } from "./user.ts";
import { createUsername, createEmail, createAtIdentifier } from "../value-objects/mod.ts";

describe("Userエンティティ", () => {
  // テスト用のユーザーを作成する関数
  function createTestUser() {
    return createUser({
      id: "user-123",
      username: createUsername("testuser"),
      email: createEmail("test@example.com"),
      atIdentifier: createAtIdentifier("did:plc:abcdefghijklmnopqrstuvwxyz", "@testuser.bsky.social")
    });
  }
  
  it("すべてのプロパティを指定して作成できること", () => {
    const now = new Date();
    const user = createUser({
      id: "user-123",
      username: createUsername("testuser"),
      email: createEmail("test@example.com"),
      atIdentifier: createAtIdentifier("did:plc:abcdefghijklmnopqrstuvwxyz", "@testuser.bsky.social"),
      createdAt: now,
      updatedAt: now
    });
    
    expect(user.id).toBe("user-123");
    expect(user.username.value).toBe("testuser");
    expect(user.email.value).toBe("test@example.com");
    expect(user.atIdentifier.value).toBe("did:plc:abcdefghijklmnopqrstuvwxyz");
    expect(user.atIdentifier.handle).toBe("@testuser.bsky.social");
    expect(user.createdAt).toBe(now);
    expect(user.updatedAt).toBe(now);
  });
  
  it("最小限のプロパティで作成できること", () => {
    const user = createTestUser();
    
    expect(user.id).toBe("user-123");
    expect(user.username.value).toBe("testuser");
    expect(user.email.value).toBe("test@example.com");
    expect(user.atIdentifier.value).toBe("did:plc:abcdefghijklmnopqrstuvwxyz");
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
  
  it("IDが空の場合にエラーになること", () => {
    expect(() => {
      createUser({
        id: "",
        username: createUsername("testuser"),
        email: createEmail("test@example.com"),
        atIdentifier: createAtIdentifier("did:plc:abcdefghijklmnopqrstuvwxyz")
      });
    }).toThrow("ユーザーIDは必須です");
  });
  
  it("ユーザー名を更新できること", () => {
    const user = createTestUser();
    const newUsername = createUsername("newusername");
    const updatedUser = user.updateUsername(newUsername);
    
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.username.value).toBe("newusername");
    expect(updatedUser.email.value).toBe(user.email.value);
    expect(updatedUser.atIdentifier.value).toBe(user.atIdentifier.value);
    expect(updatedUser.createdAt).toEqual(user.createdAt);
    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
  });
  
  it("メールアドレスを更新できること", () => {
    const user = createTestUser();
    const newEmail = createEmail("new@example.com");
    const updatedUser = user.updateEmail(newEmail);
    
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.username.value).toBe(user.username.value);
    expect(updatedUser.email.value).toBe("new@example.com");
    expect(updatedUser.atIdentifier.value).toBe(user.atIdentifier.value);
    expect(updatedUser.createdAt).toEqual(user.createdAt);
    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
  });
  
  it("ATプロトコル識別子を更新できること", () => {
    const user = createTestUser();
    const newAtIdentifier = createAtIdentifier("did:plc:newidentifier", "@newuser.bsky.social");
    const updatedUser = user.updateAtIdentifier(newAtIdentifier);
    
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.username.value).toBe(user.username.value);
    expect(updatedUser.email.value).toBe(user.email.value);
    expect(updatedUser.atIdentifier.value).toBe("did:plc:newidentifier");
    expect(updatedUser.atIdentifier.handle).toBe("@newuser.bsky.social");
    expect(updatedUser.createdAt).toEqual(user.createdAt);
    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
  });
  
  it("オブジェクトが不変であること", () => {
    const user = createTestUser();
    
    expect(() => {
      (user as any).id = "modified-id";
    }).toThrow();
    
    expect(() => {
      (user as any).username = createUsername("modified");
    }).toThrow();
    
    expect(() => {
      (user as any).email = createEmail("modified@example.com");
    }).toThrow();
    
    expect(() => {
      (user as any).atIdentifier = createAtIdentifier("did:plc:modified");
    }).toThrow();
  });
}); 