/**
 * ユーザースキーマ
 * ユーザー関連のデータベーステーブルを定義します。
 */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateId } from "../../../core/common/id.ts";

/**
 * ユーザーテーブル
 */
export const users = pgTable("users", {
  // ユーザーID
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  
  // ユーザー名
  username: text("username").notNull().unique(),
  
  // メールアドレス
  email: text("email").notNull().unique(),
  
  // ATプロトコルのDID
  atDid: text("at_did").notNull().unique(),
  
  // ATプロトコルのハンドル（オプション）
  atHandle: text("at_handle").unique(),
  
  // 作成日時
  createdAt: timestamp("created_at").notNull().defaultNow(),
  
  // 更新日時
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}); 