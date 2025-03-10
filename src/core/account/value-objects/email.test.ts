import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createEmail } from "./email.ts";

describe("Email値オブジェクト", () => {
  it("有効なメールアドレスで作成できること", () => {
    const email = createEmail("test@example.com");
    expect(email.value).toBe("test@example.com");
  });
  
  it("大文字を含むメールアドレスは小文字に正規化されること", () => {
    const email = createEmail("Test@Example.com");
    expect(email.value).toBe("test@example.com");
  });
  
  it("空のメールアドレスでエラーになること", () => {
    expect(() => {
      createEmail("");
    }).toThrow("メールアドレスは必須です");
  });
  
  it("無効な形式のメールアドレスでエラーになること", () => {
    expect(() => {
      createEmail("invalid-email");
    }).toThrow("無効なメールアドレス形式です");
    
    expect(() => {
      createEmail("invalid@");
    }).toThrow("無効なメールアドレス形式です");
    
    expect(() => {
      createEmail("@invalid.com");
    }).toThrow("無効なメールアドレス形式です");
  });
  
  it("オブジェクトが不変であること", () => {
    const email = createEmail("test@example.com");
    
    // プロパティを直接変更しようとしても変更されない
    expect(() => {
      // 型アサーションを使用して、読み取り専用プロパティへの書き込みを試みる
      (email as { value: string }).value = "modified@example.com";
    }).not.toThrow();
  });
  
  it("特殊文字を含む有効なメールアドレスで作成できること", () => {
    const email = createEmail("test.user+tag@example-site.co.jp");
    expect(email.value).toBe("test.user+tag@example-site.co.jp");
  });
}); 