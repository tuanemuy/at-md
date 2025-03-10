/**
 * ユーザーコントローラー
 * 
 * ユーザーの取得や操作に関するエンドポイントを提供します。
 */

import { Context, Result, ok, err, ApplicationError, EntityNotFoundError, GetUserByIdQuery, GetUserByIdQueryHandler, CreateUserCommand, CreateUserCommandHandler, UserAggregate, generateId } from "../deps.ts";
import { handleError, handleErrorWithContext } from "../utils/error-handler.ts";

/**
 * ユーザーコントローラー
 */
export class UserController {
  private getUserByIdQueryHandler: GetUserByIdQueryHandler;
  private createUserCommandHandler: CreateUserCommandHandler;
  
  /**
   * コンストラクタ
   * 
   * @param getUserByIdQueryHandler ユーザーIDによるユーザー取得クエリハンドラー
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
    try {
      const id = c.req.param("id");
      
      if (!id) {
        return c.json({ error: "ユーザーIDが指定されていません" }, 400);
      }
      
      const query: GetUserByIdQuery = {
        name: "GetUserById",
        id
      };
      
      const result = await this.getUserByIdQueryHandler.execute(query);
      
      if (result.isOk()) {
        return c.json(this.userToResponse(result.value));
      } else {
        return handleErrorWithContext(c, result.error);
      }
    } catch (error) {
      return handleErrorWithContext(c, error);
    }
  }
  
  /**
   * ユーザー作成
   * @param c Honoコンテキスト
   * @returns レスポンス
   */
  async createUser(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      
      // バリデーション
      if (!body.username) {
        return c.json({ error: "ユーザー名は必須です" }, 400);
      }
      
      if (!body.email) {
        return c.json({ error: "メールアドレスは必須です" }, 400);
      }
      
      if (!body.did) {
        return c.json({ error: "DIDは必須です" }, 400);
      }
      
      const command: CreateUserCommand = {
        name: "CreateUser",
        id: generateId(),
        username: body.username,
        email: body.email,
        atIdentifier: {
          did: body.did,
          handle: body.handle
        }
      };
      
      const result = await this.createUserCommandHandler.execute(command);
      
      if (result.isOk()) {
        return c.json({ 
          success: true, 
          message: "ユーザーが作成されました", 
          user: this.userToResponse(result.value)
        }, 201);
      } else {
        return handleErrorWithContext(c, result.error);
      }
    } catch (error) {
      return handleErrorWithContext(c, error);
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