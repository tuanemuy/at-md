/**
 * ユーザーリポジトリのインターフェース
 */
import type { Result } from "neverthrow";
import type { User } from "../models";
import type { RepositoryError } from "@/domain/types/error";

/**
 * ユーザーリポジトリのインターフェース
 */
export interface UserRepository {
  /**
   * ユーザーを保存する
   */
  save(user: User): Promise<Result<User, RepositoryError>>;

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