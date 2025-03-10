/**
 * ユーザーテーブルのスキーマ定義
 */

import { pgTable, text, timestamp } from "npm:drizzle-orm/pg-core";
import { generateId } from "../../../core/common/mod.ts";

/**
 * ユーザーテーブル
 */
export const users = pgTable("users", {
  // ユーザーID
  id: text("id").primaryKey().notNull().$defaultFn(() => generateId()),
  
  // ユーザー名
  username: text("username").notNull().unique(),
  
  // メールアドレス
  email: text("email").notNull().unique(),
  
  // ATプロトコルのDID
  atIdentifier: text("at_identifier"),
  
  // ATプロトコルのハンドル（オプション）
  did: text("did"),
  
  // パスワードハッシュ
  passwordHash: text("password_hash"),
  
  // 作成日時
  createdAt: timestamp("created_at").notNull().defaultNow(),
  
  // 更新日時
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}); 