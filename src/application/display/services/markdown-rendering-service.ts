import { Result, err, ok } from "../deps.ts";
import { ApplicationError } from "../deps.ts";
import { RenderingOptions } from "../deps.ts";
import { RenderingService } from "../deps.ts";
import { PageAggregate } from "../deps.ts";

/**
 * マークダウンレンダリングサービスのエラー型
 */
export type MarkdownRenderingServiceError = ApplicationError;

/**
 * マークダウンレンダリングサービス
 * 
 * マークダウンのレンダリングやページのレンダリングを行うサービス
 */
export class MarkdownRenderingService {
  constructor(private readonly renderingService: RenderingService) {}

  /**
   * マークダウンをHTMLにレンダリングする
   * 
   * @param markdown レンダリングするマークダウン
   * @param options レンダリングオプション
   * @returns レンダリング結果のHTML
   */
  async renderMarkdown(
    markdown: string,
    options: RenderingOptions
  ): Promise<Result<string, MarkdownRenderingServiceError>> {
    try {
      // コアドメインのレンダリングサービスを使用してマークダウンをレンダリング
      const html = await this.renderingService.renderMarkdown(markdown, options);
      return ok(html);
    } catch (error) {
      return err(new ApplicationError(
        `Failed to render markdown: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * ページをレンダリングする
   * 
   * @param page レンダリングするページ集約
   * @returns レンダリング結果のHTML
   */
  async renderPage(
    page: PageAggregate
  ): Promise<Result<string, MarkdownRenderingServiceError>> {
    try {
      // コアドメインのレンダリングサービスを使用してページをレンダリング
      const html = await this.renderingService.renderPage(page);
      return ok(html);
    } catch (error) {
      return err(new ApplicationError(
        `Failed to render page: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * OGイメージを生成する
   * 
   * @param page OGイメージを生成するページ集約
   * @returns 生成されたOGイメージのURL
   */
  async generateOgImage(
    page: PageAggregate
  ): Promise<Result<string, MarkdownRenderingServiceError>> {
    try {
      // コアドメインのレンダリングサービスを使用してOGイメージを生成
      const imageUrl = await this.renderingService.generateOgImage(page);
      return ok(imageUrl);
    } catch (error) {
      return err(new ApplicationError(
        `Failed to generate OG image: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }
} 