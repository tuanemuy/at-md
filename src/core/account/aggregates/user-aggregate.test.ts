import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createUserAggregate } from "./user-aggregate.ts";

describe("UserAggregate集約", () => {
  // テスト用のユーザー集約を作成する関数
  function createTestUserAggregate() {
    return createUserAggregate({
      id: "user-123",
      username: "testuser",
      email: "test@example.com",
      atIdentifier: {
        did: "did:plc:abcdefghijklmnopqrstuvwxyz",
        handle: "@testuser.bsky.social"
      }
    });
  }
  
  it("すべてのプロパティを指定して作成できること", () => {
    const now = new Date();
    const userAggregate = createUserAggregate({
      id: "user-123",
      username: "testuser",
      email: "test@example.com",
      atIdentifier: {
        did: "did:plc:abcdefghijklmnopqrstuvwxyz",
        handle: "@testuser.bsky.social"
      },
      createdAt: now,
      updatedAt: now
    });
    
    const user = userAggregate.user;
    expect(user.id).toBe("user-123");
    expect(user.username.value).toBe("testuser");
    expect(user.email.value).toBe("test@example.com");
    expect(user.atIdentifier.value).toBe("did:plc:abcdefghijklmnopqrstuvwxyz");
    expect(user.atIdentifier.handle).toBe("@testuser.bsky.social");
    expect(user.createdAt).toBe(now);
    expect(user.updatedAt).toBe(now);
  });
  
  it("最小限のプロパティで作成できること", () => {
    const userAggregate = createUserAggregate({
      id: "user-123",
      username: "testuser",
      email: "test@example.com",
      atIdentifier: {
        did: "did:plc:abcdefghijklmnopqrstuvwxyz"
      }
    });
    
    const user = userAggregate.user;
    expect(user.id).toBe("user-123");
    expect(user.username.value).toBe("testuser");
    expect(user.email.value).toBe("test@example.com");
    expect(user.atIdentifier.value).toBe("did:plc:abcdefghijklmnopqrstuvwxyz");
    expect(user.atIdentifier.handle).toBeUndefined();
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
  
  it("ユーザー名を更新できること", () => {
    const userAggregate = createTestUserAggregate();
    const updatedUserAggregate = userAggregate.updateUsername("newusername");
    
    const user = userAggregate.user;
    const updatedUser = updatedUserAggregate.user;
    
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.username.value).toBe("newusername");
    expect(updatedUser.email.value).toBe(user.email.value);
    expect(updatedUser.atIdentifier.value).toBe(user.atIdentifier.value);
    expect(updatedUser.createdAt).toEqual(user.createdAt);
    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
  });
  
  it("メールアドレスを更新できること", () => {
    const userAggregate = createTestUserAggregate();
    const updatedUserAggregate = userAggregate.updateEmail("new@example.com");
    
    const user = userAggregate.user;
    const updatedUser = updatedUserAggregate.user;
    
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.username.value).toBe(user.username.value);
    expect(updatedUser.email.value).toBe("new@example.com");
    expect(updatedUser.atIdentifier.value).toBe(user.atIdentifier.value);
    expect(updatedUser.createdAt).toEqual(user.createdAt);
    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
  });
  
  it("ATプロトコル識別子を更新できること", () => {
    const userAggregate = createTestUserAggregate();
    const updatedUserAggregate = userAggregate.updateAtIdentifier(
      "did:plc:newidentifier",
      "@newuser.bsky.social"
    );
    
    const user = userAggregate.user;
    const updatedUser = updatedUserAggregate.user;
    
    expect(updatedUser.id).toBe(user.id);
    expect(updatedUser.username.value).toBe(user.username.value);
    expect(updatedUser.email.value).toBe(user.email.value);
    expect(updatedUser.atIdentifier.value).toBe("did:plc:newidentifier");
    expect(updatedUser.atIdentifier.handle).toBe("@newuser.bsky.social");
    expect(updatedUser.createdAt).toEqual(user.createdAt);
    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
  });
  
  it("無効なユーザー名でエラーになること", () => {
    const userAggregate = createTestUserAggregate();
    
    expect(() => {
      userAggregate.updateUsername("");
    }).toThrow("ユーザー名は必須です");
    
    expect(() => {
      userAggregate.updateUsername("ab");
    }).toThrow("ユーザー名は3文字以上である必要があります");
    
    expect(() => {
      userAggregate.updateUsername("invalid@username");
    }).toThrow("ユーザー名には英数字、アンダースコア、ハイフンのみ使用できます");
  });
  
  it("無効なメールアドレスでエラーになること", () => {
    const userAggregate = createTestUserAggregate();
    
    expect(() => {
      userAggregate.updateEmail("");
    }).toThrow("メールアドレスは必須です");
    
    expect(() => {
      userAggregate.updateEmail("invalid-email");
    }).toThrow("無効なメールアドレス形式です");
  });
  
  it("無効なATプロトコル識別子でエラーになること", () => {
    const userAggregate = createTestUserAggregate();
    
    expect(() => {
      userAggregate.updateAtIdentifier("");
    }).toThrow("DIDは必須です");
    
    expect(() => {
      userAggregate.updateAtIdentifier("invalid-did");
    }).toThrow("DIDは'did:'で始まる必要があります");
    
    expect(() => {
      userAggregate.updateAtIdentifier("did:plc:valid", "invalid-handle");
    }).toThrow("ハンドルは'@'で始まる必要があります");
  });
  
  it("オブジェクトが不変であること", () => {
    const userAggregate = createTestUserAggregate();
    
    // プロパティを直接変更しようとしても変更されない
    expect(() => {
      // 型アサーションを使用して、読み取り専用プロパティへの書き込みを試みる
      (userAggregate as unknown as { user: null }).user = null;
    }).not.toThrow();
  });
}); 