/**
 * ページルート
 * 
 * ページに関するエンドポイントのルーティングを定義します。
 */

import { Hono } from "hono";
import { PageController } from "../controllers/page-controller.ts";
import { GetPageByIdQueryHandler } from "../../../application/display/queries/get-page-by-id-query.ts";
import { GetPageBySlugQueryHandler } from "../../../application/display/queries/get-page-by-slug-query.ts";
import { GetPageByContentIdQueryHandler } from "../../../application/display/queries/get-page-by-content-id-query.ts";

export const pageRoutes = (
  getPageByIdQueryHandler: GetPageByIdQueryHandler,
  getPageBySlugQueryHandler: GetPageBySlugQueryHandler,
  getPageByContentIdQueryHandler: GetPageByContentIdQueryHandler
) => {
  const app = new Hono();
  const pageController = new PageController(
    getPageByIdQueryHandler,
    getPageBySlugQueryHandler,
    getPageByContentIdQueryHandler
  );

  app.get("/pages/:id", (c) => pageController.getPageById(c));
  app.get("/pages/slug/:slug", (c) => pageController.getPageBySlug(c));
  app.get("/pages/content/:contentId", (c) => pageController.getPageByContentId(c));

  return app;
}; 