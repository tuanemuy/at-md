/**
 * フィードルート
 * フィード関連のHTTPルートを定義します。
 */

import { Hono } from "hono";
import { FeedController } from "../controllers/feed-controller.ts";

/**
 * フィードルートを設定する
 * @param app Honoアプリケーション
 * @param feedController フィードコントローラー
 */
export function setupFeedRoutes(app: Hono, feedController: FeedController): void {
  // フィード関連のルートを定義
  app.get("/api/feeds/:id", (c) => feedController.getFeedById(c));
  app.get("/api/users/:userId/feeds", (c) => feedController.getFeedsByUserId(c));
  app.post("/api/feeds", (c) => feedController.createFeed(c));
} 