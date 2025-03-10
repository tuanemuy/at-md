/**
 * 外部依存のエクスポート
 * 
 * このファイルは、プロジェクト全体で使用される外部依存をエクスポートします。
 * 依存関係の管理を一元化し、バージョン管理を容易にします。
 */

// Drizzle ORM
export { eq, and, or, desc, asc, sql, inArray } from "drizzle-orm";
export { pgTable, text, timestamp, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
export type { NodePgDatabase } from "drizzle-orm/node-postgres";

// PostgreSQL
export { default as pg } from "pg";

// 標準ライブラリ
export { expect } from "@std/expect";
export { describe, it, beforeEach, afterEach, beforeAll, afterAll } from "@std/testing/bdd";

// ユーティリティ
export { Result, ok, err } from "npm:neverthrow";

// バリデーション
export { z } from "npm:zod";

// 環境変数
export { config as dotenvConfig } from "npm:dotenv"; 