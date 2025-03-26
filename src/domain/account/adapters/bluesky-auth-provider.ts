import type { ExternalServiceError } from "@/domain/types/error";
import type { Result } from "@/lib/result";
/**
 * Bluesky認証アダプターのインターフェース
 */
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
   * コールバックURLからセッションを作成する
   */
  callback(
    params: URLSearchParams,
  ): Promise<Result<string, ExternalServiceError>>;

  /**
   * ユーザープロフィールを取得する
   */
  getUserProfile(did: string): Promise<Result<Profile, ExternalServiceError>>;

  /**
   * セッションを検証する
   */
  validateSession(did: string): Promise<Result<void, ExternalServiceError>>;
}
