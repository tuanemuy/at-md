import type { RepositoryError } from "@/domain/types/error";
import type { Result } from "neverthrow";
/**
 * 投稿リポジトリのインターフェース
 */
import { z } from "zod";
import type { Post } from "../models";
import { PostStatus } from "../models/post";

/**
 * 投稿作成時のZodスキーマ
 */
export const createPostSchema = z.object({
  userId: z.string().uuid(),
  noteId: z.string().uuid(),
  status: z.nativeEnum(PostStatus),
  platform: z.literal("bluesky"),
  postUri: z.string().nullable(),
  postCid: z.string().nullable(),
  errorMessage: z.string().nullable(),
});

/**
 * 投稿更新時のZodスキーマ
 */
export const updatePostSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  noteId: z.string().uuid(),
  status: z.nativeEnum(PostStatus),
  postUri: z.string().nullable(),
  postCid: z.string().nullable(),
  errorMessage: z.string().nullable(),
});

/**
 * 投稿作成時の型定義
 */
export type CreatePost = z.infer<typeof createPostSchema>;

/**
 * 投稿更新時の型定義
 */
export type UpdatePost = z.infer<typeof updatePostSchema>;

/**
 * 投稿リポジトリのインターフェース
 */
export interface PostRepository {
  /**
   * 投稿を作成する
   */
  create(post: CreatePost): Promise<Result<Post, RepositoryError>>;

  /**
   * 投稿を更新する
   */
  update(post: UpdatePost): Promise<Result<Post, RepositoryError>>;

  /**
   * 指定したIDの投稿を取得する
   */
  findById(id: string): Promise<Result<Post | null, RepositoryError>>;

  /**
   * 指定したノートIDの投稿を取得する
   */
  findByNoteId(noteId: string): Promise<Result<Post | null, RepositoryError>>;

  /**
   * 指定したユーザーIDの投稿を取得する
   */
  findByUserId(userId: string): Promise<Result<Post[], RepositoryError>>;

  /**
   * 指定したIDの投稿を削除する
   */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
