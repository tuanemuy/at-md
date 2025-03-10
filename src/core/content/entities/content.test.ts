import { assertEquals } from "jsr:@std/assert@0.218.2/assert_equals";
import { assertThrows } from "jsr:@std/assert@0.218.2/assert_throws";
import { describe, it } from "jsr:@std/testing@0.218.2/bdd";
import { expect } from "jsr:@std/expect@0.218.2";

import {
  Content,
  ContentParams,
  createContent,
  createContentId,
  DomainValidationError,
} from "./content.ts";
import { Version, createVersion, createVersionId, createCommitId } from "../value-objects/version.ts";
import { createContentMetadata, createTag, createCategory, createLanguageCode } from "../value-objects/content-metadata.ts";

describe("Contentエンティティ", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // Arrange
    const id = "content-123";
    const userId = "user-123";
    const repositoryId = "repo-123";
    const path = "/path/to/content";
    const title = "テストコンテンツ";
    const body = "これはテストコンテンツです。";
    const metadata = createContentMetadata({
      tags: ["test", "sample"],
      categories: ["tech", "programming"],
      language: "ja",
      readingTime: 5,
    });
    const versions: Version[] = [];
    const visibility = "public";
    const createdAt = new Date();
    const updatedAt = new Date();

    // Act
    const contentIdResult = createContentId(id);
    expect(contentIdResult.isOk()).toBe(true);
    const contentId = contentIdResult._unsafeUnwrap();

    const contentResult = createContent({
      id: contentId,
      userId,
      repositoryId,
      path,
      title,
      body,
      metadata,
      versions,
      visibility: "public",
      createdAt,
      updatedAt,
    });

    // Assert
    expect(contentResult.isOk()).toBe(true);
    const content = contentResult._unsafeUnwrap();
    expect(content.id).toBe(contentId);
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
    // Arrange
    const contentIdResult = createContentId("content-123");
    expect(contentIdResult.isOk()).toBe(true);
    const contentId = contentIdResult._unsafeUnwrap();

    const contentResult = createContent({
      id: contentId,
      userId: "user-123",
      repositoryId: "repo-123",
      path: "/path/to/content",
      title: "テストコンテンツ",
      body: "これはテストコンテンツです。",
      metadata: createContentMetadata({
        tags: ["test", "sample"],
        categories: ["tech", "programming"],
        language: "ja",
        readingTime: 5,
      }),
      versions: [],
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(contentResult.isOk()).toBe(true);
    const content = contentResult._unsafeUnwrap();

    const versionIdResult = createVersionId("version-123");
    expect(versionIdResult.isOk()).toBe(true);
    const versionId = versionIdResult._unsafeUnwrap();

    const commitIdResult = createCommitId("commit-123");
    expect(commitIdResult.isOk()).toBe(true);
    const commitId = commitIdResult._unsafeUnwrap();

    const version = createVersion({
      id: versionId,
      contentId: contentId,
      commitId: commitId,
      createdAt: new Date(),
      changes: {
        title: "新しいタイトル",
      },
    });

    // Act
    const updatedContent = content.addVersion(version);

    // Assert
    expect(updatedContent.versions.length).toBe(1);
    expect(updatedContent.versions[0]).toEqual(version);
  });

  it("公開範囲を変更できること", () => {
    // Arrange
    const contentIdResult = createContentId("content-123");
    expect(contentIdResult.isOk()).toBe(true);
    const contentId = contentIdResult._unsafeUnwrap();

    const contentResult = createContent({
      id: contentId,
      userId: "user-123",
      repositoryId: "repo-123",
      path: "/path/to/content",
      title: "テストコンテンツ",
      body: "これはテストコンテンツです。",
      metadata: createContentMetadata({
        tags: ["test", "sample"],
        categories: ["tech", "programming"],
        language: "ja",
        readingTime: 5,
      }),
      versions: [],
      visibility: "private",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(contentResult.isOk()).toBe(true);
    const content = contentResult._unsafeUnwrap();

    // Act
    const publicContent = content.changeVisibility("public");

    // Assert
    expect(publicContent.visibility).toBe("public");
  });

  it("メタデータを更新できること", () => {
    // Arrange
    const contentIdResult = createContentId("content-123");
    expect(contentIdResult.isOk()).toBe(true);
    const contentId = contentIdResult._unsafeUnwrap();

    const contentResult = createContent({
      id: contentId,
      userId: "user-123",
      repositoryId: "repo-123",
      path: "/path/to/content",
      title: "テストコンテンツ",
      body: "これはテストコンテンツです。",
      metadata: createContentMetadata({
        tags: ["test", "sample"],
        categories: ["tech", "programming"],
        language: "ja",
        readingTime: 5,
      }),
      versions: [],
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(contentResult.isOk()).toBe(true);
    const content = contentResult._unsafeUnwrap();

    const tagsResult = ["新しいタグ"].map(tag => createTag(tag));
    expect(tagsResult.every(r => r.isOk())).toBe(true);
    const tags = tagsResult.map(r => r._unsafeUnwrap());

    const categoriesResult = ["新しいカテゴリ"].map(cat => createCategory(cat));
    expect(categoriesResult.every(r => r.isOk())).toBe(true);
    const categories = categoriesResult.map(r => r._unsafeUnwrap());

    const languageResult = createLanguageCode("en");
    expect(languageResult.isOk()).toBe(true);
    const language = languageResult._unsafeUnwrap();

    const newMetadata = createContentMetadata({
      tags: ["新しいタグ"],
      categories: ["新しいカテゴリ"],
      language: "en",
      readingTime: 10,
    });

    // Act
    const updatedContent = content.updateMetadata(newMetadata);

    // Assert
    expect(updatedContent.metadata).toEqual(newMetadata);
  });

  it("IDが指定されていない場合はエラーになること", () => {
    // Arrange & Act & Assert
    const contentIdResult = createContentId("");
    expect(contentIdResult.isErr()).toBe(true);
    expect(contentIdResult._unsafeUnwrapErr()).toBeInstanceOf(DomainValidationError);
    // エラーメッセージの内容を確認
    const errorMessage = contentIdResult._unsafeUnwrapErr().message;
    expect(errorMessage.includes("ID")).toBe(true);
  });

  it("無効な公開範囲の場合はエラーになること", () => {
    // Arrange
    const contentIdResult = createContentId("content-123");
    expect(contentIdResult.isOk()).toBe(true);
    const contentId = contentIdResult._unsafeUnwrap();

    const contentResult = createContent({
      id: contentId,
      userId: "user-123",
      repositoryId: "repo-123",
      path: "/path/to/content",
      title: "テストコンテンツ",
      body: "これはテストコンテンツです。",
      metadata: createContentMetadata({
        tags: ["test", "sample"],
        categories: ["tech", "programming"],
        language: "ja",
        readingTime: 5,
      }),
      versions: [],
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(contentResult.isOk()).toBe(true);
    const content = contentResult._unsafeUnwrap();

    // Act & Assert
    expect(() => content.changeVisibility("invalid" as any)).toThrow();
  });
}); 