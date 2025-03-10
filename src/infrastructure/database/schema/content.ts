/**
 * コンテンツスキーマ
 * 
 * コンテンツ関連のデータベーススキーマ定義
 */

import { pgTable, text, timestamp, uuid, varchar, jsonb } from "../../../deps.ts";
import { sql } from "drizzle-orm";
import { generateId } from "../deps.ts";
import { users } from "./user.ts";

/**
 * コンテンツテーブル
 */
export const contents = pgTable('contents', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  userId: text('user_id').notNull().references(() => users.id),
  repositoryId: text('repository_id').references(() => repositories.id),
  path: text('path'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  metadata: jsonb('metadata'),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * コンテンツメタデータテーブル
 */
export const contentMetadata = pgTable('content_metadata', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  contentId: text('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  tags: jsonb('tags').notNull().default('[]'),
  categories: jsonb('categories').notNull().default('[]'),
  language: text('language').notNull().default('ja'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * リポジトリテーブル
 */
export const repositories = pgTable('repositories', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  url: text('url'),
  provider: text('provider').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}); 