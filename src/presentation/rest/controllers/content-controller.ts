/**
 * コンテンツコントローラー
 * 
 * コンテンツの取得や操作に関するエンドポイントを提供します。
 */

import { Context, Result, GetContentByIdQuery, GetContentByIdQueryHandler, CreateContentCommand, CreateContentCommandHandler, ContentAggregate, generateId } from "../deps.ts";
import { handleError, handleErrorWithContext } from "../utils/error-handler.ts";

/**
 * コンテンツコントローラー
 */
export class ContentController {
  private getContentByIdQueryHandler: GetContentByIdQueryHandler;
  private createContentCommandHandler: CreateContentCommandHandler;
  
  /**
   * コンストラクタ
   * @param getContentByIdQueryHandler コンテンツID取得クエリハンドラー
   * @param createContentCommandHandler コンテンツ作成コマンドハンドラー
   */
  constructor(
    getContentByIdQueryHandler: GetContentByIdQueryHandler,
    createContentCommandHandler: CreateContentCommandHandler
  ) {
    this.getContentByIdQueryHandler = getContentByIdQueryHandler;
    this.createContentCommandHandler = createContentCommandHandler;
  }
  
  /**
   * IDによるコンテンツ取得
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async getContentById(c: Context): Promise<Response> {
    try {
      const id = c.req.param("id");
      
      if (!id) {
        return c.json({ error: "コンテンツIDが指定されていません" }, 400);
      }
      
      const query: GetContentByIdQuery = {
        name: "GetContentById",
        id
      };
      
      const result = await this.getContentByIdQueryHandler.execute(query);
      
      if (result.isOk()) {
        return c.json(this.contentToResponse(result.value));
      } else {
        return handleErrorWithContext(c, result.error);
      }
    } catch (error) {
      return handleErrorWithContext(c, error);
    }
  }
  
  /**
   * コンテンツ作成
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async createContent(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      
      // 必須フィールドの検証
      if (!body.userId) {
        return c.json({ error: "ユーザーIDは必須です" }, 400);
      }
      
      if (!body.repositoryId) {
        return c.json({ error: "リポジトリIDは必須です" }, 400);
      }
      
      if (!body.path) {
        return c.json({ error: "パスは必須です" }, 400);
      }
      
      if (!body.title) {
        return c.json({ error: "タイトルは必須です" }, 400);
      }
      
      if (!body.body) {
        return c.json({ error: "本文は必須です" }, 400);
      }
      
      const command: CreateContentCommand = {
        name: "CreateContent",
        userId: body.userId,
        repositoryId: body.repositoryId,
        path: body.path,
        title: body.title,
        body: body.body,
        metadata: body.metadata || {
          tags: [],
          categories: [],
          language: "ja"
        }
      };
      
      const result = await this.createContentCommandHandler.execute(command);
      
      if (result.isOk()) {
        return c.json({
          success: true,
          message: "コンテンツが作成されました",
          content: this.contentToResponse(result.value)
        }, 201);
      } else {
        return handleErrorWithContext(c, result.error);
      }
    } catch (error) {
      return handleErrorWithContext(c, error);
    }
  }
  
  /**
   * コンテンツ集約をレスポンス形式に変換
   * @param contentAggregate コンテンツ集約
   * @returns レスポンス用コンテンツオブジェクト
   */
  private contentToResponse(contentAggregate: ContentAggregate): Record<string, unknown> {
    const content = contentAggregate.content;
    
    return {
      id: content.id,
      userId: content.userId,
      repositoryId: content.repositoryId,
      path: content.path,
      title: content.title,
      body: content.body,
      metadata: {
        tags: content.metadata.tags,
        categories: content.metadata.categories,
        language: content.metadata.language
      },
      versions: content.versions,
      visibility: content.visibility,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt
    };
  }
} 