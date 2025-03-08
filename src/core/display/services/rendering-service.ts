import { RenderingOptions } from "../value-objects/rendering-options.ts";
import { PageAggregate } from "../aggregates/page-aggregate.ts";

/**
 * レンダリングサービスインターフェース
 * 
 * マークダウンのレンダリングやOGイメージの生成などの機能を提供する
 */
export interface RenderingService {
  /**
   * ページをレンダリングする
   * 
   * @param page レンダリングするページ集約
   * @returns レンダリング結果のHTML
   */
  renderPage(page: PageAggregate): Promise<string>;

  /**
   * マークダウンをHTMLにレンダリングする
   * 
   * @param markdown レンダリングするマークダウン
   * @param options レンダリングオプション
   * @returns レンダリング結果のHTML
   */
  renderMarkdown(markdown: string, options: RenderingOptions): Promise<string>;

  /**
   * OGイメージを生成する
   * 
   * @param page OGイメージを生成するページ集約
   * @returns 生成されたOGイメージのURL
   */
  generateOgImage(page: PageAggregate): Promise<string>;
}

/**
 * デフォルトのレンダリングサービス実装
 */
export class DefaultRenderingService implements RenderingService {
  /**
   * ページをレンダリングする
   * 
   * @param page レンダリングするページ集約
   * @returns レンダリング結果のHTML
   */
  async renderPage(page: PageAggregate): Promise<string> {
    // ページのコンテンツをマークダウンからHTMLに変換
    const contentHtml = await this.renderMarkdown(
      page.content,
      page.renderingOptions
    );

    // 実際の実装では、テンプレートを取得してHTMLを組み立てる
    // ここではシンプルな実装としてHTMLを直接返す
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${page.title}</title>
          ${page.metadata.description ? `<meta name="description" content="${page.metadata.description}">` : ''}
          ${page.metadata.ogImage ? `<meta property="og:image" content="${page.metadata.ogImage}">` : ''}
          ${page.metadata.canonicalUrl ? `<link rel="canonical" href="${page.metadata.canonicalUrl}">` : ''}
        </head>
        <body>
          <h1>${page.title}</h1>
          <div class="content">
            ${contentHtml}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * マークダウンをHTMLにレンダリングする
   * 
   * @param markdown レンダリングするマークダウン
   * @param options レンダリングオプション
   * @returns レンダリング結果のHTML
   */
  async renderMarkdown(markdown: string, options: RenderingOptions): Promise<string> {
    // 実際の実装では、マークダウンパーサーを使用してHTMLに変換する
    // ここではシンプルな実装として、マークダウンをそのままHTMLとして返す
    let html = markdown
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // コードハイライトが有効な場合
    if (options.codeHighlighting) {
      html = html.replace(/```(.*?)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code class="language-${lang}">${code}</code></pre>`;
      });
    }

    // 数式レンダリングが有効な場合
    if (options.renderMath) {
      // 実際の実装では、MathJaxなどを使用して数式をレンダリングする
      html = html.replace(/\$\$(.*?)\$\$/g, '<div class="math">$1</div>');
    }

    // ダイアグラムレンダリングが有効な場合
    if (options.renderDiagrams) {
      // 実際の実装では、mermaidなどを使用してダイアグラムをレンダリングする
      html = html.replace(/```mermaid([\s\S]*?)```/g, '<div class="mermaid">$1</div>');
    }

    return `<p>${html}</p>`;
  }

  /**
   * OGイメージを生成する
   * 
   * @param page OGイメージを生成するページ集約
   * @returns 生成されたOGイメージのURL
   */
  async generateOgImage(page: PageAggregate): Promise<string> {
    // 既にOGイメージが設定されている場合はそれを返す
    if (page.metadata.ogImage) {
      return page.metadata.ogImage;
    }

    // 実際の実装では、タイトルなどを使用して動的にOGイメージを生成する
    // ここではシンプルな実装としてダミーURLを返す
    return `https://example.com/og-images/${page.id}.png`;
  }
} 