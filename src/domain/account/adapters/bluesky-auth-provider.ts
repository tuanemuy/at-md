import type { ClientMetadata } from "@/domain/account/dtos/bluesky-client-metadata";
import type { BlueskyProfile } from "@/domain/account/dtos/bluesky-profile";
import type { ExternalServiceError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";
/**
 * Bluesky認証アダプターのインターフェース
 */

/**
 * 認証オプション
 */
export interface AuthorizeOptions {
  scope: string;
}

/**
 * Bluesky認証アダプターのインターフェース
 */
export interface BlueskyAuthProvider {
  /**
   * クライアントメタデータを取得する
   */
  getClientMetadata(): ClientMetadata;

  /**
   * Blueskyの認証URLを取得する
   */
  authorize(
    handle: string,
    state: string,
  ): ResultAsync<URL, ExternalServiceError>;

  /**
   * コールバックURLからセッションを作成する
   */
  callback(
    params: URLSearchParams,
  ): ResultAsync<{ did: string; state: string | null }, ExternalServiceError>;

  /**
   * ユーザープロフィールを取得する
   */
  getUserProfile(
    did: string,
  ): ResultAsync<BlueskyProfile, ExternalServiceError>;

  /**
   * セッションを検証する
   */
  validateSession(did: string): ResultAsync<string, ExternalServiceError>;
}
