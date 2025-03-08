import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Page } from "../../../../core/display/entities/page.ts";
import { PageMetadata } from "../../../../core/display/value-objects/page-metadata.ts";
import { toPageDto } from "../page-dto.ts";

describe("PageDTO", () => {
  it("toPageDto - ページエンティティをDTOに正しく変換できること", () => {
    // テスト用のデータを準備
    const now = new Date();
    const metadata = new PageMetadata({
      description: "テスト説明",
      ogImage: "https://example.com/image.jpg",
      keywords: ["テスト", "サンプル"],
      canonicalUrl: "https://example.com/page",
      publishedAt: now,
      updatedAt: now
    });

    const page = new Page({
      id: "page-1",
      contentId: "content-1",
      slug: "test-page",
      title: "テストページ",
      content: "# テスト\nこれはテストです。",
      templateId: "template-1",
      metadata: metadata,
      createdAt: now,
      updatedAt: now
    });

    // 変換を実行
    const dto = toPageDto(page);

    // 変換結果を検証
    expect(dto.id).toBe("page-1");
    expect(dto.contentId).toBe("content-1");
    expect(dto.slug).toBe("test-page");
    expect(dto.title).toBe("テストページ");
    expect(dto.content).toBe("# テスト\nこれはテストです。");
    expect(dto.templateId).toBe("template-1");
    expect(dto.metadata.description).toBe("テスト説明");
    expect(dto.metadata.ogImage).toBe("https://example.com/image.jpg");
    expect(dto.metadata.keywords).toEqual(["テスト", "サンプル"]);
    expect(dto.metadata.canonicalUrl).toBe("https://example.com/page");
    expect(dto.metadata.publishedAt).toBe(now.toISOString());
    expect(dto.metadata.updatedAt).toBe(now.toISOString());
    expect(dto.createdAt).toBe(now.toISOString());
    expect(dto.updatedAt).toBe(now.toISOString());
  });

  it("toPageDto - メタデータの一部がnullの場合も正しく変換できること", () => {
    // 一部のメタデータがnullのページを準備
    const now = new Date();
    const metadata = new PageMetadata({
      // 一部のプロパティのみを設定
      description: "テスト説明",
    });

    const page = new Page({
      id: "page-2",
      contentId: "content-2",
      slug: "test-page-2",
      title: "テストページ2",
      content: "# テスト2\nこれはテスト2です。",
      templateId: "template-2",
      metadata: metadata,
      createdAt: now,
      updatedAt: now
    });

    // 変換を実行
    const dto = toPageDto(page);

    // 変換結果を検証
    expect(dto.id).toBe("page-2");
    expect(dto.metadata.description).toBe("テスト説明");
    expect(dto.metadata.ogImage).toBeUndefined();
    expect(dto.metadata.keywords).toBeUndefined();
    expect(dto.metadata.canonicalUrl).toBeUndefined();
    expect(dto.metadata.publishedAt).toBeUndefined();
    expect(dto.metadata.updatedAt).toBeUndefined();
  });
}); 