/**
 * Honoアプリケーション
 * RESTful APIのエントリーポイントとなるHonoアプリケーションを提供します。
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

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
  
  return app;
} 