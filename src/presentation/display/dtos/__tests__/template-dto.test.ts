/**
 * テンプレートDTOのテスト
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { describe, it } from "https://deno.land/std/testing/bdd.ts";

import {
  ViewTemplate,
  TemplateComponent
} from "./deps.ts";

import { toTemplateDto } from "../template-dto.ts";

describe("toTemplateDto", () => {
  it("テンプレートエンティティからDTOに変換できる", () => {
    // テスト用のテンプレートエンティティを作成
    const components: TemplateComponent[] = [
      {
        id: "header-1",
        type: "header",
        props: { content: "ヘッダーコンテンツ" }
      },
      {
        id: "content-1",
        type: "content",
        props: {}
      }
    ];
    
    const template = new ViewTemplate({
      id: "test-template-id",
      name: "テストテンプレート",
      description: "テストテンプレートの説明",
      layout: "blog",
      components: components,
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-02T00:00:00Z")
    });
    
    // DTOに変換
    const dto = toTemplateDto(template);
    
    // 検証
    assertEquals(dto.id, "test-template-id");
    assertEquals(dto.name, "テストテンプレート");
    assertEquals(dto.description, "テストテンプレートの説明");
    assertEquals(dto.metadata?.layout, "blog");
    assertEquals(dto.metadata?.components?.length, 2);
    assertEquals(dto.metadata?.components?.[0].id, "header-1");
    assertEquals(dto.metadata?.components?.[0].type, "header");
    assertEquals(dto.createdAt, "2023-01-01T00:00:00.000Z");
    assertEquals(dto.updatedAt, "2023-01-02T00:00:00.000Z");
  });
  
  it("説明やメタデータがないテンプレートも変換できる", () => {
    // 最小限のテンプレートエンティティを作成
    const template = new ViewTemplate({
      id: "minimal-template-id",
      name: "最小限テンプレート",
      description: "",
      layout: "default",
      components: [],
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-02T00:00:00Z")
    });
    
    // DTOに変換
    const dto = toTemplateDto(template);
    
    // 検証
    assertEquals(dto.id, "minimal-template-id");
    assertEquals(dto.name, "最小限テンプレート");
    assertEquals(dto.description, "");
    assertEquals(dto.metadata?.layout, "default");
    assertEquals(dto.metadata?.components?.length, 0);
    assertEquals(dto.createdAt, "2023-01-01T00:00:00.000Z");
    assertEquals(dto.updatedAt, "2023-01-02T00:00:00.000Z");
  });
}); 