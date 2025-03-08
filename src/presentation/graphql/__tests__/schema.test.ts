/**
 * GraphQLスキーマのテスト
 * 
 * スキーマの型定義が正しく機能するかテストします。
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { typeDefs } from "../schema/mod.ts";

describe("GraphQLスキーマのテスト", () => {
  it("スキーマが正しく定義されていること", () => {
    // スキーマの配列が存在することを確認
    expect(Array.isArray(typeDefs), "typeDefsが配列であること").toBe(true);
    expect(typeDefs.length, "typeDefsの長さが5であること").toBe(5);
    
    // 各スキーマが存在することを確認
    for (const typeDef of typeDefs) {
      expect(typeDef, "typeDefが定義されていること").toBeDefined();
      expect(typeDef.kind, "typeDefがDocumentNodeであること").toBe("Document");
      expect(typeDef.definitions, "typeDefに定義が含まれていること").toBeDefined();
      expect(Array.isArray(typeDef.definitions), "definitionsが配列であること").toBe(true);
    }
  });
}); 