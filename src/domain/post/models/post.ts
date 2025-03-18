/**
 * 投稿エンティティ
 */
import { z } from "zod";

/**
 * 投稿ステータス
 */
export const PostStatus = {
  POSTED: "posted",
  ERROR: "error"
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

/**
 * 投稿ステータスのZodスキーマ
 */
export const postStatusSchema = z.enum([
  PostStatus.POSTED, 
  PostStatus.ERROR
]);

/**
 * 投稿のZodスキーマ
 */
export const postSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  noteId: z.string().uuid(),
  postUri: z.string().optional(),
  postCid: z.string().optional(),
  status: postStatusSchema,
  errorMessage: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * 投稿の型定義
 */
export type Post = z.infer<typeof postSchema>;

/**
 * 投稿が成功したかどうかを判定する
 */
export function isPostSuccessful(post: Post): boolean {
  return post.status === PostStatus.POSTED;
}

/**
 * 投稿がエラーかどうかを判定する
 */
export function isPostError(post: Post): boolean {
  return post.status === PostStatus.ERROR;
} 