import type { RepositoryError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";
/**
 * ユーザーリポジトリのインターフェース
 */
import { z } from "zod";
import type { User } from "../models";

/**
 * ユーザー作成時のZodスキーマ
 */
export const createUserSchema = z.object({
  did: z.string().nonempty(),
  profile: z.object({
    displayName: z.string().nonempty().nullable(),
    description: z.string().nonempty().nullable(),
    avatarUrl: z.string().url().nullable(),
    bannerUrl: z.string().url().nullable(),
  }),
});

/**
 * ユーザー更新時のZodスキーマ
 */
export const updateUserSchema = z.object({
  id: z.string().uuid(),
  did: z.string().nonempty(),
  profile: z.object({
    displayName: z.string().nonempty().nullable(),
    description: z.string().nonempty().nullable(),
    avatarUrl: z.string().url().nullable(),
    bannerUrl: z.string().url().nullable(),
  }),
});

/**
 * ユーザー作成時の型定義
 */
export type CreateUser = z.infer<typeof createUserSchema>;

/**
 * ユーザー更新時の型定義
 */
export type UpdateUser = z.infer<typeof updateUserSchema>;

/**
 * ユーザーリポジトリのインターフェース
 */
export interface UserRepository {
  /**
   * ユーザーを作成する
   */
  create(user: CreateUser): ResultAsync<User, RepositoryError>;

  /**
   * ユーザーを更新する
   */
  update(user: UpdateUser): ResultAsync<User, RepositoryError>;

  /**
   * 指定したIDのユーザーを取得する
   */
  findById(id: string): ResultAsync<User, RepositoryError>;

  /**
   * 指定したDIDのユーザーを取得する
   */
  findByDid(did: string): ResultAsync<User, RepositoryError>;

  /**
   * 指定したIDのユーザーを削除する
   */
  delete(id: string): ResultAsync<void, RepositoryError>;
}
