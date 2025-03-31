import path from "node:path";
import * as schema from "@/infrastructure/db/schema";
import type { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

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
  // マイグレーションを実行
  await migrate(db, {
    migrationsFolder: path.join(
      import.meta.dirname,
      "../../infrastructure/db/migrations",
    ),
  });
}

/**
 * テスト用のデータベースをクリーンアップする
 * すべてのテーブルのデータを削除する
 */
export async function cleanupTestDatabase(client: PGlite): Promise<void> {
  // 外部キー制約を一時的に無効化
  await client.query("SET session_replication_role = 'replica'");

  // 各テーブルのデータを削除
  await client.query("TRUNCATE TABLE posts CASCADE");
  await client.query("TRUNCATE TABLE note_tags CASCADE");
  await client.query("TRUNCATE TABLE tags CASCADE");
  await client.query("TRUNCATE TABLE notes CASCADE");
  await client.query("TRUNCATE TABLE sync_statuses CASCADE");
  await client.query("TRUNCATE TABLE book_details CASCADE");
  await client.query("TRUNCATE TABLE books CASCADE");
  await client.query("TRUNCATE TABLE github_connections CASCADE");
  await client.query("TRUNCATE TABLE profiles CASCADE");
  await client.query("TRUNCATE TABLE users CASCADE");
  await client.query("TRUNCATE TABLE auth_sessions CASCADE");
  await client.query("TRUNCATE TABLE auth_states CASCADE");

  // 外部キー制約を再度有効化
  await client.query("SET session_replication_role = 'origin'");
}

/**
 * テスト用のデータベース接続を終了する
 */
export async function closeTestDatabase(client: PGlite): Promise<void> {
  client.close();
}
