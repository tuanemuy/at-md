import type { ExternalServiceError } from "@/domain/types/error";
/**
 * GitHub連携アダプターのインターフェース
 */
import type { ResultAsync } from "neverthrow";
import type { GitHubInstallation } from "../dtos";

/**
 * GitHub連携アダプターのインターフェース
 */
export interface GitHubAppProvider {
  /**
   * GitHubアプリのインストール一覧を取得する
   */
  getInstallations(
    accessToken: string,
  ): ResultAsync<GitHubInstallation[], ExternalServiceError>;

  /**
   * GitHub OAuthのアクセストークンを取得する
   */
  getAccessToken(code: string): ResultAsync<
    {
      accessToken: string;
      refreshToken?: string;
    },
    ExternalServiceError
  >;
}
