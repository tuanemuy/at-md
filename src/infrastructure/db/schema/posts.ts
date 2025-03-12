import { pgTable, text, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { commonColumns, foreignKeyOptions } from "./common";
import { users } from "./users";
import { documents } from "./documents";

// 投稿プラットフォームの列挙型
export const postPlatform = pgEnum("post_platform", ["bluesky"]);

// 投稿ステータスの列挙型
export const postStatus = pgEnum("post_status", ["pending", "published", "failed"]);

/**
 * 投稿テーブル
 */
export const posts = pgTable("posts", {
  ...commonColumns,
  documentId: uuid("document_id").notNull().references(() => documents.id, foreignKeyOptions),
  userId: uuid("user_id").notNull().references(() => users.id, foreignKeyOptions),
  platform: postPlatform("platform").notNull(),
  uri: text("uri").notNull(),
  status: postStatus("status").notNull(),
  error: text("error"),
  publishedAt: timestamp("published_at"),
}); 