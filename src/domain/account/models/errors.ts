/**
 * アカウント管理コンテキストのエラー定義
 */
import { AnyError, ErrorType } from "@/domain/types/error";

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
  
  // GitHub連携関連
  GITHUB_CONNECTION_FAILED: "github_connection_failed",
  GITHUB_DISCONNECTION_FAILED: "github_disconnection_failed",
  GITHUB_INSTALLATION_NOT_FOUND: "github_installation_not_found",
  
  // ユーザー関連
  USER_NOT_FOUND: "user_not_found",
  USER_ALREADY_EXISTS: "user_already_exists",
  PROFILE_UPDATE_FAILED: "profile_update_failed"
} as const;

export type AccountErrorCode = (typeof AccountErrorCode)[keyof typeof AccountErrorCode];

/**
 * アカウント管理コンテキスト固有のエラー
 */
export class AccountError extends AnyError {
  constructor(
    public code: AccountErrorCode,
    public message: string,
    public cause?: Error | unknown
  ) {
    const errorType = getErrorTypeForCode(code);
    super("AccountError", errorType, code, message, cause);
  }
}

/**
 * エラーコードからエラータイプを決定するヘルパー関数
 */
function getErrorTypeForCode(code: AccountErrorCode): ErrorType {
  switch (code) {
    case AccountErrorCode.INVALID_HANDLE:
    case AccountErrorCode.AUTHORIZATION_FAILED:
    case AccountErrorCode.CALLBACK_FAILED:
    case AccountErrorCode.SESSION_VALIDATION_FAILED:
    case AccountErrorCode.SESSION_REFRESH_FAILED:
      return ErrorType.UNAUTHORIZED;
    
    case AccountErrorCode.USER_NOT_FOUND:
    case AccountErrorCode.GITHUB_INSTALLATION_NOT_FOUND:
      return ErrorType.NOT_FOUND;
    
    case AccountErrorCode.USER_ALREADY_EXISTS:
      return ErrorType.CONFLICT;
    
    case AccountErrorCode.SESSION_CREATION_FAILED:
    case AccountErrorCode.SESSION_REVOCATION_FAILED:
    case AccountErrorCode.GITHUB_CONNECTION_FAILED:
    case AccountErrorCode.GITHUB_DISCONNECTION_FAILED:
    case AccountErrorCode.PROFILE_UPDATE_FAILED:
      return ErrorType.INTERNAL;
    
    default:
      return ErrorType.INTERNAL;
  }
} 