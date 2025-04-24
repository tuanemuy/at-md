import { NoteScope } from "@/domain/note/models/note";
import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { v7 as textv7 } from "uuid";
import { users } from "./account";

// ブックテーブル（GitHubリポジトリに対応）
export const books = sqliteTable(
  "books",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => textv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    webhookId: integer("webhook_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    ownerRepoIndex: uniqueIndex("owner_repo_idx").on(t.owner, t.repo),
  }),
);

// ブック詳細テーブル
export const bookDetails = sqliteTable("book_details", {
  bookId: text("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// 同期ステータステーブル
export const syncStatuses = sqliteTable("sync_statuses", {
  bookId: text("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  status: text("status", { enum: ["waiting", "synced", "error"] })
    .notNull()
    .default("waiting"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// タグテーブル
export const tags = sqliteTable(
  "tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => textv7()),
    bookId: text("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("book_name_idx").on(t.bookId, t.name)],
);

// ノートテーブル
export const notes = sqliteTable(
  "notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => textv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    scope: text("scope").notNull().$type<NoteScope>().default(NoteScope.PUBLIC),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    bookPathIndex: uniqueIndex("book_path_idx").on(t.bookId, t.path),
  }),
);

// ノートとタグの多対多関係を表すジャンクションテーブル
export const noteTags = sqliteTable(
  "note_tags",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
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
