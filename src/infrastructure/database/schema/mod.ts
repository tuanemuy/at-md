/**
 * データベーススキーマモジュール
 */

import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./content.ts";
import * as deliverySchema from "./delivery.ts";
import * as displaySchema from "./display.ts";

// すべてのスキーマをエクスポート
export * from "./content.ts";
export * from "./delivery.ts";
export * from "./display.ts";

// スキーマ型を定義
export type Schema = typeof schema & typeof deliverySchema & typeof displaySchema;

// データベース型を定義
export type Database = NodePgDatabase<Schema>; 