/**
 * 投稿リポジトリのインターフェース
 */
import type { Result } from "neverthrow";
import type { Post } from "../models";
import type { PostError } from "../models/errors";

/**
 * 投稿リポジトリのインターフェース
 */
export interface PostRepository {
  /**
   * 投稿を保存する
   */
  save(post: Post): Promise<Result<Post, PostError>>;

  /**
   * 指定したIDの投稿を取得する
   */
  findById(id: string): Promise<Result<Post | null, PostError>>;

  /**
   * 指定したノートIDの投稿を取得する
   */
  findByNoteId(noteId: string): Promise<Result<Post | null, PostError>>;

  /**
   * 指定したユーザーIDの投稿一覧を取得する
   */
  findByUserId(userId: string): Promise<Result<Post[], PostError>>;

  /**
   * 指定したIDの投稿を削除する
   */
  delete(id: string): Promise<Result<void, PostError>>;
} 