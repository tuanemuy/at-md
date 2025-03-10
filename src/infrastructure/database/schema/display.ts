/**
 * 表示関連のスキーマ定義
 */

import { pgTable, text, timestamp, jsonb } from "npm:drizzle-orm/pg-core";
import { generateId } from "../../../core/common/mod.ts";
import { users } from "./user.ts";
import { contents } from "./content.ts";

/**
 * ページテーブル
 */
export const pages = pgTable("pages", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id),
  contentId: text("content_id").references(() => contents.id),
  templateId: text("template_id").references(() => templates.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

/**
 * テンプレートテーブル
 */
export const templates = pgTable("templates", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

/**
 * フィードテーブル
 */
export const feeds = pgTable("display_feeds", {
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
export const feedItems = pgTable("display_feed_items", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateId()),
  feedId: text("feed_id").notNull().references(() => feeds.id),
  pageId: text("page_id").notNull().references(() => pages.id),
  order: text("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}); 