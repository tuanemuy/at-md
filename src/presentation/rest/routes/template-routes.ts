/**
 * テンプレートルート
 * 
 * テンプレートに関するエンドポイントのルーティングを定義します。
 */

import { Hono } from "hono";
import { TemplateController } from "../controllers/template-controller.ts";
import { GetTemplateByIdQueryHandler } from "../../../application/display/queries/get-template-by-id-query.ts";
import { GetAllTemplatesQueryHandler } from "../../../application/display/queries/get-all-templates-query.ts";

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