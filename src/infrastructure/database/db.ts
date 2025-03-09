/**
 * データベース接続
 * アプリケーション全体で使用するデータベース接続を提供します。
 */

import { drizzle } from "npm:drizzle-orm/node-postgres";
import pg from "npm:pg";
import { Schema } from "./schema/mod.ts";
import * as contentSchema from "./schema/content.ts";
import * as deliverySchema from "./schema/delivery.ts";
import * as displaySchema from "./schema/display.ts";
import * as userSchema from "./schema/user.ts";

// 環境変数からデータベース接続情報を取得
const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgres://test:test@localhost:55432/at-md";

// 接続オプション
const connectionOptions = {
  max: 10, // 最大接続数
  idleTimeoutMillis: 30000, // アイドルタイムアウト（ミリ秒）
  connectionTimeoutMillis: 10000, // 接続タイムアウト（ミリ秒）
};

// PostgreSQL接続プールの作成
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ...connectionOptions
});

// Drizzle ORM インスタンスの作成
export const db = drizzle(pool, {
  schema: {
    ...contentSchema,
    ...deliverySchema,
    ...displaySchema,
    ...userSchema
  }
});

/**
 * データベース接続を閉じる
 * @returns 成功した場合はtrue
 */
export async function closeDbConnection(): Promise<boolean> {
  try {
    await pool.end();
    return true;
  } catch (error) {
    console.error("Failed to close database connection", error);
    return false;
  }
} 