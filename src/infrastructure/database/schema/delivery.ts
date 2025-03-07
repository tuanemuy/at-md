/**
 * 配信関連のデータベーススキーマ
 */

import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { contents } from "./content.ts";

/**
 * ポストテーブル
 */
export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  contentId: text('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  feedId: text('feed_id').notNull(),
  slug: text('slug').notNull(),
  publishStatus: text('publish_status').notNull().default('draft'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * フィードテーブル
 */
export const feeds = pgTable('feeds', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * フィードアイテムテーブル
 */
export const feedItems = pgTable('feed_items', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}); 