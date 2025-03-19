/**
 * ノートリポジトリのインターフェース
 */
import { z } from "zod";
import type { Result } from "neverthrow";
import type { Note } from "../models";
import { noteScopeSchema } from "../models/note";
import type { RepositoryError } from "@/domain/types/error";

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
  tags: z.array(z.object({
    name: z.string().nonempty()
  })).default([])
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
  tags: z.array(z.object({
    name: z.string().nonempty()
  })).default([])
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
  findById(id: string): Promise<Result<Note | null, RepositoryError>>;

  /**
   * 指定したブックIDのノート一覧を取得する
   */
  findByBookId(bookId: string, pagination?: PaginationParams): Promise<Result<Note[], RepositoryError>>;

  /**
   * 指定したタグIDのノート一覧を取得する
   */
  findByTag(tagId: string, pagination?: PaginationParams): Promise<Result<Note[], RepositoryError>>;

  /**
   * 指定した条件でノートを検索する
   */
  search(bookId: string, query: string, pagination?: PaginationParams): Promise<Result<Note[], RepositoryError>>;

  /**
   * 指定したIDのノートを削除する
   */
  delete(id: string): Promise<Result<void, RepositoryError>>;
} 