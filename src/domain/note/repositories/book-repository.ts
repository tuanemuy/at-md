/**
 * ブックリポジトリのインターフェース
 */
import type { Result } from "neverthrow";
import type { Book } from "../models";
import type { NoteError } from "../models/errors";

/**
 * ブックリポジトリのインターフェース
 */
export interface BookRepository {
  /**
   * ブックを保存する
   */
  save(book: Book): Promise<Result<Book, NoteError>>;

  /**
   * 指定したIDのブックを取得する
   */
  findById(id: string): Promise<Result<Book | null, NoteError>>;

  /**
   * 指定したユーザーIDのブック一覧を取得する
   */
  findByUserId(userId: string): Promise<Result<Book[], NoteError>>;

  /**
   * 指定したオーナーとリポジトリのブックを取得する
   */
  findByOwnerAndRepo(owner: string, repo: string): Promise<Result<Book | null, NoteError>>;

  /**
   * 指定したIDのブックを削除する
   */
  delete(id: string): Promise<Result<void, NoteError>>;
} 