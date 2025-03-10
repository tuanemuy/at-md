/**
 * テンプレートコントローラー
 * 
 * テンプレートの取得や操作に関するエンドポイントを提供します。
 */

import { Context, Result, ok, err, ApplicationError, EntityNotFoundError, GetTemplateByIdQuery, GetTemplateByIdQueryHandler, GetAllTemplatesQuery, GetAllTemplatesQueryHandler, ViewTemplate } from "../deps.ts";
import { handleError } from "../utils/error-handler.ts";

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
   * テンプレートをIDで取得する
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getTemplateById(c: Context): Promise<Response> {
    try {
      const id = c.req.param("id");

      if (!id) {
        return new Response(JSON.stringify({ error: "テンプレートIDが指定されていません" }), {
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

      return new Response(JSON.stringify({ template: result.value }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * すべてのテンプレートを取得する
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getAllTemplates(c: Context): Promise<Response> {
    try {
      const result = await this.getAllTemplatesQueryHandler.execute({
        name: "GetAllTemplates"
      });

      if (result.isErr()) {
        return new Response(JSON.stringify({ error: result.error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result.value), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * テンプレートを作成する
   * @param c コンテキスト
   * @returns レスポンス
   */
  async createTemplate(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      
      // 現在は実装されていないため、エラーレスポンスを返す
      return new Response(JSON.stringify({ 
        error: "テンプレート作成機能は現在実装されていません" 
      }), {
        status: 501, // Not Implemented
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return handleError(error);
    }
  }
} 