/**
 * タグリポジトリのインターフェース
 */
import type { Result } from "neverthrow";
import type { Tag } from "../models";
import type { RepositoryError } from "@/domain/types/error";

/**
 * タグリポジトリのインターフェース
 */
export interface TagRepository {
  /**
   * タグを保存する
   */
  save(tag: Tag): Promise<Result<Tag, RepositoryError>>;

  /**
   * 指定したIDのタグを取得する
   */
  findById(id: string): Promise<Result<Tag | null, RepositoryError>>;

  /**
   * 指定した名前のタグを取得する
   */
  findByName(name: string): Promise<Result<Tag | null, RepositoryError>>;

  /**
   * 指定したブックIDのタグ一覧を取得する
   */
  findByBookId(bookId: string): Promise<Result<Tag[], RepositoryError>>;

  /**
   * 指定したIDのタグを削除する
   */
  delete(id: string): Promise<Result<void, RepositoryError>>;
} 