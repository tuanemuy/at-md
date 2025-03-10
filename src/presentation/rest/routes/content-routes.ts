/**
 * コンテンツルート
 * コンテンツに関するエンドポイントを定義します。
 */

import { Hono } from "../deps.ts";
import { ContentController } from "../controllers/content-controller.ts";
import { GetContentByIdQueryHandler, CreateContentCommandHandler } from "../deps.ts";

/**
 * コンテンツルートを設定する
 * @param app Honoアプリケーション
 * @param contentController コンテンツコントローラー
 */
export const contentRoutes = (
  getContentByIdQueryHandler: GetContentByIdQueryHandler,
  createContentCommandHandler: CreateContentCommandHandler
): Hono => {
  const app = new Hono();
  const controller = new ContentController(
    getContentByIdQueryHandler,
    createContentCommandHandler
  );

  // コンテンツをIDで取得
  app.get("/:id", (c) => controller.getContentById(c));

  // コンテンツを作成
  app.post("/", (c) => controller.createContent(c));

  return app;
}; 