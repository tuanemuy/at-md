import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { TemplateView } from "../template-view.ts";
import { TemplateDto } from "../../dtos/template-dto.ts";

describe("TemplateView", () => {
  it("render - テンプレートを使用して正しくHTMLをレンダリングできること", () => {
    // テスト用のデータを準備
    const templateDto: TemplateDto = {
      id: "template-1",
      name: "テストテンプレート",
      description: "テスト用のテンプレートです",
      metadata: {
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
            props: {}
          },
          {
            id: "footer-1",
            type: "footer",
            props: { content: "フッターコンテンツ" }
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // TemplateViewのインスタンスを作成
    const templateView = new TemplateView();

    // レンダリングを実行
    const result = templateView.render(templateDto);

    // レンダリング結果を検証
    expect(result.name).toBe("テストテンプレート");
    expect(result.layout).toBe("blog");

    // HTMLの検証
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<title>テストテンプレート - テンプレートプレビュー</title>");
    expect(result.html).toContain("<h1>テストテンプレート</h1>");
    expect(result.html).toContain("<p>レイアウト: blog</p>");
    expect(result.html).toContain("<p>説明: テスト用のテンプレートです</p>");
    expect(result.html).toContain('data-template="blog"');
    expect(result.html).toContain("<header>ヘッダーコンテンツ</header>");
    expect(result.html).toContain("<main>コンテンツ領域</main>");
    expect(result.html).toContain("<footer>フッターコンテンツ</footer>");
  });

  it("render - 説明がない場合も正しくレンダリングできること", () => {
    // 説明のないテンプレートを準備
    const templateDto: TemplateDto = {
      id: "template-2",
      name: "説明なしテンプレート",
      description: "", // 空の説明を設定
      metadata: {
        layout: "default",
        components: [
          {
            id: "content-1",
            type: "content",
            props: {}
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // TemplateViewのインスタンスを作成
    const templateView = new TemplateView();

    // レンダリングを実行
    const result = templateView.render(templateDto);

    // レンダリング結果を検証
    expect(result.name).toBe("説明なしテンプレート");
    expect(result.layout).toBe("default");

    // HTMLの検証
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<title>説明なしテンプレート - テンプレートプレビュー</title>");
    expect(result.html).toContain("<h1>説明なしテンプレート</h1>");
    expect(result.html).toContain("<p>レイアウト: default</p>");
    expect(result.html).not.toContain("<p>説明:");
    expect(result.html).toContain('data-template="default"');
    expect(result.html).toContain("<main>コンテンツ領域</main>");
  });

  it("render - コンポーネントがない場合も正しくレンダリングできること", () => {
    // コンポーネントのないテンプレートを準備
    const templateDto: TemplateDto = {
      id: "template-3",
      name: "空のテンプレート",
      description: "コンポーネントのないテンプレートです",
      metadata: {
        layout: "custom",
        components: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // TemplateViewのインスタンスを作成
    const templateView = new TemplateView();

    // レンダリングを実行
    const result = templateView.render(templateDto);

    // レンダリング結果を検証
    expect(result.name).toBe("空のテンプレート");
    expect(result.layout).toBe("custom");

    // HTMLの検証
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<title>空のテンプレート - テンプレートプレビュー</title>");
    expect(result.html).toContain("<h1>空のテンプレート</h1>");
    expect(result.html).toContain("<p>レイアウト: custom</p>");
    expect(result.html).toContain("<p>説明: コンポーネントのないテンプレートです</p>");
    expect(result.html).toContain('data-template="custom"');
    // コンポーネントがないので、対応するHTMLも含まれていないはず
    expect(result.html).not.toContain("<header>");
    expect(result.html).not.toContain("<main>");
    expect(result.html).not.toContain("<footer>");
  });

  it("render - 様々なタイプのコンポーネントを含むテンプレートを正しくレンダリングできること", () => {
    // 様々なタイプのコンポーネントを含むテンプレートを準備
    const templateDto: TemplateDto = {
      id: "template-4",
      name: "複合テンプレート",
      description: "様々なコンポーネントを含むテンプレート",
      metadata: {
        layout: "portfolio",
        components: [
          {
            id: "header-1",
            type: "header",
            props: { content: "" } // 空のコンテンツ
          },
          {
            id: "content-1",
            type: "content",
            props: {}
          },
          {
            id: "footer-1",
            type: "footer",
            props: { content: "" } // 空のコンテンツ
          },
          {
            id: "custom-1",
            type: "sidebar",
            props: { content: "サイドバーコンテンツ" }
          },
          {
            id: "custom-2",
            type: "gallery",
            props: { images: ["image1.jpg", "image2.jpg"] }
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // TemplateViewのインスタンスを作成
    const templateView = new TemplateView();

    // レンダリングを実行
    const result = templateView.render(templateDto);

    // レンダリング結果を検証
    expect(result.name).toBe("複合テンプレート");
    expect(result.layout).toBe("portfolio");

    // HTMLの検証
    expect(result.html).toContain("<header>ヘッダー</header>"); // デフォルトのヘッダーテキスト
    expect(result.html).toContain("<main>コンテンツ領域</main>");
    expect(result.html).toContain("<footer>フッター</footer>"); // デフォルトのフッターテキスト
    expect(result.html).toContain('<div class="sidebar">サイドバーコンテンツ</div>'); // カスタムコンポーネント
    expect(result.html).toContain('<div class="gallery">コンポーネント</div>'); // カスタムコンポーネント
    expect(result.html).toContain('data-template="portfolio"');
  });
}); 