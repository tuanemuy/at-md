/**
 * Honoアプリケーション
 * RESTful APIのエントリーポイントとなるHonoアプリケーションを提供します。
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { setupUserRoutes } from "../routes/user-routes.ts";
import { setupContentRoutes } from "../routes/content-routes.ts";
import { UserController } from "../controllers/user-controller.ts";
import { ContentController } from "../controllers/content-controller.ts";
import { GetUserByIdQueryHandler } from "../../../application/account/queries/get-user-by-id-query.ts";
import { CreateUserCommandHandler } from "../../../application/account/commands/create-user-command.ts";
import { GetContentByIdQueryHandler } from "../../../application/content/queries/get-content-by-id-query.ts";
import { CreateContentCommandHandler } from "../../../application/content/commands/create-content-command.ts";
import { DrizzleUserRepository } from "../../../infrastructure/repositories/drizzle-user-repository.ts";
import { DrizzleContentRepository } from "../../../infrastructure/repositories/drizzle-content-repository.ts";
import { DrizzleRepositoryRepository } from "../../../infrastructure/repositories/drizzle-repository-repository.ts";
import { db } from "../../../infrastructure/database/db.ts";

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
  const contentRepository = new DrizzleContentRepository(db);
  const repositoryRepository = new DrizzleRepositoryRepository();
  
  // クエリハンドラーとコマンドハンドラーの初期化
  const getUserByIdQueryHandler = new GetUserByIdQueryHandler(userRepository);
  const createUserCommandHandler = new CreateUserCommandHandler(userRepository);
  const getContentByIdQueryHandler = new GetContentByIdQueryHandler(contentRepository);
  const createContentCommandHandler = new CreateContentCommandHandler(
    contentRepository,
    repositoryRepository
  );
  
  // コントローラーの初期化
  const userController = new UserController(
    getUserByIdQueryHandler,
    createUserCommandHandler
  );
  const contentController = new ContentController(
    getContentByIdQueryHandler,
    createContentCommandHandler
  );
  
  // ルートの設定
  setupUserRoutes(app, userController);
  setupContentRoutes(app, contentController);
  
  return app;
} 