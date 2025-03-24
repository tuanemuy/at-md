import type { ExternalServiceError } from "@/domain/types/error";
/**
 * GitHub連携アダプターのインターフェース
 */
import type { Result } from "neverthrow";
import type { GitHubRepository, GitHubWebhook } from "../dtos";

/**
 * GitHub連携アダプターのインターフェース
 */
export interface GitHubContentProvider {
  /**
   * リポジトリ一覧を取得する
   */
  listRepositories(
    accessToken: string,
  ): Promise<Result<GitHubRepository[], ExternalServiceError>>;

  /**
   * リポジトリの特定パスのコンテンツを取得する
   */
  getContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
  ): Promise<Result<string, ExternalServiceError>>;

  /**
   * リポジトリ内のパス一覧を取得する
   */
  listPaths(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<Result<string[], ExternalServiceError>>;

  /**
   * Webhookを設定する
   */
  setupWebhook(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<Result<number, ExternalServiceError>>;
}
