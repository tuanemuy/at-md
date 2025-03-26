/**
 * アカウント管理コンテキストのエラー定義
 */
import { AnyError } from "@/domain/types/error";

/**
 * アカウント管理関連のエラーコード
 */
export const AccountErrorCode = {
  // 認証関連
  INVALID_HANDLE: "invalid_handle",
  AUTHORIZATION_FAILED: "authorization_failed",
  CALLBACK_FAILED: "callback_failed",

  // セッション関連
  SESSION_CREATION_FAILED: "session_creation_failed",
  SESSION_VALIDATION_FAILED: "session_validation_failed",
  SESSION_REFRESH_FAILED: "session_refresh_failed",
  SESSION_REVOCATION_FAILED: "session_revocation_failed",
  SESSION_NOT_FOUND: "session_not_found",

  // GitHub連携関連
  GITHUB_CONNECTION_FAILED: "github_connection_failed",
  GITHUB_DISCONNECTION_FAILED: "github_disconnection_failed",
  GITHUB_INSTALLATION_NOT_FOUND: "github_installation_not_found",

  // ユーザー関連
  USER_NOT_FOUND: "user_not_found",
  USER_ALREADY_EXISTS: "user_already_exists",
  USER_VALIDATION_FAILED: "user_validation_failed",
  UPDATE_FAILED: "update_failed",
} as const;

export type AccountErrorCode =
  (typeof AccountErrorCode)[keyof typeof AccountErrorCode];

/**
 * アカウント管理コンテキスト固有のエラー
 */
export class AccountError extends AnyError {
  constructor(
    public code: AccountErrorCode,
    public message: string,
    public cause?: Error | unknown,
  ) {
    super(code, message, cause);
  }
}
