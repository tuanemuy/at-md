/**
 * ユーザーコントローラー
 * ユーザー関連のHTTPリクエストを処理するコントローラー
 */

import { Context } from "hono";
import { Result } from "npm:neverthrow";
import { 
  GetUserByIdQueryHandler, 
  GetUserByIdQuery 
} from "../../../application/account/queries/get-user-by-id-query.ts";
import { 
  CreateUserCommandHandler, 
  CreateUserCommand 
} from "../../../application/account/commands/create-user-command.ts";
import { UserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";
import { generateId } from "../../../core/common/id.ts";

/**
 * ユーザーコントローラー
 */
export class UserController {
  private getUserByIdQueryHandler: GetUserByIdQueryHandler;
  private createUserCommandHandler: CreateUserCommandHandler;
  
  /**
   * コンストラクタ
   * @param getUserByIdQueryHandler ユーザーID取得クエリハンドラー
   * @param createUserCommandHandler ユーザー作成コマンドハンドラー
   */
  constructor(
    getUserByIdQueryHandler: GetUserByIdQueryHandler,
    createUserCommandHandler: CreateUserCommandHandler
  ) {
    this.getUserByIdQueryHandler = getUserByIdQueryHandler;
    this.createUserCommandHandler = createUserCommandHandler;
  }
  
  /**
   * IDによるユーザー取得
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async getUserById(c: Context): Promise<Response> {
    const id = c.req.param("id");
    
    if (!id) {
      return c.json({ error: "ユーザーIDが指定されていません" }, 400);
    }
    
    const query: GetUserByIdQuery = {
      name: "GetUserById",
      id
    };
    
    const result = await this.getUserByIdQueryHandler.execute(query);
    
    return this.handleUserResult(c, result);
  }
  
  /**
   * ユーザー作成
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async createUser(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      
      // 必須フィールドの検証
      if (!body.username || !body.email || !body.atIdentifier || !body.atIdentifier.did) {
        return c.json({ 
          error: "ユーザー名、メールアドレス、DIDは必須です" 
        }, 400);
      }
      
      const command: CreateUserCommand = {
        name: "CreateUser",
        id: generateId(),
        username: body.username,
        email: body.email,
        atIdentifier: {
          did: body.atIdentifier.did,
          handle: body.atIdentifier.handle
        }
      };
      
      const result = await this.createUserCommandHandler.execute(command);
      
      if (result.isOk()) {
        return c.json(this.userToResponse(result.value), 201);
      } else {
        return c.json({ error: result.error.message }, 400);
      }
    } catch (error) {
      console.error("ユーザー作成エラー:", error);
      return c.json({ 
        error: "ユーザー作成中にエラーが発生しました" 
      }, 500);
    }
  }
  
  /**
   * ユーザー結果の処理
   * @param c Honoコンテキスト
   * @param result ユーザー結果
   * @returns レスポンス
   */
  private handleUserResult(c: Context, result: Result<UserAggregate, Error>): Response {
    if (result.isOk()) {
      return c.json(this.userToResponse(result.value));
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
   * ユーザー集約をレスポンス形式に変換
   * @param userAggregate ユーザー集約
   * @returns レスポンス用ユーザーオブジェクト
   */
  private userToResponse(userAggregate: UserAggregate): Record<string, unknown> {
    const user = userAggregate.user;
    
    return {
      id: user.id,
      username: user.username.value,
      email: user.email.value,
      atIdentifier: {
        did: user.atIdentifier.value,
        handle: user.atIdentifier.handle
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
} 