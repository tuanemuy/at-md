import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Content, ContentParams, createContent } from "./content.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { Version, createVersion } from "../value-objects/version.ts";

describe("Contentエンティティ", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const id = "content-123";
    const userId = "user-456";
    const repositoryId = "repo-789";
    const path = "path/to/content.md";
    const title = "テストコンテンツ";
    const body = "# テストコンテンツ\n\nこれはテストです。";
    const metadata = createContentMetadata({
      tags: ["test", "markdown"],
      categories: ["tech"],
      language: "ja",
      readingTime: 3
    });
    const versions: Version[] = [];
    const visibility = "private";
    const createdAt = new Date("2023-01-01T00:00:00Z");
    const updatedAt = new Date("2023-01-02T00:00:00Z");

    // 操作
    const content = createContent({
      id,
      userId,
      repositoryId,
      path,
      title,
      body,
      metadata,
      versions,
      visibility,
      createdAt,
      updatedAt
    });

    // アサーション
    expect(content.id).toBe(id);
    expect(content.userId).toBe(userId);
    expect(content.repositoryId).toBe(repositoryId);
    expect(content.path).toBe(path);
    expect(content.title).toBe(title);
    expect(content.body).toBe(body);
    expect(content.metadata).toEqual(metadata);
    expect(content.versions).toEqual(versions);
    expect(content.visibility).toBe(visibility);
    expect(content.createdAt).toEqual(createdAt);
    expect(content.updatedAt).toEqual(updatedAt);
  });

  it("バージョンを追加できること", () => {
    // 準備
    const content = createContent({
      id: "content-123",
      userId: "user-456",
      repositoryId: "repo-789",
      path: "path/to/content.md",
      title: "元のタイトル",
      body: "元の本文",
      metadata: createContentMetadata({
        tags: ["original"],
        categories: ["tech"],
        language: "ja"
      }),
      versions: [],
      visibility: "private",
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });

    const version = createVersion({
      id: "version-123",
      contentId: "content-123",
      commitId: "commit-123",
      createdAt: new Date("2023-01-02T00:00:00Z"),
      changes: {
        title: "新しいタイトル",
        body: "新しい本文"
      }
    });

    // 操作
    const updatedContent = content.addVersion(version);

    // アサーション
    expect(updatedContent.versions.length).toBe(1);
    expect(updatedContent.versions[0]).toEqual(version);
    expect(updatedContent).not.toBe(content); // 新しいインスタンスが返されること
  });

  it("公開範囲を変更できること", () => {
    // 準備
    const content = createContent({
      id: "content-123",
      userId: "user-456",
      repositoryId: "repo-789",
      path: "path/to/content.md",
      title: "テストコンテンツ",
      body: "テスト本文",
      metadata: createContentMetadata({
        tags: ["test"],
        categories: ["tech"],
        language: "ja"
      }),
      versions: [],
      visibility: "private",
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });

    // 操作
    const publicContent = content.changeVisibility("public");

    // アサーション
    expect(publicContent.visibility).toBe("public");
    expect(publicContent).not.toBe(content); // 新しいインスタンスが返されること
  });

  it("メタデータを更新できること", () => {
    // 準備
    const content = createContent({
      id: "content-123",
      userId: "user-456",
      repositoryId: "repo-789",
      path: "path/to/content.md",
      title: "テストコンテンツ",
      body: "テスト本文",
      metadata: createContentMetadata({
        tags: ["test"],
        categories: ["tech"],
        language: "ja"
      }),
      versions: [],
      visibility: "private",
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });

    const newMetadata = createContentMetadata({
      tags: ["test", "updated"],
      categories: ["tech", "programming"],
      language: "ja",
      readingTime: 5
    });

    // 操作
    const updatedContent = content.updateMetadata(newMetadata);

    // アサーション
    expect(updatedContent.metadata).toEqual(newMetadata);
    expect(updatedContent).not.toBe(content); // 新しいインスタンスが返されること
  });

  it("IDが指定されていない場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createContent({
        id: "",
        userId: "user-456",
        repositoryId: "repo-789",
        path: "path/to/content.md",
        title: "テストコンテンツ",
        body: "テスト本文",
        metadata: createContentMetadata({
          tags: ["test"],
          categories: ["tech"],
          language: "ja"
        }),
        versions: [],
        visibility: "private",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }).toThrow("コンテンツIDは必須です");
  });

  it("無効な公開範囲の場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createContent({
        id: "content-123",
        userId: "user-456",
        repositoryId: "repo-789",
        path: "path/to/content.md",
        title: "テストコンテンツ",
        body: "テスト本文",
        metadata: createContentMetadata({
          tags: ["test"],
          categories: ["tech"],
          language: "ja"
        }),
        versions: [],
        visibility: "invalid-visibility" as any,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }).toThrow("無効な公開範囲です");
  });
}); 