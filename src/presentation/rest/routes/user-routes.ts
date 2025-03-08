/**
 * ユーザールート
 * ユーザー関連のHTTPルートを定義します。
 */

import { Hono } from "hono";
import { UserController } from "../controllers/user-controller.ts";

/**
 * ユーザールートを設定する
 * @param app Honoアプリケーション
 * @param userController ユーザーコントローラー
 */
export function setupUserRoutes(app: Hono, userController: UserController): void {
  // ユーザー関連のルートを定義
  app.get("/api/users/:id", (c) => userController.getUserById(c));
  app.post("/api/users", (c) => userController.createUser(c));
} 