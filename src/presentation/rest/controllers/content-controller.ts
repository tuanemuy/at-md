/**
 * コンテンツコントローラー
 * コンテンツ関連のHTTPリクエストを処理するコントローラー
 */

import { Context } from "hono";
import { Result } from "npm:neverthrow";
import { 
  GetContentByIdQueryHandler, 
  GetContentByIdQuery 
} from "../../../application/content/queries/get-content-by-id-query.ts";
import { 
  CreateContentCommandHandler, 
  CreateContentCommand 
} from "../../../application/content/commands/create-content-command.ts";
import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { generateId } from "../../../core/common/id.ts";

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
    const id = c.req.param("id");
    
    if (!id) {
      return c.json({ error: "コンテンツIDが指定されていません" }, 400);
    }
    
    const query: GetContentByIdQuery = {
      name: "GetContentById",
      id
    };
    
    const result = await this.getContentByIdQueryHandler.execute(query);
    
    return this.handleContentResult(c, result);
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
      if (!body.userId || !body.repositoryId || !body.path || !body.title || !body.body) {
        return c.json({ 
          error: "ユーザーID、リポジトリID、パス、タイトル、本文は必須です" 
        }, 400);
      }
      
      const command: CreateContentCommand = {
        name: "CreateContent",
        userId: body.userId,
        repositoryId: body.repositoryId,
        path: body.path,
        title: body.title,
        body: body.body,
        metadata: body.metadata
      };
      
      const result = await this.createContentCommandHandler.execute(command);
      
      if (result.isOk()) {
        return c.json(this.contentToResponse(result.value), 201);
      } else {
        return c.json({ error: result.error.message }, 400);
      }
    } catch (error) {
      console.error("コンテンツ作成エラー:", error);
      return c.json({ 
        error: "コンテンツ作成中にエラーが発生しました" 
      }, 500);
    }
  }
  
  /**
   * コンテンツ結果の処理
   * @param c Honoコンテキスト
   * @param result コンテンツ結果
   * @returns レスポンス
   */
  private handleContentResult(c: Context, result: Result<ContentAggregate, Error>): Response {
    if (result.isOk()) {
      return c.json(this.contentToResponse(result.value));
    } else {
      const errorMessage = result.error.message;
      
      if (errorMessage.includes("見つかりません")) {
        return c.json({ error: errorMessage }, 404);
      } else {
        return c.json({ error: errorMessage }, 400);
      }
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