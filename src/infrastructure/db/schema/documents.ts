import {
  pgTable,
  text,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { commonColumns, foreignKeyOptions } from "./common";
import { users } from "./users";
import { documentScopeSchema } from "@/domain/document/models/document";

// 文書公開範囲の列挙型
export const documentScope = pgEnum(
  "document_scope",
  documentScopeSchema.options,
);

/**
 * GitHubリポジトリテーブル
 */
export const githubRepos = pgTable("github_repos", {
  ...commonColumns,
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, foreignKeyOptions),
  fullName: varchar("full_name", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  description: text("description"),
  defaultBranch: varchar("default_branch", { length: 100 }).notNull(),
  private: boolean("private").notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
});

/**
 * 文書テーブル
 */
export const documents = pgTable("documents", {
  ...commonColumns,
  gitHubRepoId: uuid("github_repo_id")
    .notNull()
    .references(() => githubRepos.id, foreignKeyOptions),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, foreignKeyOptions),
  path: varchar("path", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  document: text("document").notNull(),
  scope: documentScope("scope").notNull(),
});

/**
 * タグテーブル
 */
export const tags = pgTable("tags", {
  ...commonColumns,
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, foreignKeyOptions),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }),
});

/**
 * 文書タグ関連テーブル
 */
export const documentTags = pgTable("document_tags", {
  ...commonColumns,
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, foreignKeyOptions),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, foreignKeyOptions),
});
