import type { ExternalServiceError } from "@/domain/types/error";
import type { Result } from "@/lib/result";
/**
 * Bluesky認証アダプターのインターフェース
 */
import type { OAuthSession } from "@atproto/oauth-client-node";
import type { Profile } from "../models";

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
   * Blueskyの認証URLを取得する
   */
  authorize(handle: string): Promise<Result<URL, ExternalServiceError>>;

  /**
   * コールバックURLからセッション情報を取得する
   */
  callback(
    params: URLSearchParams,
  ): Promise<Result<OAuthSession, ExternalServiceError>>;

  /**
   * ユーザープロフィールを取得する
   */
  getUserProfile(did: string): Promise<Result<Profile, ExternalServiceError>>;

  /**
   * OAuthセッションを取得する
   */
  getOAuthSession(
    did: string,
  ): Promise<Result<OAuthSession, ExternalServiceError>>;
}
