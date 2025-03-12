import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { AnyError } from "@/domain/shared/models/common";

/**
 * ユーザー参照の型
 * 他のコンテキストからユーザー情報を参照するための最小限の情報
 */
export interface UserReference {
  id: ID;
  name: string;
  did: string;
}

/**
 * ユーザーサービスのインターフェース
 * 他のコンテキストがユーザー情報にアクセスするためのサービス
 */
export interface UserService {
  /**
   * ユーザー参照情報の取得
   * @param userId ユーザーID
   * @returns ユーザー参照情報
   */
  getUserReference(
    userId: ID,
  ): Promise<Result<UserReference, UserServiceError>>;
}

/**
 * ユーザーサービスエラーコード
 */
export type UserServiceErrorCode = "USER_NOT_FOUND" | "SERVICE_ERROR";

/**
 * ユーザーサービスエラー
 */
export interface UserServiceError extends AnyError {
  name: "UserServiceError";
  type: UserServiceErrorCode;
  message: string;
  cause?: Error;
}

/**
 * ユーザーサービスエラーを作成する
 * @param type エラーコード
 * @param message エラーメッセージ
 * @param cause 原因となったエラー（オプション）
 * @returns ユーザーサービスエラーオブジェクト
 */
export function createUserServiceError(
  type: UserServiceErrorCode,
  message: string,
  cause?: Error,
): UserServiceError {
  return {
    name: "UserServiceError",
    type,
    message,
    cause,
  };
}
