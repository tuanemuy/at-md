import type { Result } from "@/lib/result";
import type { RepositoryError } from "../../types/error";
import type { Pagination } from "../../types/pagination";
import { z } from "zod";
import type { Note } from "../models";
import { noteScopeSchema } from "../models/note";

/**
 * ノート作成時のZodスキーマ
 */
export const createNoteSchema = z.object({
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  path: z.string().nonempty(),
  title: z.string().nonempty(),
  body: z.string(),
  scope: noteScopeSchema,
  tags: z.array(z.string().nonempty()).default([]),
});

/**
 * ノート更新時のZodスキーマ
 */
export const updateNoteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  path: z.string().nonempty(),
  title: z.string().nonempty(),
  body: z.string(),
  scope: noteScopeSchema,
  tags: z.array(z.string().nonempty()).default([]),
});

/**
 * ノート作成時の型定義
 */
export type CreateNote = z.infer<typeof createNoteSchema>;

/**
 * ノート更新時の型定義
 */
export type UpdateNote = z.infer<typeof updateNoteSchema>;

/**
 * ノートリポジトリのインターフェース
 */
export interface NoteRepository {
  /**
   * ノートを作成する
   */
  create(note: CreateNote): Promise<Result<Note, RepositoryError>>;

  /**
   * ノートを更新する
   */
  update(note: UpdateNote): Promise<Result<Note, RepositoryError>>;

  /**
   * 指定したIDのノートを取得する
   */
  findById(id: string): Promise<Result<Note, RepositoryError>>;

  /**
   * 指定したブックIDのノート一覧を取得する
   */
  findByBookId(
    bookId: string,
    pagination?: Pagination,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  /**
   * 指定したブックID、タグIDのノート一覧を取得する
   */
  findByTag(
    bookId: string,
    tagId: string,
    pagination?: Pagination,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  /**
   * 指定した条件でノートを検索する
   */
  search(
    bookId: string,
    query: string,
    pagination?: Pagination,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  /**
   * 指定したIDのノートを削除する
   */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
