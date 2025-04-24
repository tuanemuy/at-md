import type { ClientMetadata } from "@/domain/account/dtos/bluesky-client-metadata";
import type { GitHubInstallation } from "@/domain/account/dtos/github-installation";
import type { GitHubConnection } from "@/domain/account/models/github-connection";
import type { SessionData } from "@/domain/account/models/session-data";
import type { User } from "@/domain/account/models/user";
import type { ApplicationServiceError } from "@/domain/types/error";
import type { PaginationParams } from "@/domain/types/pagination";
import type { ResultAsync } from "@/lib/result";
import { z } from "zod";

export const startBlueskyAuthInputSchema = z.object({
  handle: z.string(),
});

export interface AccountUsecase<T> {
  /**
   * クライアントメタデータを取得する
   */
  getClientMetadata: () => ClientMetadata;

  /**
   * Bluesky認証を開始する
   */
  startBlueskyAuth: (input: {
    handle: string;
    context: T;
  }) => ResultAsync<string, ApplicationServiceError>;

  /**
   * Bluesky認証のコールバックを処理する
   */
  handleBlueskyAuthCallback: (input: {
    params: URLSearchParams;
    context: T;
  }) => ResultAsync<User, ApplicationServiceError>;

  /**
   * セッションを検証する
   */
  validateSession: (input: {
    context: T;
  }) => ResultAsync<SessionData, ApplicationServiceError>;

  /**
   * セッションを終了する
   */
  logout: (input: {
    context: T;
  }) => ResultAsync<void, ApplicationServiceError>;

  syncProfile: (input: {
    userId: string;
    did: string;
  }) => ResultAsync<User, ApplicationServiceError>;

  startGitHubAccessTokenFlow: (input: {
    context: T;
  }) => ResultAsync<string, ApplicationServiceError>;

  startGitHubAppsInstallation: (input: {
    context: T;
  }) => ResultAsync<string, ApplicationServiceError>;

  /**
   * GitHubのアクセストークンを生成して保存する
   */
  connectGitHub: (input: {
    userId: string;
    code: string;
    state: string;
    context: T;
  }) => ResultAsync<void, ApplicationServiceError>;

  /**
   * GitHub認証のコールバックを処理する
   */
  disconnectGitHub: (input: {
    userId: string;
  }) => ResultAsync<void, ApplicationServiceError>;

  /**
   * GitHubのアクセストークンを更新する
   */
  refreshGitHubConnection: (input: {
    userId: string;
  }) => ResultAsync<GitHubConnection, ApplicationServiceError>;

  /**
   * ユーザーを取得する
   */
  getUserById: (input: {
    userId: string;
  }) => ResultAsync<User, ApplicationServiceError>;

  /**
   * 指定したhandleのユーザーを取得する
   */
  getUserByHandle: (input: {
    handle: string;
  }) => ResultAsync<User, ApplicationServiceError>;

  /**
   * ユーザーを削除する
   */
  deleteUser: (input: {
    userId: string;
  }) => ResultAsync<void, ApplicationServiceError>;

  /**
   * GitHubとの接続情報を取得する
   */
  getGitHubConnection: (input: {
    userId: string;
  }) => ResultAsync<GitHubConnection, ApplicationServiceError>;

  /**
   * GitHub Appsのインストール情報を取得する
   */
  listGitHubInstallations: (input: {
    userId: string;
  }) => ResultAsync<GitHubInstallation[], ApplicationServiceError>;

  countUsers: () => ResultAsync<number, ApplicationServiceError>;

  listUsers: (input: {
    page: number;
    limit: number;
  }) => ResultAsync<Omit<User, "profile">[], ApplicationServiceError>;
}
