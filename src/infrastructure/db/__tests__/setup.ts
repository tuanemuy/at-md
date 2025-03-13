import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { PGlite } from "@electric-sql/pglite";
import * as schema from "../schema";
import { logger } from "@/lib/logger";

/**
 * テスト用のDrizzleクライアントを取得する
 * @returns Drizzle ORMクライアント
 */
export function getTestDatabase(client: PGlite) {
  return drizzle(client, { schema });
}

/**
 * テスト用のデータベースをセットアップする
 * マイグレーションを実行し、テーブルを初期化する
 */
export async function setupTestDatabase(client: PGlite): Promise<void> {
  const db = drizzle(client, { schema });
  try {
    // マイグレーションを実行
    logger.info("Running migrations for test database...");
    await migrate(db, { migrationsFolder: "drizzle" });
    logger.info("Migrations completed for test database");
  } catch (error) {
    logger.error("Failed to run migrations for test database", error);
    throw error;
  }
}

/**
 * テスト用のデータベースをクリーンアップする
 * すべてのテーブルのデータを削除する
 */
export async function cleanupTestDatabase(client: PGlite): Promise<void> {
  try {
    // すべてのテーブルのデータを削除
    logger.info("Cleaning up test database...");

    // 外部キー制約を一時的に無効化
    await client.query("SET session_replication_role = 'replica'");

    // 各テーブルのデータを削除
    await client.query("TRUNCATE TABLE posts CASCADE");
    await client.query("TRUNCATE TABLE document_tags CASCADE");
    await client.query("TRUNCATE TABLE tags CASCADE");
    await client.query("TRUNCATE TABLE documents CASCADE");
    await client.query("TRUNCATE TABLE github_repos CASCADE");
    await client.query("TRUNCATE TABLE github_connections CASCADE");
    await client.query("TRUNCATE TABLE users CASCADE");

    // 外部キー制約を再度有効化
    await client.query("SET session_replication_role = 'origin'");

    logger.info("Test database cleaned up");
  } catch (error) {
    logger.error("Failed to clean up test database", error);
    logger.error(
      `Error details: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    if (error instanceof Error && error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

/**
 * テスト用のデータベース接続を終了する
 */
export async function closeTestDatabase(client: PGlite): Promise<void> {
  logger.info("Closing test database connection...");
  client.close();
  logger.info("Test database connection closed");
}
