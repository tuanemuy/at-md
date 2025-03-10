/**
 * データベースマイグレーション
 * 
 * データベーススキーマを作成・更新するためのマイグレーションスクリプト
 */

import { migrate } from "npm:drizzle-orm/postgres-js/migrator";
import { db } from "./db.ts";
import { Logger } from "../../core/logging/mod.ts";

const logger = new Logger("migrate");

/**
 * マイグレーションを実行する
 */
export async function runMigrations() {
  logger.info("マイグレーションを開始します...");
  
  try {
    // マイグレーションを実行
    await migrate(db, { migrationsFolder: "./drizzle" });
    logger.info("マイグレーションが完了しました");
  } catch (error) {
    logger.error(`マイグレーションエラー: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * メイン関数
 */
async function main() {
  try {
    await runMigrations();
    Deno.exit(0);
  } catch (error) {
    logger.error(`マイグレーション実行エラー: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

// スクリプトが直接実行された場合のみメイン関数を実行
if (import.meta.main) {
  main();
} 