import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./account";
import { notes } from "./note";
import { v7 as uuidv7 } from "uuid";

// 投稿テーブル
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  noteId: uuid("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  status: text("status").notNull().$type<"draft" | "scheduled" | "published" | "failed">(),
  platform: text("platform").notNull().$type<"bluesky">(),
  platformPostId: text("platform_post_id"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  errorDetails: text("error_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// エンゲージメントテーブル
export const engagements = pgTable("engagements", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  lastUpdatedAt: timestamp("last_updated_at").notNull(),
  likes: integer("likes").notNull().default(0),
  reposts: integer("reposts").notNull().default(0),
  quotes: integer("quotes").notNull().default(0),
  replies: integer("replies").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// リレーションの定義
export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id]
  }),
  note: one(notes, {
    fields: [posts.noteId],
    references: [notes.id]
  }),
  engagements: many(engagements)
}));

export const engagementsRelations = relations(engagements, ({ one }) => ({
  post: one(posts, {
    fields: [engagements.postId],
    references: [posts.id]
  })
})); 