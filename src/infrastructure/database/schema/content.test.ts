/**
 * コンテンツ関連のデータベーススキーマのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { 
  contents, 
  contentMetadata,
  repositories
} from "./content.ts";
import { sql } from "npm:drizzle-orm";

describe("コンテンツスキーマ", () => {
  it("contentsテーブルが正しく定義されていること", () => {
    // カラムの存在確認
    expect(contents.id).toBeDefined();
    expect(contents.userId).toBeDefined();
    expect(contents.repositoryId).toBeDefined();
    expect(contents.path).toBeDefined();
    expect(contents.title).toBeDefined();
    expect(contents.body).toBeDefined();
    expect(contents.visibility).toBeDefined();
    expect(contents.createdAt).toBeDefined();
    expect(contents.updatedAt).toBeDefined();
    
    // 型の確認
    expect(contents.id.dataType).toBe("string");
    expect(contents.userId.dataType).toBe("string");
    expect(contents.repositoryId.dataType).toBe("string");
    expect(contents.path.dataType).toBe("string");
    expect(contents.title.dataType).toBe("string");
    expect(contents.body.dataType).toBe("string");
    expect(contents.visibility.dataType).toBe("string");
    expect(contents.createdAt.dataType).toBe("date");
    expect(contents.updatedAt.dataType).toBe("date");
  });
  
  it("contentMetadataテーブルが正しく定義されていること", () => {
    // カラムの存在確認
    expect(contentMetadata.id).toBeDefined();
    expect(contentMetadata.contentId).toBeDefined();
    expect(contentMetadata.tags).toBeDefined();
    expect(contentMetadata.categories).toBeDefined();
    expect(contentMetadata.language).toBeDefined();
    expect(contentMetadata.createdAt).toBeDefined();
    expect(contentMetadata.updatedAt).toBeDefined();
    
    // 型の確認
    expect(contentMetadata.id.dataType).toBe("string");
    expect(contentMetadata.contentId.dataType).toBe("string");
    expect(contentMetadata.tags.dataType).toBe("json");
    expect(contentMetadata.categories.dataType).toBe("json");
    expect(contentMetadata.language.dataType).toBe("string");
    expect(contentMetadata.createdAt.dataType).toBe("date");
    expect(contentMetadata.updatedAt.dataType).toBe("date");
  });
  
  it("repositoriesテーブルが正しく定義されていること", () => {
    // カラムの存在確認
    expect(repositories.id).toBeDefined();
    expect(repositories.userId).toBeDefined();
    expect(repositories.name).toBeDefined();
    expect(repositories.description).toBeDefined();
    expect(repositories.githubUrl).toBeDefined();
    expect(repositories.createdAt).toBeDefined();
    expect(repositories.updatedAt).toBeDefined();
    
    // 型の確認
    expect(repositories.id.dataType).toBe("string");
    expect(repositories.userId.dataType).toBe("string");
    expect(repositories.name.dataType).toBe("string");
    expect(repositories.description.dataType).toBe("string");
    expect(repositories.githubUrl.dataType).toBe("string");
    expect(repositories.createdAt.dataType).toBe("date");
    expect(repositories.updatedAt.dataType).toBe("date");
  });
}); 