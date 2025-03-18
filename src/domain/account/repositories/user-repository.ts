/**
 * ユーザーリポジトリのインターフェース
 */
import type { Result } from "neverthrow";
import type { User } from "../models";
import type { AccountError } from "../models/errors";

/**
 * ユーザーリポジトリのインターフェース
 */
export interface UserRepository {
  /**
   * ユーザーを保存する
   */
  save(user: User): Promise<Result<User, AccountError>>;

  /**
   * 指定したIDのユーザーを取得する
   */
  findById(id: string): Promise<Result<User | null, AccountError>>;

  /**
   * 指定したDIDのユーザーを取得する
   */
  findByDid(did: string): Promise<Result<User | null, AccountError>>;

  /**
   * 指定したIDのユーザーを削除する
   */
  delete(id: string): Promise<Result<void, AccountError>>;
} 