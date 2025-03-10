/**
 * ページコントローラー
 * 
 * ページの取得や操作に関するエンドポイントを提供します。
 */

import { Context, Result, ok, err, ApplicationError, EntityNotFoundError, GetPageByIdQuery, GetPageByIdQueryHandler, GetPageBySlugQuery, GetPageBySlugQueryHandler, GetPageByContentIdQuery, GetPageByContentIdQueryHandler, PageAggregate } from "../deps.ts";

/**
 * ページコントローラー
 * ページに関するHTTPリクエストを処理します。
 */
export class PageController {
  private getPageByIdQueryHandler: GetPageByIdQueryHandler;
  private getPageBySlugQueryHandler: GetPageBySlugQueryHandler;
  private getPageByContentIdQueryHandler: GetPageByContentIdQueryHandler;

  /**
   * コンストラクタ
   * @param getPageByIdQueryHandler ページ取得クエリハンドラー
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
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async getPageById(c: Context): Promise<Response> {
    const id = c.req.param("id");
    
    if (!id) {
      return c.json({ error: "ページIDが指定されていません" }, 400);
    }
    
    const query: GetPageByIdQuery = {
      id
    };
    
    try {
      const result = await this.getPageByIdQueryHandler.execute(query);
      
      if (result.isErr()) {
        if (result.error instanceof EntityNotFoundError) {
          return c.json({ error: result.error.message }, 404);
        }
        return c.json({ error: result.error.message }, 500);
      }
      
      return c.json(this.pageToResponse(result.value));
    } catch (error) {
      return c.json({ error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` }, 500);
    }
  }

  /**
   * スラグによるページ取得
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async getPageBySlug(c: Context): Promise<Response> {
    const slug = c.req.param("slug");
    
    if (!slug) {
      return c.json({ error: "ページスラグが指定されていません" }, 400);
    }
    
    const query: GetPageBySlugQuery = {
      slug
    };
    
    try {
      const result = await this.getPageBySlugQueryHandler.execute(query);
      
      if (result.isErr()) {
        if (result.error instanceof EntityNotFoundError) {
          return c.json({ error: result.error.message }, 404);
        }
        return c.json({ error: result.error.message }, 500);
      }
      
      return c.json(this.pageToResponse(result.value));
    } catch (error) {
      return c.json({ error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` }, 500);
    }
  }

  /**
   * コンテンツIDによるページ取得
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async getPageByContentId(c: Context): Promise<Response> {
    const contentId = c.req.param("contentId");
    
    if (!contentId) {
      return c.json({ error: "コンテンツIDが指定されていません" }, 400);
    }
    
    const query: GetPageByContentIdQuery = {
      contentId
    };
    
    try {
      const result = await this.getPageByContentIdQueryHandler.execute(query);
      
      if (result.isErr()) {
        if (result.error instanceof EntityNotFoundError) {
          return c.json({ error: result.error.message }, 404);
        }
        return c.json({ error: result.error.message }, 500);
      }
      
      return c.json(this.pageToResponse(result.value));
    } catch (error) {
      return c.json({ error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` }, 500);
    }
  }

  /**
   * ページ集約をレスポンス用のオブジェクトに変換する
   * @param pageAggregate ページ集約
   * @returns レスポンス用オブジェクト
   */
  private pageToResponse(pageAggregate: PageAggregate): Record<string, unknown> {
    const page = pageAggregate.page;
    const metadata = page.metadata;
    
    return {
      id: page.id,
      contentId: page.contentId,
      slug: metadata.slug,
      title: metadata.title,
      description: metadata.description,
      template: page.templateId,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt
    };
  }
} 