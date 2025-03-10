/**
 * フィードコントローラー
 * フィードに関するHTTPリクエストを処理します。
 */

import { Context, Result, ok, err, ApplicationError, EntityNotFoundError, FeedAggregate, generateId } from "../deps.ts";
import { GetFeedByIdQuery, GetFeedByIdQueryHandler, GetFeedsByUserIdQuery, GetFeedsByUserIdQueryHandler, CreateFeedCommand, CreateFeedCommandHandler } from "../deps.ts";
import { handleError, handleErrorWithContext } from "../utils/error-handler.ts";

/**
 * フィードコントローラー
 */
export class FeedController {
  private getFeedByIdQueryHandler: GetFeedByIdQueryHandler;
  private getFeedsByUserIdQueryHandler: GetFeedsByUserIdQueryHandler;
  private createFeedCommandHandler: CreateFeedCommandHandler;
  
  /**
   * コンストラクタ
   * @param getFeedByIdQueryHandler フィードID取得クエリハンドラー
   * @param getFeedsByUserIdQueryHandler ユーザーIDによるフィード取得クエリハンドラー
   * @param createFeedCommandHandler フィード作成コマンドハンドラー
   */
  constructor(
    getFeedByIdQueryHandler: GetFeedByIdQueryHandler,
    getFeedsByUserIdQueryHandler: GetFeedsByUserIdQueryHandler,
    createFeedCommandHandler: CreateFeedCommandHandler
  ) {
    this.getFeedByIdQueryHandler = getFeedByIdQueryHandler;
    this.getFeedsByUserIdQueryHandler = getFeedsByUserIdQueryHandler;
    this.createFeedCommandHandler = createFeedCommandHandler;
  }
  
  /**
   * フィードをIDで取得する
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getFeedById(c: Context): Promise<Response> {
    try {
      const id = c.req.param("id");
      
      if (!id) {
        return c.json({ error: "フィードIDが指定されていません" }, 400);
      }
      
      const query: GetFeedByIdQuery = {
        name: "GetFeedById",
        id
      };
      
      const result = await this.getFeedByIdQueryHandler.execute(query);
      
      if (result.isOk()) {
        if (result.value) {
          return c.json(this.feedToResponse(result.value));
        } else {
          return c.json({ error: `フィードが見つかりません: ${id}` }, 404);
        }
      } else {
        return handleErrorWithContext(c, result.error);
      }
    } catch (error) {
      return handleErrorWithContext(c, error);
    }
  }
  
  /**
   * ユーザーIDによるフィード取得
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async getFeedsByUserId(c: Context): Promise<Response> {
    try {
      const userId = c.req.param("userId");
      
      if (!userId) {
        return c.json({ error: "ユーザーIDが指定されていません" }, 400);
      }
      
      const query: GetFeedsByUserIdQuery = {
        name: "GetFeedsByUserId",
        userId,
        limit: Number(c.req.query("limit")) || undefined,
        offset: Number(c.req.query("offset")) || undefined
      };
      
      const result = await this.getFeedsByUserIdQueryHandler.execute(query);
      
      if (result.isOk()) {
        return c.json({
          success: true,
          feeds: result.value.map((feed: FeedAggregate) => this.feedToResponse(feed))
        });
      } else {
        return handleErrorWithContext(c, result.error);
      }
    } catch (error) {
      return handleErrorWithContext(c, error);
    }
  }
  
  /**
   * フィード作成
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async createFeed(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      
      if (!body.userId) {
        return c.json({ error: "ユーザーIDは必須です" }, 400);
      }
      
      if (!body.name) {
        return c.json({ error: "フィード名は必須です" }, 400);
      }
      
      const command: CreateFeedCommand = {
        name: "CreateFeed",
        userId: body.userId,
        feedName: body.name,
        description: body.description || "",
        tags: body.tags || [],
        isPublic: body.isPublic !== undefined ? body.isPublic : false
      };
      
      const result = await this.createFeedCommandHandler.execute(command);
      
      if (result.isOk()) {
        return c.json({
          success: true,
          message: "フィードが作成されました",
          feed: this.feedToResponse(result.value)
        }, 201);
      } else {
        return handleErrorWithContext(c, result.error);
      }
    } catch (error) {
      return handleErrorWithContext(c, error);
    }
  }

  /**
   * フィード集約をレスポンス用のオブジェクトに変換する
   * @param feedAggregate フィード集約
   * @returns レスポンス用オブジェクト
   */
  private feedToResponse(feedAggregate: FeedAggregate): Record<string, unknown> {
    const feed = feedAggregate.feed;
    const metadata = feed.metadata;
    
    return {
      id: feed.id,
      userId: feed.userId,
      name: feed.name,
      description: metadata.description || "",
      postIds: feed.postIds,
      createdAt: feed.createdAt,
      updatedAt: feed.updatedAt
    };
  }
} 