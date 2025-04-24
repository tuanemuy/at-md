import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 as textv7 } from "uuid";

// ユーザーテーブル
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => textv7()),
  did: text("did").notNull().unique(),
  handle: text("handle").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// プロフィールテーブル
export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// GitHub接続情報テーブル
export const githubConnections = sqliteTable("github_connections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => textv7()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  refreshToken: text("refresh_token"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// 認証セッションテーブル
export const authSessions = sqliteTable("auth_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => textv7()),
  key: text("key").notNull().unique(),
  session: text("session", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// 認証ステートテーブル
export const authStates = sqliteTable("auth_states", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => textv7()),
  key: text("key").notNull().unique(),
  state: text("state", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// リレーションの定義
export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  githubConnection: one(githubConnections, {
    fields: [users.id],
    references: [githubConnections.userId],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const githubConnectionsRelations = relations(
  githubConnections,
  ({ one }) => ({
    user: one(users, {
      fields: [githubConnections.userId],
      references: [users.id],
    }),
  }),
);
