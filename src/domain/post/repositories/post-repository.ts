import type { RepositoryError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";
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
  bookId: z.string().uuid(),
  notePath: z.string().nonempty(),
  status: z.nativeEnum(PostStatus),
  platform: z.literal("bluesky"),
  postUri: z.string().nonempty(),
  postCid: z.string().nonempty(),
});

/**
 * 投稿更新時のZodスキーマ
 */
export const updatePostSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  notePath: z.string().nonempty(),
  status: z.nativeEnum(PostStatus),
  postUri: z.string().nonempty(),
  postCid: z.string().nonempty(),
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
  create(post: CreatePost): ResultAsync<Post, RepositoryError>;

  /**
   * 投稿を更新する
   */
  update(post: UpdatePost): ResultAsync<Post, RepositoryError>;

  /**
   * 指定したIDの投稿を取得する
   */
  findById(id: string): ResultAsync<Post, RepositoryError>;

  /**
   * 指定したノートパスの投稿を取得する
   */
  findByNotePath(
    bookId: string,
    notePath: string,
  ): ResultAsync<Post, RepositoryError>;

  /**
   * 指定したユーザーIDの投稿を取得する
   */
  findByUserId(userId: string): ResultAsync<Post[], RepositoryError>;

  /**
   * 指定したIDの投稿を削除する
   */
  delete(id: string): ResultAsync<void, RepositoryError>;
}
