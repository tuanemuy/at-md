import { relations } from "drizzle-orm";
import {
  foreignKey,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { v7 as textv7 } from "uuid";
import { users } from "./account";
import { notes } from "./note";

// 投稿テーブル
export const posts = sqliteTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => textv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: text("book_id").notNull(),
    notePath: text("note_path").notNull(),
    status: text("status").notNull().$type<"posted" | "error">(),
    platform: text("platform").notNull().$type<"bluesky">(),
    postUri: text("post_uri").notNull(),
    postCid: text("post_cid").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    bookPathIndex: uniqueIndex("book_notepath_idx").on(t.bookId, t.notePath),
    bookPathFkey: foreignKey({
      name: "book_notepath_fkey",
      columns: [t.bookId, t.notePath],
      foreignColumns: [notes.bookId, notes.path],
    }).onDelete("cascade"),
  }),
);

// リレーションの定義
export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  note: one(notes, {
    fields: [posts.notePath],
    references: [notes.path],
  }),
}));
