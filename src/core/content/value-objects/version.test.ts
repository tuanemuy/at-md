import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Version, ContentChanges, createVersion, VersionCreationError } from "./version.ts";
import { titleSchema, bodySchema, tagsSchema, categoriesSchema, languageSchema } from "../../common/schemas/base-schemas.ts";

describe("Version値オブジェクト", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const id = "version-123";
    const contentId = "content-456";
    const commitId = "commit-789";
    const createdAt = new Date("2023-01-01T00:00:00Z");
    const changes: ContentChanges = {
      title: titleSchema.parse("新しいタイトル"),
      body: bodySchema.parse("新しい本文"),
      metadata: {
        tags: tagsSchema.parse(["新しいタグ"]),
        categories: categoriesSchema.parse(["新しいカテゴリ"]),
        language: languageSchema.parse("ja")
      }
    };

    // 操作
    const result = createVersion({
      id,
      contentId,
      commitId,
      createdAt,
      changes
    });

    // アサーション
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const version = result.value;
      expect(version.id).toBe(id);
      expect(version.contentId).toBe(contentId);
      expect(version.commitId).toBe(commitId);
      expect(version.createdAt).toEqual(createdAt);
      expect(version.changes).toEqual(changes);
    }
  });

  it("変更内容の一部のみを指定して作成できること", () => {
    // 期待する結果
    const id = "version-123";
    const contentId = "content-456";
    const commitId = "commit-789";
    const createdAt = new Date("2023-01-01T00:00:00Z");
    const changes: ContentChanges = {
      title: titleSchema.parse("新しいタイトル")
    };

    // 操作
    const result = createVersion({
      id,
      contentId,
      commitId,
      createdAt,
      changes
    });

    // アサーション
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const version = result.value;
      expect(version.id).toBe(id);
      expect(version.contentId).toBe(contentId);
      expect(version.commitId).toBe(commitId);
      expect(version.createdAt).toEqual(createdAt);
      expect(version.changes).toEqual(changes);
      expect(version.changes.body).toBeUndefined();
      expect(version.changes.metadata).toBeUndefined();
    }
  });

  it("IDが指定されていない場合はエラーになること", () => {
    // 操作
    const result = createVersion({
      id: "",
      contentId: "content-456",
      commitId: "commit-789",
      createdAt: new Date(),
      changes: { title: titleSchema.parse("タイトル") }
    });

    // アサーション
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(VersionCreationError);
    }
  });

  it("コンテンツIDが指定されていない場合はエラーになること", () => {
    // 操作
    const result = createVersion({
      id: "version-123",
      contentId: "",
      commitId: "commit-789",
      createdAt: new Date(),
      changes: { title: titleSchema.parse("タイトル") }
    });

    // アサーション
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(VersionCreationError);
    }
  });

  it("コミットIDが指定されていない場合はエラーになること", () => {
    // 操作
    const result = createVersion({
      id: "version-123",
      contentId: "content-456",
      commitId: "",
      createdAt: new Date(),
      changes: { title: titleSchema.parse("タイトル") }
    });

    // アサーション
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(VersionCreationError);
    }
  });

  it("変更内容が空の場合はエラーになること", () => {
    // 操作
    const result = createVersion({
      id: "version-123",
      contentId: "content-456",
      commitId: "commit-789",
      createdAt: new Date(),
      changes: {}
    });

    // アサーション
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(VersionCreationError);
    }
  });
}); 