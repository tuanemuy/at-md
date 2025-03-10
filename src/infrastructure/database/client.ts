/**
 * データベースクライアント
 */

import postgres from "npm:postgres";
import { drizzle } from "npm:drizzle-orm/postgres-js";
import { Logger } from "../../core/logging/mod.ts";

const logger = new Logger("Database");

/**
 * データベース接続設定
 */
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

/**
 * 環境変数からデータベース設定を取得する
 */
export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: Deno.env.get("DB_HOST") || "localhost",
    port: parseInt(Deno.env.get("DB_PORT") || "5432"),
    database: Deno.env.get("DB_NAME") || "at-md",
    username: Deno.env.get("DB_USER") || "postgres",
    password: Deno.env.get("DB_PASSWORD") || "postgres",
    ssl: Deno.env.get("DB_SSL") === "true",
    maxConnections: parseInt(Deno.env.get("DB_MAX_CONNECTIONS") || "10")
  };
}

/**
 * データベース接続文字列を生成する
 */
export function getDatabaseUrl(config: DatabaseConfig): string {
  const { host, port, database, username, password, ssl } = config;
  const sslParam = ssl ? "?sslmode=require" : "";
  return `postgres://${username}:${password}@${host}:${port}/${database}${sslParam}`;
}

/**
 * PostgreSQLクライアントを作成する
 */
export function createPostgresClient(config: DatabaseConfig = getDatabaseConfig()): postgres.Sql {
  const url = getDatabaseUrl(config);
  logger.info(`データベースに接続します: ${config.host}:${config.port}/${config.database}`);
  
  return postgres(url, {
    max: config.maxConnections,
    onnotice: (notice) => {
      logger.debug(`PostgreSQL通知: ${notice.message}`);
    }
  });
}

/**
 * Drizzle ORMクライアントを作成する
 */
export function createDrizzleClient(postgresClient: postgres.Sql) {
  return drizzle(postgresClient);
}

// デフォルトのPostgreSQLクライアント
const postgresClient = createPostgresClient();

// デフォルトのDrizzle ORMクライアント
export const db = createDrizzleClient(postgresClient);

/**
 * データベース接続を閉じる
 */
export async function closeDatabase() {
  logger.info("データベース接続を閉じます");
  await postgresClient.end();
} 