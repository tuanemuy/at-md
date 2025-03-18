/**
 * GitHub連携情報リポジトリのインターフェース
 */
import type { Result } from "neverthrow";
import type { GitHubConnection } from "../models";
import type { AccountError } from "../models/errors";

/**
 * GitHub連携情報リポジトリのインターフェース
 */
export interface GitHubConnectionRepository {
  /**
   * GitHub連携情報を保存する
   */
  save(connection: GitHubConnection): Promise<Result<GitHubConnection, AccountError>>;

  /**
   * 指定したユーザーIDのGitHub連携情報を取得する
   */
  findByUserId(userId: string): Promise<Result<GitHubConnection[], AccountError>>;

  /**
   * 指定したIDのGitHub連携情報を取得する
   */
  findById(id: string): Promise<Result<GitHubConnection | null, AccountError>>;

  /**
   * 指定したIDのGitHub連携情報を削除する
   */
  delete(id: string): Promise<Result<void, AccountError>>;
} 