import { assertEquals, assertThrows } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Content, ContentParams, createContent, ContentCreationError } from "./content.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { Version, createVersion } from "../value-objects/version.ts";
import { Result } from "../deps.ts";
import { DomainError } from "../../errors/mod.ts";
import { contentVisibilitySchema } from "../schemas/content-schemas.ts";
import { 
  titleSchema, 
  bodySchema, 
  contentIdSchema, 
  userIdSchema, 
  repositoryIdSchema, 
  pathSchema,
  tagsSchema,
  categoriesSchema,
  languageSchema
} from "../../common/schemas/mod.ts";

// テスト用のヘルパー関数
function createValidContentParams(): ContentParams {
  return {
    id: contentIdSchema.parse("content-123"),
    userId: userIdSchema.parse("user-456"),
    repositoryId: repositoryIdSchema.parse("repo-789"),
    path: pathSchema.parse("path/to/content.md"),
    title: titleSchema.parse("テストコンテンツ"),
    body: bodySchema.parse("# テストコンテンツ\n\nこれはテストです。"),
    metadata: {
      tags: tagsSchema.parse(["test", "markdown"]),
      categories: categoriesSchema.parse(["tech"]),
      language: languageSchema.parse("ja"),
      readingTime: 3
    },
    versions: [],
    visibility: contentVisibilitySchema.enum.private,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z")
  };
}

describe("Contentエンティティ", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const params = createValidContentParams();

    // 操作
    const result = createContent(params);

    // アサーション
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const content = result.value;
      expect(content.id).toBe(params.id);
      expect(content.userId).toBe(params.userId);
      expect(content.repositoryId).toBe(params.repositoryId);
      expect(content.path).toBe(params.path);
      expect(content.title).toBe(params.title);
      expect(content.body).toBe(params.body);
      expect(content.metadata).toEqual(params.metadata);
      expect(content.versions).toEqual(params.versions);
      expect(content.visibility).toBe(params.visibility);
      expect(content.createdAt).toEqual(params.createdAt);
      expect(content.updatedAt).toEqual(params.updatedAt);
    }
  });

  it("無効なIDでエラーになること", () => {
    // 期待する結果
    const params = createValidContentParams();
    // @ts-ignore: テスト用に無効な値を設定
    params.id = "";

    // 操作
    const result = createContent(params);

    // アサーション
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ContentCreationError);
    }
  });

  it("無効な公開範囲でエラーになること", () => {
    // 期待する結果
    const params = createValidContentParams();
    // @ts-ignore: テスト用に無効な値を設定
    params.visibility = "invalid";

    // 操作
    const result = createContent(params);

    // アサーション
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ContentCreationError);
    }
  });

  it("バージョンを追加できること", () => {
    // 準備
    const params = createValidContentParams();
    const contentResult = createContent(params);
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    
    // バージョンの作成
    const versionResult = createVersion({
      id: "version-123",
      contentId: content.id,
      commitId: "commit-456",
      createdAt: new Date("2023-01-03T00:00:00Z"),
      changes: {
        title: titleSchema.parse("更新されたタイトル"),
        body: bodySchema.parse("更新された本文")
      }
    });
    expect(versionResult.isOk()).toBe(true);
    if (!versionResult.isOk()) return;
    
    const version = versionResult.value;

    // 操作
    const updatedContentResult = content.addVersion(version);

    // アサーション
    expect(updatedContentResult.isOk()).toBe(true);
    if (updatedContentResult.isOk()) {
      const updatedContent = updatedContentResult.value;
      expect(updatedContent.versions.length).toBe(1);
      expect(updatedContent.versions[0]).toEqual(version);
      expect(updatedContent.updatedAt).not.toEqual(content.updatedAt);
    }
  });

  it("公開範囲を変更できること", () => {
    // 準備
    const params = createValidContentParams();
    const contentResult = createContent(params);
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const newVisibility = contentVisibilitySchema.enum.public;

    // 操作
    const updatedContentResult = content.changeVisibility(newVisibility);

    // アサーション
    expect(updatedContentResult.isOk()).toBe(true);
    if (updatedContentResult.isOk()) {
      const updatedContent = updatedContentResult.value;
      expect(updatedContent.visibility).toBe(newVisibility);
      expect(updatedContent.updatedAt).not.toEqual(content.updatedAt);
    }
  });

  it("無効な公開範囲に変更するとエラーになること", () => {
    // 準備
    const params = createValidContentParams();
    const contentResult = createContent(params);
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    
    // 無効な可視性を指定した場合はエラーになる
    const updatedContentResult = content.changeVisibility("invalid" as unknown as "public" | "private" | "unlisted");
    
    // アサーション
    expect(updatedContentResult.isErr()).toBe(true);
    if (updatedContentResult.isErr()) {
      expect(updatedContentResult.error).toBeInstanceOf(ContentCreationError);
    }
  });

  it("メタデータを更新できること", () => {
    // 準備
    const params = createValidContentParams();
    const contentResult = createContent(params);
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const newMetadata = {
      tags: tagsSchema.parse(["updated", "test"]),
      categories: categoriesSchema.parse(["tech", "programming"]),
      language: languageSchema.parse("en"),
      readingTime: 5
    };

    // 操作
    const updatedContentResult = content.updateMetadata(newMetadata);

    // アサーション
    expect(updatedContentResult.isOk()).toBe(true);
    if (updatedContentResult.isOk()) {
      const updatedContent = updatedContentResult.value;
      expect(updatedContent.metadata).toEqual(newMetadata);
      expect(updatedContent.updatedAt).not.toEqual(content.updatedAt);
    }
  });
}); 