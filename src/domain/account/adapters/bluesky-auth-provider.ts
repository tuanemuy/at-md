import type { ExternalServiceError } from "@/domain/types/error";
import type { ResultAsync } from "@/lib/result";
import type { SessionData } from "@/domain/account/models/session-data";
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
  authorize(handle: string): ResultAsync<URL, ExternalServiceError>;

  /**
   * コールバックURLからセッションを作成する
   */
  callback(params: URLSearchParams): ResultAsync<string, ExternalServiceError>;

  /**
   * ユーザープロフィールを取得する
   */
  getUserProfile(did: string): ResultAsync<Profile, ExternalServiceError>;

  /**
   * セッションを検証する
   */
  validateSession(did: string): ResultAsync<SessionData, ExternalServiceError>;
}
