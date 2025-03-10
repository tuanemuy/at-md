/**
 * 配信関連のスキーマ定義
 */

import { pgTable, text, timestamp, jsonb } from "npm:drizzle-orm/pg-core";
import { generateId } from "../../../core/common/mod.ts";
import { users } from "./user.ts";
import { contents } from "./content.ts";

/**
 * 投稿テーブル
 */
export const posts = pgTable("posts", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id),
  contentId: text("content_id").notNull().references(() => contents.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

/**
 * フィードテーブル
 */
export const feeds = pgTable("feeds", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

/**
 * フィードアイテムテーブル
 */
export const feedItems = pgTable("feed_items", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateId()),
  feedId: text("feed_id").notNull().references(() => feeds.id),
  postId: text("post_id").notNull().references(() => posts.id),
  order: text("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}); 