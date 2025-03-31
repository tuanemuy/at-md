import type { RepositoryError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";
/**
 * AuthStateリポジトリのインターフェース
 */
import { z } from "zod";
import type { AuthState } from "../models";

/**
 * AuthState作成時のZodスキーマ
 */
export const createAuthStateSchema = z.object({
  key: z.string().nonempty(),
  state: z.string().nonempty(),
});

/**
 * AuthState作成時の型定義
 */
export type CreateAuthState = z.infer<typeof createAuthStateSchema>;

/**
 * AuthStateリポジトリのインターフェース
 */
export interface AuthStateRepository {
  /**
   * AuthStateを作成する
   */
  create(authState: CreateAuthState): ResultAsync<AuthState, RepositoryError>;

  /**
   * 指定したキーのAuthStateを取得する
   */
  findByKey(key: string): ResultAsync<AuthState, RepositoryError>;

  /**
   * 指定したキーのAuthStateを削除する
   */
  deleteByKey(key: string): ResultAsync<void, RepositoryError>;
}
