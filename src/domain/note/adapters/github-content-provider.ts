import type { ExternalServiceError } from "@/domain/types/error";
import type { PaginationParams } from "@/domain/types/pagination";
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
    pagination?: PaginationParams,
  ): ResultAsync<GitHubRepository[], ExternalServiceError>;

  /**
   * リポジトリを検索する
   */
  searchRepositories(
    accessToken: string,
    query: string,
    owner: {
      type: "user" | "org";
      name: string;
    },
    pagination: PaginationParams,
  ): ResultAsync<
    { repositories: GitHubRepository[]; count: number },
    ExternalServiceError
  >;

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

  deleteWebhook(
    accessToken: string,
    owner: string,
    repo: string,
    webhookId: number,
  ): ResultAsync<void, ExternalServiceError>;

  validateWebhook(secret: string): boolean;
}
