/**
 * フィードコントローラー
 * フィード関連のHTTPリクエストを処理するコントローラー
 */

import { Context } from "hono";
import { Result } from "npm:neverthrow";
import { 
  GetFeedByIdQueryHandler, 
  GetFeedByIdQuery 
} from "../../../application/delivery/queries/feed-query.ts";
import { 
  GetFeedsByUserIdQueryHandler, 
  GetFeedsByUserIdQuery 
} from "../../../application/delivery/queries/feed-query.ts";
import { 
  CreateFeedCommandHandler, 
  CreateFeedCommand 
} from "../../../application/delivery/commands/create-feed-command.ts";
import { FeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
import { EntityNotFoundError } from "../../../core/errors/application.ts";

/**
 * フィードコントローラー
 */
export class FeedController {
  private getFeedByIdQueryHandler: GetFeedByIdQueryHandler;
  private getFeedsByUserIdQueryHandler: GetFeedsByUserIdQueryHandler;
  private createFeedCommandHandler: CreateFeedCommandHandler;
  
  /**
   * コンストラクタ
   * @param getFeedByIdQueryHandler フィード取得クエリハンドラー
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
   * IDによるフィード取得
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getFeedById(c: Context<any, any>): Promise<Response> {
    const id = c.req.param("id");
    
    if (!id) {
      return c.json({ error: "フィードIDが指定されていません" }, 400);
    }
    
    const query: GetFeedByIdQuery = {
      name: "GetFeedById",
      id
    };
    
    const result = await this.getFeedByIdQueryHandler.execute(query);
    
    if (result.isErr()) {
      if (result.error instanceof EntityNotFoundError) {
        return c.json({ error: result.error.message }, 404);
      }
      return c.json({ error: result.error.message }, 500);
    }
    
    if (!result.value) {
      return c.json({ error: "フィードが見つかりませんでした" }, 404);
    }
    
    return c.json(result.value.feed);
  }
  
  /**
   * ユーザーIDによるフィード取得
   * @param c コンテキスト
   * @returns レスポンス
   */
  async getFeedsByUserId(c: Context<any, any>): Promise<Response> {
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
    
    if (result.isErr()) {
      return c.json({ error: result.error.message }, 500);
    }
    
    return c.json(result.value.map(feed => feed.feed));
  }
  
  /**
   * フィード作成
   * @param c コンテキスト
   * @returns レスポンス
   */
  async createFeed(c: Context<any, any>): Promise<Response> {
    try {
      const body = await c.req.json();
      
      if (!body.userId || !body.name) {
        return c.json({ error: "ユーザーIDとフィード名は必須です" }, 400);
      }
      
      const command: CreateFeedCommand = {
        name: "CreateFeed",
        userId: body.userId,
        feedName: body.name,
        description: body.description || "",
        tags: body.tags || [],
        isPublic: body.isPublic !== undefined ? body.isPublic : true
      };
      
      const result = await this.createFeedCommandHandler.execute(command);
      
      if (result.isErr()) {
        return c.json({ error: result.error.message }, 500);
      }
      
      return c.json(result.value.feed, 201);
    } catch (error) {
      return c.json({ error: "リクエストの解析に失敗しました" }, 400);
    }
  }
} 