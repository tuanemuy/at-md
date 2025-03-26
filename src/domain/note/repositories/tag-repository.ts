import type { RepositoryError } from "@/domain/types/error";
import type { Result } from "neverthrow";
import type { Tag } from "../models";

/**
 * タグリポジトリのインターフェース
 */
export interface TagRepository {
  /**
   * 指定したノートIDのタグ一覧を取得する
   */
  findByNoteId(noteId: string): Promise<Result<Tag[], RepositoryError>>;

  /**
   * 使われていないタグを削除する
   */
  deleteUnused(): Promise<Result<void, RepositoryError>>;
}
