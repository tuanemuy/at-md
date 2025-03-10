/**
 * フィードルート
 * フィードに関するエンドポイントを定義します。
 */

import { Hono } from "../deps.ts";
import { FeedController } from "../controllers/feed-controller.ts";
import { GetFeedByIdQueryHandler, GetFeedsByUserIdQueryHandler, CreateFeedCommandHandler } from "../deps.ts";

/**
 * フィードルート
 * フィード関連のHTTPルートを定義します。
 */
export const feedRoutes = (
  getFeedByIdQueryHandler: GetFeedByIdQueryHandler,
  getFeedsByUserIdQueryHandler: GetFeedsByUserIdQueryHandler,
  createFeedCommandHandler: CreateFeedCommandHandler
): Hono => {
  const app = new Hono();
  const controller = new FeedController(
    getFeedByIdQueryHandler,
    getFeedsByUserIdQueryHandler,
    createFeedCommandHandler
  );

  // フィードをIDで取得
  app.get("/:id", (c) => controller.getFeedById(c));

  // ユーザーのフィード一覧を取得
  app.get("/user/:userId", (c) => controller.getFeedsByUserId(c));

  // フィードを作成
  app.post("/", (c) => controller.createFeed(c));

  return app;
}; 