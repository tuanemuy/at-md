import type { RepositoryError } from "@/domain/types/error";
import type { Result } from "neverthrow";
/**
 * タグリポジトリのインターフェース
 */
import { z } from "zod";
import type { Tag } from "../models";

/**
 * タグ作成時のZodスキーマ
 */
export const createTagSchema = z.object({
  name: z.string().nonempty(),
});

/**
 * タグ更新時のZodスキーマ
 */
export const updateTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nonempty(),
});

/**
 * タグ作成時の型定義
 */
export type CreateTag = z.infer<typeof createTagSchema>;

/**
 * タグ更新時の型定義
 */
export type UpdateTag = z.infer<typeof updateTagSchema>;

/**
 * タグリポジトリのインターフェース
 */
export interface TagRepository {
  /**
   * タグを作成する
   */
  create(tag: CreateTag): Promise<Result<Tag, RepositoryError>>;

  /**
   * タグを更新する
   */
  update(tag: UpdateTag): Promise<Result<Tag, RepositoryError>>;

  /**
   * 指定したIDのタグを取得する
   */
  findById(id: string): Promise<Result<Tag | null, RepositoryError>>;

  /**
   * 指定したノートIDのタグ一覧を取得する
   */
  findByNoteId(noteId: string): Promise<Result<Tag[], RepositoryError>>;

  /**
   * 指定したIDのタグを削除する
   */
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
