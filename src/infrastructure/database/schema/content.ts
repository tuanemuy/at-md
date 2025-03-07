/**
 * コンテンツ関連のデータベーススキーマ
 */

import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * コンテンツテーブル
 */
export const contents = pgTable('contents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  repositoryId: text('repository_id').notNull(),
  path: text('path').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  visibility: text('visibility').notNull().default('private'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

/**
 * コンテンツメタデータテーブル
 */
export const contentMetadata = pgTable('content_metadata', {
  id: text('id').primaryKey(),
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
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  githubUrl: text('github_url').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}); 