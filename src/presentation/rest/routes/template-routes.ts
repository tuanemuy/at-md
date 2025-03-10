/**
 * テンプレートルート
 * 
 * テンプレートに関するエンドポイントのルーティングを定義します。
 */

import { Hono } from "../deps.ts";
import { TemplateController } from "../controllers/template-controller.ts";
import { GetTemplateByIdQueryHandler, GetAllTemplatesQueryHandler } from "../deps.ts";

export const templateRoutes = (
  getTemplateByIdQueryHandler: GetTemplateByIdQueryHandler,
  getAllTemplatesQueryHandler: GetAllTemplatesQueryHandler
) => {
  const app = new Hono();
  const templateController = new TemplateController(
    getTemplateByIdQueryHandler,
    getAllTemplatesQueryHandler
  );

  app.get("/templates/:id", (c) => templateController.getTemplateById(c));
  app.get("/templates", (c) => templateController.getAllTemplates(c));

  return app;
}; 