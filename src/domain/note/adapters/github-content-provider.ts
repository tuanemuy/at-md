import type { ExternalServiceError } from "@/domain/types/error";
/**
 * GitHub連携アダプターのインターフェース
 */
import type { ResultAsync } from "neverthrow";
import type { GitHubRepository } from "../dtos";

/**
 * GitHub連携アダプターのインターフェース
 */
export interface GitHubContentProvider {
  /**
   * リポジトリ一覧を取得する
   */
  listRepositories(
    accessToken: string,
  ): ResultAsync<GitHubRepository[], ExternalServiceError>;

  /**
   * リポジトリの特定パスのコンテンツを取得する
   */
  getContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
  ): ResultAsync<string, ExternalServiceError>;

  /**
   * リポジトリの特定パスのコンテンツを取得する
   */
  getContentByInstallation(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
  ): ResultAsync<string, ExternalServiceError>;

  /**
   * リポジトリ内のパス一覧を取得する
   */
  listPaths(
    accessToken: string,
    owner: string,
    repo: string,
  ): ResultAsync<string[], ExternalServiceError>;

  /**
   * Webhookを設定する
   */
  setupWebhook(
    accessToken: string,
    owner: string,
    repo: string,
  ): ResultAsync<number, ExternalServiceError>;
}
