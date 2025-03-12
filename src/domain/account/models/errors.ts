import { z } from "zod";
import type { AnyError, RepositoryError, RepositoryErrorCode } from "@/domain/shared/models/common";

/**
 * 認証エラーコードのスキーマ
 */
export const authErrorCodeSchema = z.enum([
  "INVALID_CREDENTIALS",
  "UNAUTHORIZED",
  "CONNECTION_FAILED"
]);

/**
 * 認証エラーコードの型
 */
export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;

/**
 * 認証エラーの型
 */
export interface AuthError extends AnyError {
  name: "AuthError";
  type: AuthErrorCode;
  message: string;
  cause?: Error;
}

/**
 * 認証エラーを作成する
 * @param type エラーコード
 * @param message エラーメッセージ
 * @param cause 原因となったエラー（オプション）
 * @returns 認証エラーオブジェクト
 */
export function createAuthError(
  type: AuthErrorCode,
  message: string,
  cause?: Error
): AuthError {
  return {
    name: "AuthError",
    type,
    message,
    cause
  };
}

// 共有カーネルのRepositoryErrorを再エクスポート
export type { RepositoryError, RepositoryErrorCode }; 