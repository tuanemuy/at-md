/**
 * Bluesky認証アダプターのインターフェース
 */
import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/domain/types/error";
import type { Profile, Session } from "../models";

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
  authorize(handle: string, options: AuthorizeOptions): Promise<Result<URL, ExternalServiceError>>;

  /**
   * コールバックURLからセッション情報を取得する
   */
  callback(params: URLSearchParams): Promise<Result<Session, ExternalServiceError>>;

  /**
   * ユーザープロフィールを取得する
   */
  getUserProfile(did: string): Promise<Result<Profile, ExternalServiceError>>;
} 