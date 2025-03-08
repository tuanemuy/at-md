/**
 * データベース接続
 * アプリケーション全体で使用するデータベース接続を提供します。
 */

import { drizzle } from "npm:drizzle-orm/postgres-js";
import postgres from "npm:postgres";
import { Schema } from "./schema/mod.ts";

// 環境変数からデータベース接続情報を取得
const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgres://postgres:postgres@localhost:5432/at_md";

// PostgreSQL接続の作成
const client = postgres(DATABASE_URL);

// Drizzle ORM インスタンスの作成
export const db = drizzle<Schema>(client); 