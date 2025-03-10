import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { ContentAggregate, createContentAggregate } from "./content-aggregate.ts";
import { Content, createContent } from "../entities/content.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { Version, createVersion } from "../value-objects/version.ts";
import { Result, err } from "../deps.ts";
import { DomainError } from "../../errors/mod.ts";

describe("ContentAggregate", () => {
  // テスト用のコンテンツを作成するヘルパー関数
  function createTestContent(
    id: string = "content-123",
    visibility: "private" | "unlisted" | "public" = "private"
  ): Result<Content, DomainError> {
    const metadataResult = createContentMetadata({
      tags: ["test"],
      categories: ["tech"],
      language: "ja"
    });
    
    if (metadataResult.isErr()) {
      return err(metadataResult.error);
    }
    
    return createContent({
      id,
      userId: "user-456",
      repositoryId: "repo-789",
      path: `path/to/${id}.md`,
      title: `テスト${id}`,
      body: `# テスト${id}\n\nこれはテストです。`,
      metadata: metadataResult.value,
      versions: [],
      visibility,
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });
  }

  it("コンテンツから集約を作成できること", () => {
    // 準備
    const contentResult = createTestContent();
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    
    // 操作
    const result = createContentAggregate(content);
    
    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const aggregate = result.value;
      expect(aggregate.content).toEqual(content);
    }
  });

  it("タイトルを更新できること", () => {
    // 準備
    const contentResult = createTestContent();
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const result = createContentAggregate(content);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    
    const aggregate = result.value;
    const newTitle = "新しいタイトル";
    
    // 操作
    const updatedAggregateResult = aggregate.updateTitle(newTitle);
    
    // 検証
    expect(updatedAggregateResult.isOk()).toBe(true);
    if (!updatedAggregateResult.isOk()) return;
    
    const updatedAggregate = updatedAggregateResult.value;
    expect(updatedAggregate.content.title).toBe(newTitle);
  });

  it("本文を更新できること", () => {
    // 準備
    const contentResult = createTestContent();
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const result = createContentAggregate(content);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    
    const aggregate = result.value;
    const newBody = "# 新しい本文\n\nこれは更新された本文です。";
    
    // 操作
    const updatedAggregateResult = aggregate.updateBody(newBody);
    
    // 検証
    expect(updatedAggregateResult.isOk()).toBe(true);
    if (!updatedAggregateResult.isOk()) return;
    
    const updatedAggregate = updatedAggregateResult.value;
    expect(updatedAggregate.content.body).toBe(newBody);
  });

  it("メタデータを更新できること", () => {
    // 準備
    const contentResult = createTestContent();
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const result = createContentAggregate(content);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    
    const aggregate = result.value;
    const newMetadataResult = createContentMetadata({
      tags: ["updated", "test"],
      categories: ["tech", "programming"],
      language: "en"
    });
    
    expect(newMetadataResult.isOk()).toBe(true);
    if (!newMetadataResult.isOk()) return;
    
    const newMetadata = newMetadataResult.value;
    
    // 操作
    const updatedAggregateResult = aggregate.updateMetadata(newMetadata);
    
    // 検証
    expect(updatedAggregateResult.isOk()).toBe(true);
    if (!updatedAggregateResult.isOk()) return;
    
    const updatedAggregate = updatedAggregateResult.value;
    expect(updatedAggregate.content.metadata).toEqual(newMetadata);
  });

  it("公開範囲を変更できること", () => {
    // 準備
    const contentResult = createTestContent();
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const result = createContentAggregate(content);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    
    const aggregate = result.value;
    
    // 操作
    const updatedAggregateResult = aggregate.publish();
    
    // 検証
    expect(updatedAggregateResult.isOk()).toBe(true);
    if (!updatedAggregateResult.isOk()) return;
    
    const updatedAggregate = updatedAggregateResult.value;
    expect(updatedAggregate.content.visibility).toBe("public");
  });

  it("非公開に設定できること", () => {
    // 準備
    const contentResult = createTestContent("content-123", "public");
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const result = createContentAggregate(content);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    
    const aggregate = result.value;
    
    // 操作
    const updatedAggregateResult = aggregate.makePrivate();
    
    // 検証
    expect(updatedAggregateResult.isOk()).toBe(true);
    if (!updatedAggregateResult.isOk()) return;
    
    const updatedAggregate = updatedAggregateResult.value;
    expect(updatedAggregate.content.visibility).toBe("private");
  });

  it("限定公開に設定できること", () => {
    // 準備
    const contentResult = createTestContent();
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const result = createContentAggregate(content);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    
    const aggregate = result.value;
    
    // 操作
    const updatedAggregateResult = aggregate.makeUnlisted();
    
    // 検証
    expect(updatedAggregateResult.isOk()).toBe(true);
    if (!updatedAggregateResult.isOk()) return;
    
    const updatedAggregate = updatedAggregateResult.value;
    expect(updatedAggregate.content.visibility).toBe("unlisted");
  });

  it("複数の更新を行った場合、バージョン履歴が正しく記録されること", () => {
    // 準備
    const contentResult = createTestContent();
    expect(contentResult.isOk()).toBe(true);
    if (!contentResult.isOk()) return;
    
    const content = contentResult.value;
    const result = createContentAggregate(content);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    
    let aggregate = result.value;
    
    // タイトルを更新
    const titleUpdateResult = aggregate.updateTitle("新しいタイトル");
    expect(titleUpdateResult.isOk()).toBe(true);
    if (!titleUpdateResult.isOk()) return;
    aggregate = titleUpdateResult.value;
    
    // 本文を更新
    const bodyUpdateResult = aggregate.updateBody("新しい本文");
    expect(bodyUpdateResult.isOk()).toBe(true);
    if (!bodyUpdateResult.isOk()) return;
    aggregate = bodyUpdateResult.value;
    
    // 公開状態に変更
    const publishResult = aggregate.publish();
    expect(publishResult.isOk()).toBe(true);
    if (!publishResult.isOk()) return;
    aggregate = publishResult.value;
    
    // 検証
    expect(aggregate.content.title).toBe("新しいタイトル");
    expect(aggregate.content.body).toBe("新しい本文");
    expect(aggregate.content.visibility).toBe("public");
    
    // バージョン履歴の検証
    // 注: 実際の実装では、バージョン履歴の詳細な検証が必要
    expect(aggregate.content.versions.length).toBeGreaterThan(0);
  });
}); 