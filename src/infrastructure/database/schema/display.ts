/**
 * 表示関連のデータベーススキーマ
 */

import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { generateId } from "../../../core/common/id.ts";

/**
 * ページテーブル
 */
export const pages = pgTable('pages', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  slug: text('slug').notNull().unique(),
  contentId: text('content_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  templateId: text('template_id'),
  renderingOptions: jsonb('rendering_options').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * テンプレートテーブル
 */
export const templates = pgTable('templates', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * フィードテーブル
 */
export const feeds = pgTable('feeds', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull().default(''),
  tags: jsonb('tags').notNull().default('[]'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * フィードアイテムテーブル
 */
export const feedItems = pgTable('feed_items', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  feedId: text('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  contentId: text('content_id').notNull(),
  order: text('order').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}); 