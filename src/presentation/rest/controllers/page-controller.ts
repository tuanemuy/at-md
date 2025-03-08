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
   * ページIDによるページ取得
   * 
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getPageById(c: Context): Promise<Response> {
    try {
      const id = c.params.id;
      if (!id) {
        return new Response(JSON.stringify({ error: "Page ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await this.getPageByIdQueryHandler.execute({
        name: "GetPageById",
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
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * スラグによるページ取得
   * 
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getPageBySlug(c: Context): Promise<Response> {
    try {
      const slug = c.params.slug;
      if (!slug) {
        return new Response(JSON.stringify({ error: "Page slug is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await this.getPageBySlugQueryHandler.execute({
        name: "GetPageBySlug",
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
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * コンテンツIDによるページ取得
   * 
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getPageByContentId(c: Context): Promise<Response> {
    try {
      const contentId = c.params.contentId;
      if (!contentId) {
        return new Response(JSON.stringify({ error: "Content ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await this.getPageByContentIdQueryHandler.execute({
        name: "GetPageByContentId",
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
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
} 