/**
 * タグエンティティ
 */
import { z } from "zod";

/**
 * タグのZodスキーマ
 */
export const tagSchema = z.object({
  id: z.string().uuid(),
  bookId: z.string().uuid(),
  name: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * タグの型定義
 */
export type Tag = z.infer<typeof tagSchema>;
