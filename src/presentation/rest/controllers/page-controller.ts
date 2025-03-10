/**
 * ページコントローラー
 * 
 * ページの取得や操作に関するエンドポイントを提供します。
 */

import { Context } from "hono";
import { ok, err, Result } from "neverthrow";

import { GetPageByIdQueryHandler } from "../../../application/display/queries/get-page-by-id-query.ts";
import { GetPageBySlugQueryHandler } from "../../../application/display/queries/get-page-by-slug-query.ts";
import { GetPageByContentIdQueryHandler } from "../../../application/display/queries/get-page-by-content-id-query.ts";

export class PageController {
  private getPageByIdQueryHandler: GetPageByIdQueryHandler;
  private getPageBySlugQueryHandler: GetPageBySlugQueryHandler;
  private getPageByContentIdQueryHandler: GetPageByContentIdQueryHandler;

  /**
   * コンストラクタ
   * 
   * @param getPageByIdQueryHandler ページIDによるページ取得クエリハンドラー
   * @param getPageBySlugQueryHandler スラグによるページ取得クエリハンドラー
   * @param getPageByContentIdQueryHandler コンテンツIDによるページ取得クエリハンドラー
   */
  constructor(
    getPageByIdQueryHandler: GetPageByIdQueryHandler,
    getPageBySlugQueryHandler: GetPageBySlugQueryHandler,
    getPageByContentIdQueryHandler: GetPageByContentIdQueryHandler
  ) {
    this.getPageByIdQueryHandler = getPageByIdQueryHandler;
    this.getPageBySlugQueryHandler = getPageBySlugQueryHandler;
    this.getPageByContentIdQueryHandler = getPageByContentIdQueryHandler;
  }

  /**
   * IDによるページ取得
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getPageById(c: Context<any, any>): Promise<Response> {
    try {
      const id = c.req.param('id');
      if (!id) {
        return new Response(JSON.stringify({ error: "Page ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await this.getPageByIdQueryHandler.execute({
        id,
      });

      if (result.isErr()) {
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result.value), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * スラッグによるページ取得
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getPageBySlug(c: Context<any, any>): Promise<Response> {
    try {
      const slug = c.req.param('slug');
      if (!slug) {
        return new Response(JSON.stringify({ error: "Page slug is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await this.getPageBySlugQueryHandler.execute({
        slug,
      });

      if (result.isErr()) {
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result.value), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * コンテンツIDによるページ取得
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getPageByContentId(c: Context<any, any>): Promise<Response> {
    try {
      const contentId = c.req.param('contentId');
      if (!contentId) {
        return new Response(JSON.stringify({ error: "Content ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await this.getPageByContentIdQueryHandler.execute({
        contentId,
      });

      if (result.isErr()) {
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result.value), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 