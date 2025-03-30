import type { RepositoryError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";
/**
 * ブックリポジトリのインターフェース
 */
import { z } from "zod";
import type { Book } from "../models";
import { SyncStatusCode } from "../models/sync-status";

/**
 * ブック作成時のZodスキーマ
 */
export const createBookSchema = z.object({
  userId: z.string().uuid(),
  owner: z.string().nonempty(),
  repo: z.string().nonempty(),
  details: z.object({
    name: z.string().nonempty(),
    description: z.string().nonempty(),
  }),
  syncStatus: z.object({
    lastSyncedAt: z.date().nullable(),
    status: z.nativeEnum(SyncStatusCode),
  }),
});

/**
 * ブック更新時のZodスキーマ
 */
export const updateBookSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  owner: z.string().nonempty(),
  repo: z.string().nonempty(),
  details: z.object({
    name: z.string().nonempty(),
    description: z.string().nonempty(),
  }),
  syncStatus: z.object({
    lastSyncedAt: z.date().nullable(),
    status: z.nativeEnum(SyncStatusCode),
  }),
});

/**
 * ブック作成時の型定義
 */
export type CreateBook = z.infer<typeof createBookSchema>;

/**
 * ブック更新時の型定義
 */
export type UpdateBook = z.infer<typeof updateBookSchema>;

/**
 * ブックリポジトリのインターフェース
 */
export interface BookRepository {
  /**
   * ブックを作成する
   */
  create(book: CreateBook): ResultAsync<Book, RepositoryError>;

  /**
   * ブックを更新する
   */
  update(book: UpdateBook): ResultAsync<Book, RepositoryError>;

  /**
   * 指定したIDのブックを取得する
   */
  findById(id: string): ResultAsync<Book, RepositoryError>;

  /**
   * 指定したユーザーIDのブック一覧を取得する
   */
  findByUserId(userId: string): ResultAsync<Book[], RepositoryError>;

  /**
   * 指定したオーナーとリポジトリのブックを取得する
   */
  findByOwnerAndRepo(
    owner: string,
    repo: string,
  ): ResultAsync<Book, RepositoryError>;

  /**
   * 指定したIDのブックを削除する
   */
  delete(id: string, userId: string): ResultAsync<void, RepositoryError>;
}
