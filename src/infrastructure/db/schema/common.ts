import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "@/domain/shared/models/id";

/**
 * 共通のカラム定義
 */
export const commonColumns = {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateId()),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

/**
 * 外部キー制約のオプション
 */
export const foreignKeyOptions = {
  onDelete: "cascade" as const,
  onUpdate: "cascade" as const,
};
