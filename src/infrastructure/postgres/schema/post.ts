import { relations } from "drizzle-orm";
import {
  foreignKey,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import { users } from "./account";
import { notes } from "./note";

// 投稿テーブル
export const posts = pgTable(
  "posts",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: uuid("book_id").notNull(),
    notePath: text("note_path").notNull(),
    status: text("status").notNull().$type<"posted" | "error">(),
    platform: text("platform").notNull().$type<"bluesky">(),
    postUri: text("post_uri").notNull(),
    postCid: text("post_cid").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
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
