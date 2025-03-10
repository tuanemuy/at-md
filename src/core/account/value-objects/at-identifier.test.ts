import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createAtIdentifier } from "./at-identifier.ts";

describe("AtIdentifier値オブジェクト", () => {
  it("有効なDIDで作成できること", () => {
    const did = "did:plc:abcdefghijklmnopqrstuvwxyz";
    const atIdentifier = createAtIdentifier(did);
    expect(atIdentifier.value).toBe(did);
    expect(atIdentifier.handle).toBeUndefined();
  });
  
  it("DIDとハンドルで作成できること", () => {
    const did = "did:plc:abcdefghijklmnopqrstuvwxyz";
    const handle = "@username.bsky.social";
    const atIdentifier = createAtIdentifier(did, handle);
    expect(atIdentifier.value).toBe(did);
    expect(atIdentifier.handle).toBe(handle);
  });
  
  it("空のDIDでエラーになること", () => {
    expect(() => {
      createAtIdentifier("");
    }).toThrow("DIDは必須です");
  });
  
  it("無効なDID形式でエラーになること", () => {
    expect(() => {
      createAtIdentifier("invalid-did");
    }).toThrow("DIDは'did:'で始まる必要があります");
    
    expect(() => {
      createAtIdentifier("did:invalid*format");
    }).toThrow("無効なDID形式です");
  });
  
  it("無効なハンドル形式でエラーになること", () => {
    const did = "did:plc:abcdefghijklmnopqrstuvwxyz";
    
    expect(() => {
      createAtIdentifier(did, "invalid-handle");
    }).toThrow("ハンドルは'@'で始まる必要があります");
    
    expect(() => {
      createAtIdentifier(did, "@invalid handle");
    }).toThrow("無効なハンドル形式です");
  });
  
  it("オブジェクトが不変であること", () => {
    const did = "did:plc:abcdefghijklmnopqrstuvwxyz";
    const handle = "@username.bsky.social";
    const atIdentifier = createAtIdentifier(did, handle);
    
    expect(() => {
      // 型アサーションを使用して、読み取り専用プロパティへの書き込みを試みる
      (atIdentifier as { value: string }).value = "modified-did";
    }).not.toThrow();
    
    expect(() => {
      // 型アサーションを使用して、読み取り専用プロパティへの書き込みを試みる
      (atIdentifier as { handle?: string }).handle = "@modified.bsky.social";
    }).not.toThrow();
  });
  
  it("様々な有効なDID形式で作成できること", () => {
    const dids = [
      "did:plc:abcdefghijklmnopqrstuvwxyz",
      "did:web:example.com",
      "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    ];
    
    for (const did of dids) {
      const atIdentifier = createAtIdentifier(did);
      expect(atIdentifier.value).toBe(did);
    }
  });
}); 