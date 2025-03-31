import type { ResultAsync } from "neverthrow";
import { z } from "zod";
import type { RepositoryError } from "../../types/error";
import type { Pagination } from "../../types/pagination";
import type { Note } from "../models";
import { noteScopeSchema } from "../models/note";

/**
 * ノート作成時のZodスキーマ
 */
export const createOrUpdateNoteSchema = z.object({
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  path: z.string().nonempty(),
  title: z.string().nonempty(),
  body: z.string(),
  scope: noteScopeSchema,
  tags: z.array(z.string().nonempty()).default([]),
});

/**
 * ノート作成または更新時の型定義
 */
export type CreateOrUpdateNote = z.infer<typeof createOrUpdateNoteSchema>;

/**
 * ノートリポジトリのインターフェース
 */
export interface NoteRepository {
  /**
   * ノートを作成または更新する
   */
  createOrUpdate(note: CreateOrUpdateNote): ResultAsync<Note, RepositoryError>;

  /**
   * 指定したIDのノートを取得する
   */
  findById(id: string): ResultAsync<Note, RepositoryError>;

  /**
   * 指定したブックIDのノート一覧を取得する
   */
  findByBookId(
    bookId: string,
    pagination?: Pagination,
  ): ResultAsync<{ items: Note[]; count: number }, RepositoryError>;

  /**
   * 指定したブックID、タグIDのノート一覧を取得する
   */
  findByTag(
    bookId: string,
    tagId: string,
    pagination?: Pagination,
  ): ResultAsync<{ items: Note[]; count: number }, RepositoryError>;

  /**
   * 指定した条件でノートを検索する
   */
  search(
    bookId: string,
    query: string,
    pagination?: Pagination,
  ): ResultAsync<{ items: Note[]; count: number }, RepositoryError>;

  /**
   * 指定したIDのノートを削除する
   */
  delete(id: string): ResultAsync<void, RepositoryError>;

  /**
   * 指定したブックID、pathのノートを削除する
   */
  deleteByPath(
    bookId: string,
    path: string[],
  ): ResultAsync<void, RepositoryError>;
}
