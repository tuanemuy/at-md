/**
 * GitHub連携アダプターのインターフェース
 */
import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/domain/types/error";
import type { GitHubInstallation } from "../dtos";

/**
 * GitHub連携アダプターのインターフェース
 */
export interface GitHubAppProvider {
  /**
   * GitHubアプリのインストール一覧を取得する
   */
  getInstallations(accessToken: string): Promise<Result<GitHubInstallation[], ExternalServiceError>>;

  /**
   * GitHub OAuthのアクセストークンを取得する
   */
  getAccessToken(code: string): Promise<Result<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope: string[];
  }, ExternalServiceError>>;
} 