/**
 * データベーススキーマモジュール
 * 
 * このモジュールは、データベーススキーマをエクスポートします。
 */

import { pgTable, text, timestamp } from "npm:drizzle-orm/pg-core";
import { NodePgDatabase } from "npm:drizzle-orm/node-postgres";

// スキーマのインポート
import * as contentSchema from "./content.ts";
import * as deliverySchema from "./delivery.ts";
import * as displaySchema from "./display.ts";
import * as userSchema from "./user.ts";

// コンテンツスキーマ
export * as contentSchema from "./content.ts";

// 配信スキーマ
export * as deliverySchema from "./delivery.ts";

// 表示スキーマ
export * as displaySchema from "./display.ts";

// ユーザースキーマ
export * from "./user.ts";

// スキーマ型を定義
export type Schema = typeof contentSchema & typeof deliverySchema & typeof displaySchema & typeof userSchema;

// データベース型を定義
export type Database = NodePgDatabase<Schema>; 