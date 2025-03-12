import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { commonColumns, foreignKeyOptions } from "./common";

/**
 * ユーザーテーブル
 */
export const users = pgTable("users", {
  ...commonColumns,
  name: varchar("name", { length: 255 }).notNull(),
  did: varchar("did", { length: 255 }).notNull().unique(),
});

/**
 * GitHub連携テーブル
 */
export const githubConnections = pgTable("github_connections", {
  ...commonColumns,
  userId: uuid("user_id").notNull().references(() => users.id, foreignKeyOptions),
  installationId: varchar("installation_id", { length: 255 }).notNull(),
  accessToken: text("access_token").notNull(),
  tokenType: varchar("token_type", { length: 50 }).notNull(),
  expiresAt: varchar("expires_at", { length: 50 }).notNull(),
  refreshToken: text("refresh_token"),
  refreshTokenExpiresAt: varchar("refresh_token_expires_at", { length: 50 }),
}); 