/**
 * タグリポジトリのインターフェース
 */
import type { Result } from "neverthrow";
import type { Tag } from "../models";
import type { NoteError } from "../models/errors";

/**
 * タグリポジトリのインターフェース
 */
export interface TagRepository {
  /**
   * タグを保存する
   */
  save(tag: Tag): Promise<Result<Tag, NoteError>>;

  /**
   * 指定したIDのタグを取得する
   */
  findById(id: string): Promise<Result<Tag | null, NoteError>>;

  /**
   * 指定した名前のタグを取得する
   */
  findByName(name: string): Promise<Result<Tag | null, NoteError>>;

  /**
   * 指定したブックIDのタグ一覧を取得する
   */
  findByBookId(bookId: string): Promise<Result<Tag[], NoteError>>;

  /**
   * 指定したIDのタグを削除する
   */
  delete(id: string): Promise<Result<void, NoteError>>;
} 