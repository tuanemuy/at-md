import type { RepositoryError } from "@/domain/types/error";
import type { Result } from "neverthrow";
/**
 * AuthSessionリポジトリのインターフェース
 */
import { z } from "zod";
import type { AuthSession } from "../models";

/**
 * AuthSession作成時のZodスキーマ
 */
export const createAuthSessionSchema = z.object({
  key: z.string().nonempty(),
  session: z.string().nonempty(),
});

/**
 * AuthSession作成時の型定義
 */
export type CreateAuthSession = z.infer<typeof createAuthSessionSchema>;

/**
 * AuthSessionリポジトリのインターフェース
 */
export interface AuthSessionRepository {
  /**
   * AuthSessionを作成する
   */
  create(
    authSession: CreateAuthSession,
  ): Promise<Result<AuthSession, RepositoryError>>;

  /**
   * 指定したキーのAuthSessionを取得する
   */
  findByKey(key: string): Promise<Result<AuthSession | null, RepositoryError>>;

  /**
   * 指定したキーのAuthSessionを削除する
   */
  deleteByKey(key: string): Promise<Result<void, RepositoryError>>;
}
