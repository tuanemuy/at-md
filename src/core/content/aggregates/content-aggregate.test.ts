import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { ContentAggregate, createContentAggregate } from "./content-aggregate.ts";
import { Content, createContent } from "../entities/content.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { Version, createVersion } from "../value-objects/version.ts";

describe("ContentAggregate", () => {
  // テスト用のコンテンツを作成するヘルパー関数
  function createTestContent(
    id: string = "content-123",
    visibility: "private" | "unlisted" | "public" = "private"
  ): Content {
    return createContent({
      id,
      userId: "user-456",
      repositoryId: "repo-789",
      path: `path/to/${id}.md`,
      title: `テスト${id}`,
      body: `# テスト${id}\n\nこれはテストです。`,
      metadata: createContentMetadata({
        tags: ["test"],
        categories: ["tech"],
        language: "ja"
      }),
      versions: [],
      visibility,
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });
  }

  it("コンテンツから集約を作成できること", () => {
    // 準備
    const content = createTestContent();
    
    // 操作
    const aggregate = createContentAggregate(content);
    
    // 検証
    expect(aggregate.content).toEqual(content);
  });

  it("タイトルを更新できること", () => {
    // 準備
    const content = createTestContent();
    const aggregate = createContentAggregate(content);
    const newTitle = "新しいタイトル";
    
    // 操作
    const updatedAggregate = aggregate.updateTitle(newTitle);
    
    // 検証
    expect(updatedAggregate.content.title).toBe(newTitle);
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
    
    // バージョンが追加されていることを確認
    expect(updatedAggregate.content.versions.length).toBe(1);
    expect(updatedAggregate.content.versions[0].changes.title).toBe(newTitle);
  });

  it("本文を更新できること", () => {
    // 準備
    const content = createTestContent();
    const aggregate = createContentAggregate(content);
    const newBody = "# 新しい本文\n\nこれは更新された本文です。";
    
    // 操作
    const updatedAggregate = aggregate.updateBody(newBody);
    
    // 検証
    expect(updatedAggregate.content.body).toBe(newBody);
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
    
    // バージョンが追加されていることを確認
    expect(updatedAggregate.content.versions.length).toBe(1);
    expect(updatedAggregate.content.versions[0].changes.body).toBe(newBody);
  });

  it("メタデータを更新できること", () => {
    // 準備
    const content = createTestContent();
    const aggregate = createContentAggregate(content);
    const newMetadata = createContentMetadata({
      tags: ["updated", "test"],
      categories: ["tech", "programming"],
      language: "ja",
      readingTime: 5
    });
    
    // 操作
    const updatedAggregate = aggregate.updateMetadata(newMetadata);
    
    // 検証
    expect(updatedAggregate.content.metadata).toEqual(newMetadata);
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
    
    // バージョンが追加されていることを確認
    expect(updatedAggregate.content.versions.length).toBe(1);
    expect(updatedAggregate.content.versions[0].changes.metadata).toEqual(newMetadata);
  });

  it("公開範囲を変更できること", () => {
    // 準備
    const content = createTestContent();
    const aggregate = createContentAggregate(content);
    
    // 操作
    const updatedAggregate = aggregate.publish();
    
    // 検証
    expect(updatedAggregate.content.visibility).toBe("public");
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });

  it("非公開に設定できること", () => {
    // 準備
    const content = createTestContent("content-123", "public");
    const aggregate = createContentAggregate(content);
    
    // 操作
    const updatedAggregate = aggregate.makePrivate();
    
    // 検証
    expect(updatedAggregate.content.visibility).toBe("private");
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });

  it("限定公開に設定できること", () => {
    // 準備
    const content = createTestContent();
    const aggregate = createContentAggregate(content);
    
    // 操作
    const updatedAggregate = aggregate.makeUnlisted();
    
    // 検証
    expect(updatedAggregate.content.visibility).toBe("unlisted");
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });

  it("複数の更新を行った場合、バージョン履歴が正しく記録されること", () => {
    // 準備
    const content = createTestContent();
    let aggregate = createContentAggregate(content);
    
    // 操作: タイトルを更新
    aggregate = aggregate.updateTitle("新しいタイトル");
    
    // 操作: 本文を更新
    aggregate = aggregate.updateBody("新しい本文");
    
    // 操作: メタデータを更新
    const newMetadata = createContentMetadata({
      tags: ["updated"],
      categories: ["programming"],
      language: "ja"
    });
    aggregate = aggregate.updateMetadata(newMetadata);
    
    // 検証
    expect(aggregate.content.versions.length).toBe(3);
    expect(aggregate.content.versions[0].changes.title).toBe("新しいタイトル");
    expect(aggregate.content.versions[1].changes.body).toBe("新しい本文");
    expect(aggregate.content.versions[2].changes.metadata).toEqual(newMetadata);
  });
}); 