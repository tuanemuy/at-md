import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Version, ContentChanges, createVersion } from "./version.ts";

describe("Version値オブジェクト", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const id = "version-123";
    const contentId = "content-456";
    const commitId = "commit-789";
    const createdAt = new Date("2023-01-01T00:00:00Z");
    const changes: ContentChanges = {
      title: "新しいタイトル",
      body: "新しい本文",
      metadata: {
        tags: ["新しいタグ"],
        categories: ["新しいカテゴリ"],
        language: "ja"
      }
    };

    // 操作
    const version = createVersion({
      id,
      contentId,
      commitId,
      createdAt,
      changes
    });

    // アサーション
    expect(version.id).toBe(id);
    expect(version.contentId).toBe(contentId);
    expect(version.commitId).toBe(commitId);
    expect(version.createdAt).toEqual(createdAt);
    expect(version.changes).toEqual(changes);
  });

  it("変更内容の一部のみを指定して作成できること", () => {
    // 期待する結果
    const id = "version-123";
    const contentId = "content-456";
    const commitId = "commit-789";
    const createdAt = new Date("2023-01-01T00:00:00Z");
    const changes: ContentChanges = {
      title: "新しいタイトル"
    };

    // 操作
    const version = createVersion({
      id,
      contentId,
      commitId,
      createdAt,
      changes
    });

    // アサーション
    expect(version.id).toBe(id);
    expect(version.contentId).toBe(contentId);
    expect(version.commitId).toBe(commitId);
    expect(version.createdAt).toEqual(createdAt);
    expect(version.changes).toEqual(changes);
    expect(version.changes.body).toBeUndefined();
    expect(version.changes.metadata).toBeUndefined();
  });

  it("IDが指定されていない場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createVersion({
        id: "",
        contentId: "content-456",
        commitId: "commit-789",
        createdAt: new Date(),
        changes: { title: "タイトル" }
      });
    }).toThrow("バージョンIDは必須です");
  });

  it("コンテンツIDが指定されていない場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createVersion({
        id: "version-123",
        contentId: "",
        commitId: "commit-789",
        createdAt: new Date(),
        changes: { title: "タイトル" }
      });
    }).toThrow("コンテンツIDは必須です");
  });

  it("コミットIDが指定されていない場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createVersion({
        id: "version-123",
        contentId: "content-456",
        commitId: "",
        createdAt: new Date(),
        changes: { title: "タイトル" }
      });
    }).toThrow("コミットIDは必須です");
  });

  it("変更内容が空の場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createVersion({
        id: "version-123",
        contentId: "content-456",
        commitId: "commit-789",
        createdAt: new Date(),
        changes: {}
      });
    }).toThrow("変更内容は少なくとも1つ以上必要です");
  });
}); 