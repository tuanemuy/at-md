import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { PageView } from "../page-view.ts";
import { PageDto } from "../../dtos/page-dto.ts";
import { TemplateDto } from "../../dtos/template-dto.ts";

describe("PageView", () => {
  it("render - ページとテンプレートを使用して正しくHTMLをレンダリングできること", () => {
    // テスト用のデータを準備
    const pageDto: PageDto = {
      id: "page-1",
      contentId: "content-1",
      slug: "test-page",
      title: "テストページ",
      content: "# テスト\nこれはテストです。",
      templateId: "template-1",
      metadata: {
        description: "テスト説明",
        ogImage: "https://example.com/image.jpg",
        keywords: ["テスト", "サンプル"],
        canonicalUrl: "https://example.com/page",
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const templateDto: TemplateDto = {
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
          props: {}
        },
        {
          id: "footer-1",
          type: "footer",
          props: { content: "フッターコンテンツ" }
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // PageViewのインスタンスを作成
    const pageView = new PageView();

    // レンダリングを実行
    const result = pageView.render(pageDto, templateDto);

    // レンダリング結果を検証
    expect(result.title).toBe("テストページ");
    expect(result.metadata.description).toBe("テスト説明");
    expect(result.metadata.ogImage).toBe("https://example.com/image.jpg");
    expect(result.metadata.keywords).toEqual(["テスト", "サンプル"]);
    expect(result.metadata.canonicalUrl).toBe("https://example.com/page");

    // HTMLの検証
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<title>テストページ</title>");
    expect(result.html).toContain('<meta name="description" content="テスト説明">');
    expect(result.html).toContain('<meta property="og:image" content="https://example.com/image.jpg">');
    expect(result.html).toContain('<meta name="keywords" content="テスト, サンプル">');
    expect(result.html).toContain('<link rel="canonical" href="https://example.com/page">');
    expect(result.html).toContain('data-template="blog"');
    expect(result.html).toContain("<header>ヘッダーコンテンツ</header>");
    expect(result.html).toContain("<main># テスト\nこれはテストです。</main>");
    expect(result.html).toContain("<footer>フッターコンテンツ</footer>");
  });

  it("render - メタデータが部分的に欠けている場合も正しくレンダリングできること", () => {
    // メタデータが部分的に欠けているページを準備
    const pageDto: PageDto = {
      id: "page-2",
      contentId: "content-2",
      slug: "test-page-2",
      title: "テストページ2",
      content: "# テスト2\nこれはテスト2です。",
      templateId: "template-2",
      metadata: {
        // 一部のメタデータのみを設定
        description: "テスト説明2"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const templateDto: TemplateDto = {
      id: "template-2",
      name: "シンプルテンプレート",
      layout: "default",
      components: [
        {
          id: "content-1",
          type: "content",
          props: {}
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // PageViewのインスタンスを作成
    const pageView = new PageView();

    // レンダリングを実行
    const result = pageView.render(pageDto, templateDto);

    // レンダリング結果を検証
    expect(result.title).toBe("テストページ2");
    expect(result.metadata.description).toBe("テスト説明2");
    expect(result.metadata.ogImage).toBeUndefined();
    expect(result.metadata.keywords).toBeUndefined();
    expect(result.metadata.canonicalUrl).toBeUndefined();

    // HTMLの検証
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<title>テストページ2</title>");
    expect(result.html).toContain('<meta name="description" content="テスト説明2">');
    expect(result.html).not.toContain('<meta property="og:image"');
    expect(result.html).not.toContain('<meta name="keywords"');
    expect(result.html).not.toContain('<link rel="canonical"');
    expect(result.html).toContain('data-template="default"');
    expect(result.html).toContain("<main># テスト2\nこれはテスト2です。</main>");
  });

  it("render - 様々なタイプのコンポーネントを含むテンプレートを正しくレンダリングできること", () => {
    // テスト用のデータを準備
    const pageDto: PageDto = {
      id: "page-3",
      contentId: "content-3",
      slug: "test-page-3",
      title: "テストページ3",
      content: "# テスト3\nこれはテスト3です。",
      templateId: "template-3",
      metadata: {
        description: "テスト説明3"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const templateDto: TemplateDto = {
      id: "template-3",
      name: "複合テンプレート",
      layout: "custom",
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
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // PageViewのインスタンスを作成
    const pageView = new PageView();

    // レンダリングを実行
    const result = pageView.render(pageDto, templateDto);

    // レンダリング結果を検証
    expect(result.title).toBe("テストページ3");

    // HTMLの検証
    expect(result.html).toContain("<header></header>"); // 空のコンテンツ
    expect(result.html).toContain("<main># テスト3\nこれはテスト3です。</main>");
    expect(result.html).toContain("<footer></footer>"); // 空のコンテンツ
    expect(result.html).toContain('<div class="sidebar">サイドバーコンテンツ</div>'); // カスタムコンポーネント
    expect(result.html).toContain('data-template="custom"');
  });
}); 