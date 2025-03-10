/**
 * ユーザールート
 * ユーザーに関するエンドポイントを定義します。
 */

import { Hono } from "../deps.ts";
import { UserController } from "../controllers/user-controller.ts";
import { GetUserByIdQueryHandler, CreateUserCommandHandler } from "../deps.ts";

/**
 * ユーザールートを設定する
 * @param app Honoアプリケーション
 * @param userController ユーザーコントローラー
 */
export const userRoutes = (
  getUserByIdQueryHandler: GetUserByIdQueryHandler,
  createUserCommandHandler: CreateUserCommandHandler
): Hono => {
  const app = new Hono();
  const controller = new UserController(
    getUserByIdQueryHandler,
    createUserCommandHandler
  );

  // ユーザーをIDで取得
  app.get("/:id", (c) => controller.getUserById(c));

  // ユーザーを作成
  app.post("/", (c) => controller.createUser(c));

  return app;
}; 