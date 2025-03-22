/**
 * Bluesky認証アダプターのインターフェース
 */
import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/domain/types/error";
import type { Profile, Session } from "../models";
import type { RequestContext } from "@/lib/cookie";

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
  authorize(
    handle: string,
    context: RequestContext,
  ): Promise<Result<URL, ExternalServiceError>>;

  /**
   * コールバックURLからセッション情報を取得する
   */
  callback(
    params: URLSearchParams,
    context: RequestContext,
  ): Promise<Result<Session, ExternalServiceError>>;

  /**
   * ユーザープロフィールを取得する
   */
  getUserProfile(
    did: string,
    context: RequestContext,
  ): Promise<Result<Profile, ExternalServiceError>>;
}
