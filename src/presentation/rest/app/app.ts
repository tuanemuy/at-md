/**
 * Honoアプリケーション
 * RESTful APIのエントリーポイントとなるHonoアプリケーションを提供します。
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { setupUserRoutes } from "../routes/user-routes.ts";
import { UserController } from "../controllers/user-controller.ts";
import { GetUserByIdQueryHandler } from "../../../application/account/queries/get-user-by-id-query.ts";
import { CreateUserCommandHandler } from "../../../application/account/commands/create-user-command.ts";
import { DrizzleUserRepository } from "../../../infrastructure/repositories/drizzle-user-repository.ts";

/**
 * Honoアプリケーションを作成する
 * @returns Honoアプリケーション
 */
export function createApp() {
  const app = new Hono();
  
  // ミドルウェアの設定
  app.use("*", logger());
  app.use("*", cors());
  
  // ルートの設定
  app.get("/", (c) => c.json({ message: "AT-MD API" }));
  
  // APIのバージョンとヘルスチェック
  app.get("/api/health", (c) => c.json({ status: "ok" }));
  app.get("/api/version", (c) => c.json({ version: "0.1.0" }));
  
  // リポジトリの初期化
  const userRepository = new DrizzleUserRepository();
  
  // クエリハンドラーとコマンドハンドラーの初期化
  const getUserByIdQueryHandler = new GetUserByIdQueryHandler(userRepository);
  const createUserCommandHandler = new CreateUserCommandHandler(userRepository);
  
  // コントローラーの初期化
  const userController = new UserController(
    getUserByIdQueryHandler,
    createUserCommandHandler
  );
  
  // ルートの設定
  setupUserRoutes(app, userController);
  
  return app;
} 