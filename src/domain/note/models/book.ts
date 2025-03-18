/**
 * ブックエンティティ
 */
import { z } from "zod";
import { bookDetailsSchema } from "./book-details";
import { syncStatusSchema } from "./sync-status";

/**
 * ブックのZodスキーマ
 */
export const bookSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  owner: z.string().nonempty(),
  repo: z.string().nonempty(),
  details: bookDetailsSchema,
  syncStatus: syncStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * ブックの型定義
 */
export type Book = z.infer<typeof bookSchema>; 