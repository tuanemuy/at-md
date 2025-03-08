/**
 * コンテンツルート
 * コンテンツ関連のHTTPルートを定義します。
 */

import { Hono } from "hono";
import { ContentController } from "../controllers/content-controller.ts";

/**
 * コンテンツルートを設定する
 * @param app Honoアプリケーション
 * @param contentController コンテンツコントローラー
 */
export function setupContentRoutes(app: Hono, contentController: ContentController): void {
  // コンテンツ関連のルートを定義
  app.get("/api/contents/:id", (c) => contentController.getContentById(c));
  app.post("/api/contents", (c) => contentController.createContent(c));
} 