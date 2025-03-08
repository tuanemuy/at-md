/**
 * データベーススキーマモジュール
 * データベーススキーマをエクスポートします。
 */

import { pgTable, text, timestamp } from "npm:drizzle-orm/pg-core";
import { NodePgDatabase } from "npm:drizzle-orm/node-postgres";

// スキーマのインポート
import * as contentSchema from "./content.ts";
import * as deliverySchema from "./delivery.ts";
import * as displaySchema from "./display.ts";
import * as userSchema from "./user.ts";

// コンテンツスキーマ
export * from "./content.ts";

// 配信スキーマ
export { 
  posts
} from "./delivery.ts";

// 配信スキーマ（名前付きエクスポート）
export { 
  feeds as deliveryFeeds,
  feedItems as deliveryFeedItems
} from "./delivery.ts";

// 表示スキーマ
export { 
  pages,
  templates
} from "./display.ts";

// 表示スキーマ（名前付きエクスポート）
export { 
  feeds as displayFeeds,
  feedItems as displayFeedItems
} from "./display.ts";

// ユーザースキーマ
export * from "./user.ts";

// スキーマ型を定義
export type Schema = typeof contentSchema & typeof deliverySchema & typeof displaySchema & typeof userSchema;

// データベース型を定義
export type Database = NodePgDatabase<Schema>; 