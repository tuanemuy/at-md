/**
 * ページDTOのテスト
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { describe, it } from "https://deno.land/std/testing/bdd.ts";

import {
  Page,
  PageMetadata
} from "./deps.ts";

import { toPageDto, createPageMetadataFromDto } from "../page-dto.ts";

describe("toPageDto", () => {
  it("ページエンティティからDTOに変換できる", () => {
    // テスト用のページエンティティを作成
    const page = new Page({
      id: "test-page-id",
      slug: "test-page",
      title: "テストページ",
      content: "テストコンテンツ",
      contentId: "test-content-id",
      templateId: "test-template-id",
      metadata: new PageMetadata({
        description: "テストページの説明",
        keywords: ["test", "page"],
        ogImage: "https://example.com/image.jpg"
      }),
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-02T00:00:00Z")
    });
    
    // DTOに変換
    const dto = toPageDto(page);
    
    // 検証
    assertEquals(dto.id, "test-page-id");
    assertEquals(dto.slug, "test-page");
    assertEquals(dto.title, "テストページ");
    assertEquals(dto.contentId, "test-content-id");
    assertEquals(dto.templateId, "test-template-id");
    assertEquals(dto.metadata?.description, "テストページの説明");
    assertEquals(dto.metadata?.keywords, ["test", "page"]);
    assertEquals(dto.metadata?.ogImage, "https://example.com/image.jpg");
    assertEquals(dto.metadata?.content, "テストコンテンツ");
    assertEquals(dto.createdAt, "2023-01-01T00:00:00.000Z");
    assertEquals(dto.updatedAt, "2023-01-02T00:00:00.000Z");
  });
});

describe("createPageMetadataFromDto", () => {
  it("DTOからページメタデータを作成できる", () => {
    // テスト用のDTOを作成
    const dto = {
      title: "テストページ",
      metadata: {
        description: "テストページの説明",
        keywords: ["test", "page"],
        ogImage: "https://example.com/image.jpg"
      }
    };
    
    // ページメタデータに変換
    const metadata = createPageMetadataFromDto(dto);
    
    // 検証
    assertEquals(metadata.description, "テストページの説明");
    assertEquals(metadata.keywords, ["test", "page"]);
    assertEquals(metadata.ogImage, "https://example.com/image.jpg");
  });
  
  it("不完全なDTOからもページメタデータを作成できる", () => {
    // 不完全なDTOを作成
    const dto = {
      title: "タイトルのみ"
    };
    
    // ページメタデータに変換
    const metadata = createPageMetadataFromDto(dto);
    
    // 検証
    assertEquals(metadata.description, undefined);
    assertEquals(metadata.keywords, undefined);
    assertEquals(metadata.ogImage, undefined);
  });
}); 