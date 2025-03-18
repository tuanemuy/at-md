/**
 * ノートリポジトリのインターフェース
 */
import type { Result } from "neverthrow";
import type { Note } from "../models";
import type { NoteError } from "../models/errors";

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * ノートリポジトリのインターフェース
 */
export interface NoteRepository {
  /**
   * ノートを保存する
   */
  save(note: Note): Promise<Result<Note, NoteError>>;

  /**
   * 指定したIDのノートを取得する
   */
  findById(id: string): Promise<Result<Note | null, NoteError>>;

  /**
   * 指定したブックIDのノート一覧を取得する
   */
  findByBookId(bookId: string, pagination?: PaginationParams): Promise<Result<Note[], NoteError>>;

  /**
   * 指定したタグIDのノート一覧を取得する
   */
  findByTag(tagId: string, pagination?: PaginationParams): Promise<Result<Note[], NoteError>>;

  /**
   * 指定した条件でノートを検索する
   */
  search(bookId: string, query: string, pagination?: PaginationParams): Promise<Result<Note[], NoteError>>;

  /**
   * 指定したIDのノートを削除する
   */
  delete(id: string): Promise<Result<void, NoteError>>;
} 