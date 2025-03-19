/**
 * ユーザーリポジトリのインターフェース
 */
import { z } from "zod";
import type { Result } from "neverthrow";
import type { User } from "../models";
import type { RepositoryError } from "@/domain/types/error";

/**
 * ユーザー作成時のZodスキーマ
 */
export const createUserSchema = z.object({
  did: z.string().nonempty(),
  profile: z.object({
    displayName: z.string().nonempty(),
    description: z.string().nonempty(),
    avatarUrl: z.string().url(),
    bannerUrl: z.string().url(),
  }),
});

/**
 * ユーザー更新時のZodスキーマ
 */
export const updateUserSchema = z.object({
  id: z.string().uuid(),
  did: z.string().nonempty(),
  profile: z.object({
    displayName: z.string().nonempty(),
    description: z.string().nonempty(),
    avatarUrl: z.string().url(),
    bannerUrl: z.string().url(),
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
  create(user: CreateUser): Promise<Result<User, RepositoryError>>;

  /**
   * ユーザーを更新する
   */
  update(user: UpdateUser): Promise<Result<User, RepositoryError>>;

  /**
   * 指定したIDのユーザーを取得する
   */
  findById(id: string): Promise<Result<User | null, RepositoryError>>;

  /**
   * 指定したDIDのユーザーを取得する
   */
  findByDid(did: string): Promise<Result<User | null, RepositoryError>>;

  /**
   * 指定したIDのユーザーを削除する
   */
  delete(id: string): Promise<Result<void, RepositoryError>>;
} 