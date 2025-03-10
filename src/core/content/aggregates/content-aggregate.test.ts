import { describe, it } from "jsr:@std/testing@0.218.2/bdd";
import { expect } from "jsr:@std/expect@0.218.2";

import { ContentAggregate, createContentAggregate } from "./content-aggregate.ts";
import { Content, createContent, createContentId } from "../entities/content.ts";
import { createContentMetadata, createTag, createCategory, createLanguageCode } from "../value-objects/content-metadata.ts";

// テスト用のコンテンツを作成するヘルパー関数
function createTestContent() {
  const contentIdResult = createContentId("content-123");
  if (contentIdResult.isErr()) {
    throw new Error("Failed to create content ID");
  }
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

  if (contentResult.isErr()) {
    throw new Error("Failed to create content");
  }
  return contentResult._unsafeUnwrap();
}

describe("ContentAggregate", () => {
  it("コンテンツから集約を作成できること", () => {
    // Arrange
    const content = createTestContent();
    
    // Act
    const aggregate = createContentAggregate(content);
    
    // Assert
    expect(aggregate.content).toBe(content);
  });

  it("タイトルを更新するとバージョン履歴が追加されること", () => {
    // Arrange
    const content = createTestContent();
    const aggregate = createContentAggregate(content);
    const newTitle = "新しいタイトル";
    const originalTitle = content.title;
    const originalVersionsLength = content.versions.length;

    // Act
    const updatedAggregateResult = aggregate.updateTitle(newTitle);
    
    // Assert
    expect(updatedAggregateResult.isOk()).toBe(true);
    
    // 元のコンテンツのタイトルは変更されていないことを確認
    expect(content.title).toBe(originalTitle);
    
    // 更新後のコンテンツにバージョンが追加されていることを確認
    const updatedAggregate = updatedAggregateResult._unsafeUnwrap();
    expect(updatedAggregate.content.versions.length).toBe(originalVersionsLength + 1);
    
    // 最新のバージョンの変更内容を確認
    const latestVersion = updatedAggregate.content.versions[updatedAggregate.content.versions.length - 1];
    expect(latestVersion.changes.title).toBe(newTitle);
  });

  it("本文を更新するとバージョン履歴が追加されること", () => {
    // Arrange
    const content = createTestContent();
    const aggregate = createContentAggregate(content);
    const newBody = "新しい本文";
    const originalBody = content.body;
    const originalVersionsLength = content.versions.length;

    // Act
    const updatedAggregateResult = aggregate.updateBody(newBody);
    
    // Assert
    expect(updatedAggregateResult.isOk()).toBe(true);
    
    // 元のコンテンツの本文は変更されていないことを確認
    expect(content.body).toBe(originalBody);
    
    // 更新後のコンテンツにバージョンが追加されていることを確認
    const updatedAggregate = updatedAggregateResult._unsafeUnwrap();
    expect(updatedAggregate.content.versions.length).toBe(originalVersionsLength + 1);
    
    // 最新のバージョンの変更内容を確認
    const latestVersion = updatedAggregate.content.versions[updatedAggregate.content.versions.length - 1];
    expect(latestVersion.changes.body).toBe(newBody);
  });

  it("メタデータを更新できること", () => {
    // Arrange
    const content = createTestContent();
    const aggregate = createContentAggregate(content);
    const originalMetadata = content.metadata;
    
    const newMetadata = createContentMetadata({
      tags: ["新しいタグ"],
      categories: ["新しいカテゴリ"],
      language: "en",
      readingTime: 10,
    });

    // Act
    const updatedAggregateResult = aggregate.updateMetadata(newMetadata);
    
    // Assert
    expect(updatedAggregateResult.isOk()).toBe(true);
    
    // 元のコンテンツのメタデータは変更されていないことを確認
    expect(content.metadata).toBe(originalMetadata);
    
    // 更新後のコンテンツのメタデータが変更されていることを確認
    const updatedAggregate = updatedAggregateResult._unsafeUnwrap();
    expect(updatedAggregate.content.metadata).toEqual(newMetadata);
  });

  it("公開範囲を変更できること", () => {
    // Arrange
    const content = createTestContent();
    // 非公開に設定したコンテンツを作成
    const privateContent = content.changeVisibility("private");
    const aggregate = createContentAggregate(privateContent);

    // Act
    const updatedAggregateResult = aggregate.publish();
    
    // Assert
    expect(updatedAggregateResult.isOk()).toBe(true);
    const updatedAggregate = updatedAggregateResult._unsafeUnwrap();
    expect(updatedAggregate.content.visibility).toBe("public");
  });

  it("非公開に設定できること", () => {
    // Arrange
    const content = createTestContent();
    const aggregate = createContentAggregate(content);

    // Act
    const updatedAggregateResult = aggregate.makePrivate();
    
    // Assert
    expect(updatedAggregateResult.isOk()).toBe(true);
    const updatedAggregate = updatedAggregateResult._unsafeUnwrap();
    expect(updatedAggregate.content.visibility).toBe("private");
  });

  it("限定公開に設定できること", () => {
    // Arrange
    const content = createTestContent();
    const aggregate = createContentAggregate(content);

    // Act
    const updatedAggregateResult = aggregate.makeUnlisted();
    
    // Assert
    expect(updatedAggregateResult.isOk()).toBe(true);
    const updatedAggregate = updatedAggregateResult._unsafeUnwrap();
    expect(updatedAggregate.content.visibility).toBe("unlisted");
  });

  it("複数の更新を行った場合、バージョン履歴が正しく記録されること", () => {
    // Arrange
    const content = createTestContent();
    let aggregate = createContentAggregate(content);
    const originalVersionsLength = content.versions.length;

    // Act
    // タイトルを更新
    const titleResult = aggregate.updateTitle("新しいタイトル");
    expect(titleResult.isOk()).toBe(true);
    aggregate = titleResult._unsafeUnwrap();

    // 本文を更新
    const bodyResult = aggregate.updateBody("新しい本文");
    expect(bodyResult.isOk()).toBe(true);
    aggregate = bodyResult._unsafeUnwrap();

    // メタデータを更新
    const newMetadata = createContentMetadata({
      tags: ["新しいタグ"],
      categories: ["新しいカテゴリ"],
      language: "en",
      readingTime: 10,
    });

    const metadataResult = aggregate.updateMetadata(newMetadata);
    expect(metadataResult.isOk()).toBe(true);
    aggregate = metadataResult._unsafeUnwrap();

    // Assert
    // バージョン履歴の数を確認
    expect(aggregate.content.versions.length).toBe(originalVersionsLength + 2); // タイトルと本文の更新でバージョンが追加される
    
    // 各バージョンの変更内容を確認
    const titleVersion = aggregate.content.versions.find(v => v.changes.title === "新しいタイトル");
    const bodyVersion = aggregate.content.versions.find(v => v.changes.body === "新しい本文");
    
    expect(titleVersion).toBeDefined();
    expect(bodyVersion).toBeDefined();
    
    // メタデータの更新を確認
    expect(aggregate.content.metadata.language).toBe("en");
  });
}); 