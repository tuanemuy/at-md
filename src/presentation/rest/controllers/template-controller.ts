/**
 * テンプレートコントローラー
 * 
 * テンプレートの取得や操作に関するエンドポイントを提供します。
 */

import { Context } from "hono";
import { ok, err, Result } from "neverthrow";

import { GetTemplateByIdQueryHandler } from "../../../application/display/queries/get-template-by-id-query.ts";
import { GetAllTemplatesQueryHandler } from "../../../application/display/queries/get-all-templates-query.ts";

export class TemplateController {
  private getTemplateByIdQueryHandler: GetTemplateByIdQueryHandler;
  private getAllTemplatesQueryHandler: GetAllTemplatesQueryHandler;

  /**
   * コンストラクタ
   * 
   * @param getTemplateByIdQueryHandler テンプレートIDによるテンプレート取得クエリハンドラー
   * @param getAllTemplatesQueryHandler すべてのテンプレート取得クエリハンドラー
   */
  constructor(
    getTemplateByIdQueryHandler: GetTemplateByIdQueryHandler,
    getAllTemplatesQueryHandler: GetAllTemplatesQueryHandler
  ) {
    this.getTemplateByIdQueryHandler = getTemplateByIdQueryHandler;
    this.getAllTemplatesQueryHandler = getAllTemplatesQueryHandler;
  }

  /**
   * IDによるテンプレート取得
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getTemplateById(c: Context<any, any>): Promise<Response> {
    try {
      const id = c.req.param('id');
      if (!id) {
        return new Response(JSON.stringify({ error: "Template ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await this.getTemplateByIdQueryHandler.execute({
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
   * 全テンプレート取得
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getAllTemplates(c: Context<any, any>): Promise<Response> {
    try {
      const result = await this.getAllTemplatesQueryHandler.execute({});

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