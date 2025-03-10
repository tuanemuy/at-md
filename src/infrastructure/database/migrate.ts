/**
 * データベースマイグレーションスクリプト
 * 
 * このスクリプトは、drizzle-ormのマイグレーション機能を使用して、
 * データベーススキーマの変更を適用します。
 */

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "npm:postgres";
import { Logger } from "../../core/logging/logger.ts";

// データベース接続文字列
const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgres://test:test@localhost:55432/at-md";

/**
 * マイグレーションを実行する
 * @param migrationsFolder マイグレーションファイルが格納されているフォルダのパス
 * @param databaseUrl データベース接続文字列（省略時は環境変数から取得）
 * @returns マイグレーションが成功したかどうか
 */
export async function runMigrations(
  migrationsFolder: string = "./drizzle",
  databaseUrl: string = DATABASE_URL
): Promise<boolean> {
  const logger = new Logger("Migration");
  logger.info("データベースマイグレーションを開始します");
  
  // PostgreSQLクライアントを作成
  const migrationClient = postgres(databaseUrl, { max: 1 });
  
  try {
    // Drizzleクライアントを作成
    const db = drizzle(migrationClient);
    
    // マイグレーションを実行
    await migrate(db, { migrationsFolder });
    
    logger.info("データベースマイグレーションが完了しました");
    
    return true;
  } catch (error) {
    logger.error("データベースマイグレーションに失敗しました", { error });
    return false;
  } finally {
    // データベース接続を閉じる
    await migrationClient.end();
  }
}

/**
 * スクリプトが直接実行された場合の処理
 */
if (import.meta.main) {
  const success = await runMigrations();
  
  if (!success) {
    Deno.exit(1);
  }
} 