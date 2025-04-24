import type { RepositoryError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";
/**
 * GitHub連携情報リポジトリのインターフェース
 */
import { z } from "zod";
import type { GitHubConnection } from "../models";

/**
 * GitHub連携情報作成時のZodスキーマ
 */
export const createGitHubConnectionSchema = z.object({
  userId: z.string().uuid(),
  accessToken: z.string().nonempty(),
  refreshToken: z.string().nonempty().nullable(),
  expiresAt: z.date().nullable(),
});

/**
 * GitHub連携情報更新時のZodスキーマ
 */
export const updateGitHubConnectionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accessToken: z.string().nonempty(),
  refreshToken: z.string().nonempty().nullable(),
  expiresAt: z.date().nullable(),
});

/**
 * GitHub連携情報作成時の型定義
 */
export type CreateGitHubConnection = z.infer<
  typeof createGitHubConnectionSchema
>;

/**
 * GitHub連携情報更新時の型定義
 */
export type UpdateGitHubConnection = z.infer<
  typeof updateGitHubConnectionSchema
>;

/**
 * GitHub連携情報リポジトリのインターフェース
 */
export interface GitHubConnectionRepository {
  /**
   * GitHub連携情報を作成する
   */
  create(
    connection: CreateGitHubConnection,
  ): ResultAsync<GitHubConnection, RepositoryError>;

  /**
   * GitHub連携情報を更新する
   */
  update(
    connection: UpdateGitHubConnection,
  ): ResultAsync<GitHubConnection, RepositoryError>;

  /**
   * 指定したユーザーIDのGitHub連携情報を取得する
   */
  findByUserId(userId: string): ResultAsync<GitHubConnection, RepositoryError>;

  /**
   * 指定したIDのGitHub連携情報を取得する
   */
  findById(id: string): ResultAsync<GitHubConnection, RepositoryError>;

  /**
   * 指定したユーザーIDのGitHub連携情報を削除する
   */
  deleteByUserId(userId: string): ResultAsync<void, RepositoryError>;

  /**
   * 指定したIDのGitHub連携情報を削除する
   */
  delete(id: string): ResultAsync<void, RepositoryError>;
}
