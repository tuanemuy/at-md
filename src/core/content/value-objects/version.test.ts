import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Version, ContentChanges, createVersion, createVersionId, createCommitId } from "./version.ts";
import { createContentId } from "../entities/content.ts";
import { createTag, createCategory, createLanguageCode } from "./content-metadata.ts";

describe("Version値オブジェクト", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const idResult = createVersionId("version-123");
    if (idResult.isErr()) {
      throw new Error("Failed to create version ID");
    }
    const id = idResult._unsafeUnwrap();

    const contentIdResult = createContentId("content-456");
    if (contentIdResult.isErr()) {
      throw new Error("Failed to create content ID");
    }
    const contentId = contentIdResult._unsafeUnwrap();

    const commitIdResult = createCommitId("commit-789");
    if (commitIdResult.isErr()) {
      throw new Error("Failed to create commit ID");
    }
    const commitId = commitIdResult._unsafeUnwrap();

    const createdAt = new Date("2023-01-01T00:00:00Z");
    
    // タグとカテゴリを型安全に作成
    const tagResult = createTag("新しいタグ");
    if (tagResult.isErr()) {
      throw new Error("Failed to create tag");
    }
    const tag = tagResult._unsafeUnwrap();
    
    const categoryResult = createCategory("新しいカテゴリ");
    if (categoryResult.isErr()) {
      throw new Error("Failed to create category");
    }
    const category = categoryResult._unsafeUnwrap();
    
    const languageResult = createLanguageCode("ja");
    if (languageResult.isErr()) {
      throw new Error("Failed to create language code");
    }
    const language = languageResult._unsafeUnwrap();

    const changes: ContentChanges = {
      title: "新しいタイトル",
      body: "新しい本文",
      metadata: {
        tags: [tag],
        categories: [category],
        language: language
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
    const idResult = createVersionId("version-123");
    if (idResult.isErr()) {
      throw new Error("Failed to create version ID");
    }
    const id = idResult._unsafeUnwrap();

    const contentIdResult = createContentId("content-456");
    if (contentIdResult.isErr()) {
      throw new Error("Failed to create content ID");
    }
    const contentId = contentIdResult._unsafeUnwrap();

    const commitIdResult = createCommitId("commit-789");
    if (commitIdResult.isErr()) {
      throw new Error("Failed to create commit ID");
    }
    const commitId = commitIdResult._unsafeUnwrap();

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
    // コンテンツIDとコミットIDを型安全に作成
    const contentIdResult = createContentId("content-456");
    if (contentIdResult.isErr()) {
      throw new Error("Failed to create content ID");
    }
    const contentId = contentIdResult._unsafeUnwrap();

    const commitIdResult = createCommitId("commit-789");
    if (commitIdResult.isErr()) {
      throw new Error("Failed to create commit ID");
    }
    const commitId = commitIdResult._unsafeUnwrap();

    // 操作と検証
    expect(() => {
      createVersion({
        id: "",
        contentId,
        commitId,
        createdAt: new Date(),
        changes: { title: "タイトル" }
      });
    }).toThrow("バージョンIDは必須です");
  });

  it("コンテンツIDが指定されていない場合はエラーになること", () => {
    // バージョンIDとコミットIDを型安全に作成
    const idResult = createVersionId("version-123");
    if (idResult.isErr()) {
      throw new Error("Failed to create version ID");
    }
    const id = idResult._unsafeUnwrap();

    const commitIdResult = createCommitId("commit-789");
    if (commitIdResult.isErr()) {
      throw new Error("Failed to create commit ID");
    }
    const commitId = commitIdResult._unsafeUnwrap();

    // 操作と検証
    expect(() => {
      createVersion({
        id,
        contentId: "" as any, // テスト用に型キャスト
        commitId,
        createdAt: new Date(),
        changes: { title: "タイトル" }
      });
    }).toThrow("コンテンツIDは必須です");
  });

  it("コミットIDが指定されていない場合はエラーになること", () => {
    // バージョンIDとコンテンツIDを型安全に作成
    const idResult = createVersionId("version-123");
    if (idResult.isErr()) {
      throw new Error("Failed to create version ID");
    }
    const id = idResult._unsafeUnwrap();

    const contentIdResult = createContentId("content-456");
    if (contentIdResult.isErr()) {
      throw new Error("Failed to create content ID");
    }
    const contentId = contentIdResult._unsafeUnwrap();

    // 操作と検証
    expect(() => {
      createVersion({
        id,
        contentId,
        commitId: "" as any, // テスト用に型キャスト
        createdAt: new Date(),
        changes: { title: "タイトル" }
      });
    }).toThrow("コミットIDは必須です");
  });

  it("変更内容が空の場合はエラーになること", () => {
    // バージョンID、コンテンツID、コミットIDを型安全に作成
    const idResult = createVersionId("version-123");
    if (idResult.isErr()) {
      throw new Error("Failed to create version ID");
    }
    const id = idResult._unsafeUnwrap();

    const contentIdResult = createContentId("content-456");
    if (contentIdResult.isErr()) {
      throw new Error("Failed to create content ID");
    }
    const contentId = contentIdResult._unsafeUnwrap();

    const commitIdResult = createCommitId("commit-789");
    if (commitIdResult.isErr()) {
      throw new Error("Failed to create commit ID");
    }
    const commitId = commitIdResult._unsafeUnwrap();

    // 操作と検証
    expect(() => {
      createVersion({
        id,
        contentId,
        commitId,
        createdAt: new Date(),
        changes: {}
      });
    }).toThrow("変更内容は少なくとも1つ以上必要です");
  });
}); 