import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { logger } from "@/lib/logger";
import * as schema from "./schema";

/**
 * データベース接続プールを作成する
 * @returns PostgreSQL接続プール
 */
export function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    logger.error("DATABASE_URL environment variable is not set");
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return new Pool({
    connectionString,
    max: 10, // 最大接続数
    idleTimeoutMillis: 30000, // 未使用接続のタイムアウト（30秒）
    connectionTimeoutMillis: 2000, // 接続タイムアウト（2秒）
  });
}

/**
 * Drizzle ORMクライアントを作成する
 * @param pool PostgreSQL接続プール
 * @returns Drizzle ORMクライアント
 */
export function createDrizzleClient(pool: Pool) {
  return drizzle({ client: pool, schema });
}

// シングルトンインスタンス
let pool: Pool | null = null;

/**
 * PostgreSQL接続プールを取得する
 * @returns PostgreSQL接続プール
 */
export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

/**
 * テスト用にプールをリセットする
 */
export function resetPool(): void {
  if (pool) {
    pool.end();
    pool = null;
  }
}

/**
 * Drizzle ORMクライアントを取得する
 * @returns Drizzle ORMクライアント
 */
export function getDrizzleClient() {
  const pool = getPool();
  return createDrizzleClient(pool);
}
