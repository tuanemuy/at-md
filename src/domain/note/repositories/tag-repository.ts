import type { ResultAsync } from "neverthrow";
import type { RepositoryError } from "../../types/error";
import type { Tag } from "../models";

/**
 * タグリポジトリのインターフェース
 */
export interface TagRepository {
  /**
   * 指定したブックIDのタグ一覧を取得する
   */
  findByBookId(bookId: string): ResultAsync<Tag[], RepositoryError>;

  /**
   * 指定したノートIDのタグ一覧を取得する
   */
  findByNoteId(noteId: string): ResultAsync<Tag[], RepositoryError>;

  /**
   * 使用されていないタグを削除する
   */
  deleteUnused(bookId: string): ResultAsync<void, RepositoryError>;
}
