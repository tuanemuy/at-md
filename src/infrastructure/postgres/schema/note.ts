import { NoteScope } from "@/domain/note/models/note";
import type { SyncStatusCode } from "@/domain/note/models/sync-status";
import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import { users } from "./account";

export const syncStatusEnum = pgEnum("sync_status", [
  "waiting",
  "synced",
  "error",
]);

// ブックテーブル（GitHubリポジトリに対応）
export const books = pgTable(
  "books",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    webhookId: integer("webhook_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    ownerRepoIndex: uniqueIndex("owner_repo_idx").on(t.owner, t.repo),
  }),
);

// ブック詳細テーブル
export const bookDetails = pgTable("book_details", {
  bookId: uuid("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// 同期ステータステーブル
export const syncStatuses = pgTable("sync_statuses", {
  bookId: uuid("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  lastSyncedAt: timestamp("last_synced_at"),
  status: syncStatusEnum("status").notNull().default("waiting"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// タグテーブル
export const tags = pgTable(
  "tags",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("book_name_idx").on(t.bookId, t.name)],
);

// ノートテーブル
export const notes = pgTable(
  "notes",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    scope: text("scope").notNull().$type<NoteScope>().default(NoteScope.PUBLIC),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    bookPathIndex: uniqueIndex("book_path_idx").on(t.bookId, t.path),
  }),
);

// ノートとタグの多対多関係を表すジャンクションテーブル
export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.noteId, t.tagId] }),
  }),
);

// リレーションの定義
export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, {
    fields: [books.userId],
    references: [users.id],
  }),
  details: one(bookDetails, {
    fields: [books.id],
    references: [bookDetails.bookId],
  }),
  syncStatus: one(syncStatuses, {
    fields: [books.id],
    references: [syncStatuses.bookId],
  }),
  notes: many(notes),
}));

export const bookDetailsRelations = relations(bookDetails, ({ one }) => ({
  book: one(books, {
    fields: [bookDetails.bookId],
    references: [books.id],
  }),
}));

export const syncStatusesRelations = relations(syncStatuses, ({ one }) => ({
  book: one(books, {
    fields: [syncStatuses.bookId],
    references: [books.id],
  }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [notes.bookId],
    references: [books.id],
  }),
  tags: many(noteTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  notes: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, {
    fields: [noteTags.noteId],
    references: [notes.id],
  }),
  tag: one(tags, {
    fields: [noteTags.tagId],
    references: [tags.id],
  }),
}));
