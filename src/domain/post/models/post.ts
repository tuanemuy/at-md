/**
 * 投稿エンティティ
 */
import { z } from "zod";

/**
 * 投稿ステータス
 */
export const PostStatus = {
  POSTED: "posted",
  ERROR: "error",
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

/**
 * 投稿ステータスのZodスキーマ
 */
export const postStatusSchema = z.enum([PostStatus.POSTED, PostStatus.ERROR]);

/**
 * 投稿のZodスキーマ
 */
export const postSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  notePath: z.string().nonempty(),
  postUri: z.string().nonempty(),
  postCid: z.string().nonempty(),
  status: postStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * 投稿の型定義
 */
export type Post = z.infer<typeof postSchema>;
