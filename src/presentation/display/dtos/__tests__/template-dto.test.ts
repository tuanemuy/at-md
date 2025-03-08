import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { ViewTemplate } from "../../../../core/display/entities/view-template.ts";
import { toTemplateDto } from "../template-dto.ts";

describe("TemplateDTO", () => {
  it("toTemplateDto - テンプレートエンティティをDTOに正しく変換できること", () => {
    // テスト用のデータを準備
    const now = new Date();
    const template = new ViewTemplate({
      id: "template-1",
      name: "テストテンプレート",
      description: "テスト用のテンプレートです",
      layout: "blog",
      components: [
        {
          id: "header-1",
          type: "header",
          props: { content: "ヘッダーコンテンツ" }
        },
        {
          id: "content-1",
          type: "content",
          props: { maxWidth: 800 }
        },
        {
          id: "footer-1",
          type: "footer",
          props: { content: "フッターコンテンツ" }
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    // 変換を実行
    const dto = toTemplateDto(template);

    // 変換結果を検証
    expect(dto.id).toBe("template-1");
    expect(dto.name).toBe("テストテンプレート");
    expect(dto.description).toBe("テスト用のテンプレートです");
    expect(dto.layout).toBe("blog");
    expect(dto.components.length).toBe(3);
    
    // コンポーネントの検証
    expect(dto.components[0].id).toBe("header-1");
    expect(dto.components[0].type).toBe("header");
    expect(dto.components[0].props.content).toBe("ヘッダーコンテンツ");
    
    expect(dto.components[1].id).toBe("content-1");
    expect(dto.components[1].type).toBe("content");
    expect(dto.components[1].props.maxWidth).toBe(800);
    
    expect(dto.components[2].id).toBe("footer-1");
    expect(dto.components[2].type).toBe("footer");
    expect(dto.components[2].props.content).toBe("フッターコンテンツ");
    
    expect(dto.createdAt).toBe(now.toISOString());
    expect(dto.updatedAt).toBe(now.toISOString());
  });

  it("toTemplateDto - 説明がない場合も正しく変換できること", () => {
    // 説明のないテンプレートを準備
    const now = new Date();
    const template = new ViewTemplate({
      id: "template-2",
      name: "説明なしテンプレート",
      layout: "default",
      components: [],
      createdAt: now,
      updatedAt: now
    });

    // 変換を実行
    const dto = toTemplateDto(template);

    // 変換結果を検証
    expect(dto.id).toBe("template-2");
    expect(dto.name).toBe("説明なしテンプレート");
    expect(dto.description).toBeUndefined();
    expect(dto.layout).toBe("default");
    expect(dto.components.length).toBe(0);
    expect(dto.createdAt).toBe(now.toISOString());
    expect(dto.updatedAt).toBe(now.toISOString());
  });
}); 