import { TemplateDto } from "../dtos/template-dto.ts";

/**
 * テンプレートビューのレンダリング結果
 */
export interface TemplateRenderResult {
  html: string;
  name: string;
  layout: string;
}

/**
 * テンプレートビュー
 * 
 * テンプレートのプレビューをレンダリングする
 */
export class TemplateView {
  /**
   * テンプレートをレンダリングする
   * 
   * @param template テンプレートDTO
   * @returns レンダリング結果
   */
  render(template: TemplateDto): TemplateRenderResult {
    // ここでは簡易的なレンダリングを行う
    // 実際の実装では、テンプレートエンジンを使用してHTMLを生成する
    
    // テンプレートのコンポーネントを使用してHTMLを生成
    // ここでは簡易的な実装
    const componentHtml = template.components
      .map(component => {
        // コンポーネントタイプに応じたレンダリング
        switch (component.type) {
          case "header":
            return `<header>${component.props.content || "ヘッダー"}</header>`;
          case "footer":
            return `<footer>${component.props.content || "フッター"}</footer>`;
          case "content":
            return `<main>コンテンツ領域</main>`;
          default:
            return `<div class="${component.type}">${component.props.content || "コンポーネント"}</div>`;
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
          <title>${template.name} - テンプレートプレビュー</title>
          <style>
            body {
              font-family: sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
            }
            header, footer {
              background-color: #f5f5f5;
              padding: 1rem;
              text-align: center;
            }
            main {
              padding: 2rem;
              min-height: 300px;
              background-color: #fafafa;
              border: 1px dashed #ccc;
            }
            .preview-info {
              background-color: #e9f5ff;
              padding: 1rem;
              margin-bottom: 1rem;
              border-radius: 4px;
            }
          </style>
        </head>
        <body data-template="${template.layout}">
          <div class="preview-info">
            <h1>${template.name}</h1>
            <p>レイアウト: ${template.layout}</p>
            ${template.description ? `<p>説明: ${template.description}</p>` : ""}
          </div>
          ${componentHtml}
        </body>
      </html>
    `;
    
    return {
      html,
      name: template.name,
      layout: template.layout,
    };
  }
} 