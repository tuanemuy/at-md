/**
 * 表示関連のデータベーススキーマ
 */

import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * ページテーブル
 */
export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
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
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}); 