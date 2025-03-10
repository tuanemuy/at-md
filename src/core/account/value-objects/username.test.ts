import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createUsername } from "./username.ts";

describe("Username値オブジェクト", () => {
  it("有効なユーザー名で作成できること", () => {
    const username = createUsername("user123");
    expect(username.value).toBe("user123");
  });
  
  it("アンダースコアを含むユーザー名で作成できること", () => {
    const username = createUsername("user_name");
    expect(username.value).toBe("user_name");
  });
  
  it("ハイフンを含むユーザー名で作成できること", () => {
    const username = createUsername("user-name");
    expect(username.value).toBe("user-name");
  });
  
  it("空のユーザー名でエラーになること", () => {
    expect(() => {
      createUsername("");
    }).toThrow("ユーザー名は必須です");
  });
  
  it("短すぎるユーザー名でエラーになること", () => {
    expect(() => {
      createUsername("us");
    }).toThrow("ユーザー名は3文字以上である必要があります");
  });
  
  it("長すぎるユーザー名でエラーになること", () => {
    // 51文字のユーザー名を生成
    const longUsername = "a".repeat(51);
    
    expect(() => {
      createUsername(longUsername);
    }).toThrow("ユーザー名が長すぎます");
  });
  
  it("無効な文字を含むユーザー名でエラーになること", () => {
    expect(() => {
      createUsername("user@name");
    }).toThrow("ユーザー名には英数字、アンダースコア、ハイフンのみ使用できます");
    
    expect(() => {
      createUsername("user name");
    }).toThrow("ユーザー名には英数字、アンダースコア、ハイフンのみ使用できます");
    
    expect(() => {
      createUsername("user.name");
    }).toThrow("ユーザー名には英数字、アンダースコア、ハイフンのみ使用できます");
  });
  
  it("オブジェクトが不変であること", () => {
    const username = createUsername("user123");
    
    // プロパティを直接変更しようとしても変更されない
    expect(() => {
      // 型アサーションを使用して、読み取り専用プロパティへの書き込みを試みる
      (username as { value: string }).value = "modified";
    }).not.toThrow();
  });
}); 