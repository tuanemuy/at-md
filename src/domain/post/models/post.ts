import { z } from "zod";
import { idSchema, type ID } from "@/domain/shared/models/id";

/**
 * 投稿プラットフォームのスキーマ
 */
export const postPlatformSchema = z.enum(["bluesky"]);

/**
 * 投稿プラットフォームの型
 */
export type PostPlatform = z.infer<typeof postPlatformSchema>;

/**
 * 投稿ステータスのスキーマ
 */
export const postStatusSchema = z.enum(["pending", "published", "failed"]);

/**
 * 投稿ステータスの型
 */
export type PostStatus = z.infer<typeof postStatusSchema>;

/**
 * 投稿のスキーマ
 */
export const postSchema = z.object({
  id: idSchema,
  documentId: idSchema,
  platform: postPlatformSchema,
  uri: z.string().default(""), // Bluesky投稿URI
  status: postStatusSchema.default("pending"),
  publishedAt: z.date().nullable(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: idSchema,
});

/**
 * 投稿の型
 */
export type Post = z.infer<typeof postSchema>;

/**
 * 新しい投稿を作成する
 * @param documentId 文書ID
 * @param platform 投稿プラットフォーム
 * @param userId ユーザーID
 * @param status 投稿ステータス（デフォルト: pending）
 * @returns 新しい投稿オブジェクト
 */
export function createPost(
  documentId: ID,
  platform: PostPlatform,
  userId: ID,
  status: PostStatus = "pending",
): Omit<Post, "id"> {
  const now = new Date();
  return {
    documentId,
    platform,
    uri: "",
    status,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    userId,
  };
}

/**
 * 投稿を更新する
 * @param post 既存の投稿
 * @param updates 更新内容
 * @returns 更新された投稿
 */
export function updatePost(
  post: Post,
  updates: Partial<Pick<Post, "uri" | "status" | "publishedAt" | "error">>,
): Post {
  return {
    ...post,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * 投稿を公開済みに更新する
 * @param post 既存の投稿
 * @param uri Bluesky投稿URI
 * @returns 公開済みに更新された投稿
 */
export function publishPost(post: Post, uri: string): Post {
  const now = new Date();
  return {
    ...post,
    status: "published",
    uri,
    publishedAt: now,
    updatedAt: now,
  };
}

/**
 * 投稿を失敗状態に更新する
 * @param post 既存の投稿
 * @param errorMessage エラーメッセージ
 * @returns 失敗状態に更新された投稿
 */
export function failPost(post: Post, errorMessage: string): Post {
  return {
    ...post,
    status: "failed",
    error: errorMessage,
    updatedAt: new Date(),
  };
}
