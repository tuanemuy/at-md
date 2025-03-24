import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import { users } from "./account";
import { notes } from "./note";

// 投稿テーブル
export const posts = pgTable("posts", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  status: text("status").notNull().$type<"posted" | "error">(),
  platform: text("platform").notNull().$type<"bluesky">(),
  postUri: text("post_uri"),
  postCid: text("post_cid"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// リレーションの定義
export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  note: one(notes, {
    fields: [posts.noteId],
    references: [notes.id],
  }),
}));
