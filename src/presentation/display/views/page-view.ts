import { PageDto } from "../dtos/page-dto.ts";
import { TemplateDto } from "../dtos/template-dto.ts";

/**
 * ページビューのレンダリング結果
 */
export interface PageRenderResult {
  html: string;
  title: string;
  metadata: {
    description?: string;
    ogImage?: string;
    keywords?: string[];
    canonicalUrl?: string;
    publishedAt?: string;
    updatedAt?: string;
  };
}

// テンプレートコンポーネントの型定義
interface TemplateComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

/**
 * ページビュー
 * 
 * ページとテンプレートを使用してHTMLをレンダリングする
 */
export class PageView {
  /**
   * ページをレンダリングする
   * 
   * @param page ページDTO
   * @param template テンプレートDTO
   * @returns レンダリング結果
   */
  render(page: PageDto, template: TemplateDto): PageRenderResult {
    // ここでは簡易的なレンダリングを行う
    // 実際の実装では、テンプレートエンジンを使用してHTMLを生成する
    
    // メタデータの構築
    const metadata = {
      description: page.metadata?.description,
      ogImage: page.metadata?.ogImage,
      keywords: page.metadata?.keywords,
      canonicalUrl: page.metadata?.canonicalUrl,
      publishedAt: page.metadata?.publishedAt,
      updatedAt: page.metadata?.updatedAt,
    };
    
    // テンプレートのコンポーネントを使用してHTMLを生成
    // ここでは簡易的な実装
    const templateMetadata = template.metadata || {};
    const components = templateMetadata.components as TemplateComponent[] || [];
    const layout = templateMetadata.layout || 'default';
    
    const componentHtml = components
      .map(component => {
        // コンポーネントタイプに応じたレンダリング
        switch (component.type) {
          case "header":
            return `<header>${component.props.content || ""}</header>`;
          case "footer":
            return `<footer>${component.props.content || ""}</footer>`;
          case "content":
            return `<main>${page.metadata?.content || ""}</main>`;
          default:
            return `<div class="${component.type}">${component.props.content || ""}</div>`;
        }
      })
      .join("\n");
    
    // 最終的なHTMLの生成
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${page.title}</title>
          ${metadata.description ? `<meta name="description" content="${metadata.description}">` : ""}
          ${metadata.ogImage ? `<meta property="og:image" content="${metadata.ogImage}">` : ""}
          ${metadata.canonicalUrl ? `<link rel="canonical" href="${metadata.canonicalUrl}">` : ""}
          ${metadata.keywords && metadata.keywords.length > 0 ? 
            `<meta name="keywords" content="${metadata.keywords.join(", ")}">` : ""}
        </head>
        <body data-template="${layout}">
          ${componentHtml}
        </body>
      </html>
    `;
    
    return {
      html,
      title: page.title,
      metadata,
    };
  }
} 