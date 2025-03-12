import { z } from "zod";
import type {
  AnyError,
  RepositoryError,
  RepositoryErrorCode,
} from "@/domain/shared/models/common";

/**
 * 投稿エラーコードのスキーマ
 */
export const postErrorCodeSchema = z.enum([
  "CONTENT_NOT_FOUND",
  "API_ERROR",
  "RATE_LIMIT",
]);

/**
 * 投稿エラーコードの型
 */
export type PostErrorCode = z.infer<typeof postErrorCodeSchema>;

/**
 * 投稿エラーの型
 */
export interface PostError extends AnyError {
  name: "PostError";
  type: PostErrorCode;
  message: string;
  cause?: Error;
}

/**
 * 投稿エラーを作成する
 * @param type エラーコード
 * @param message エラーメッセージ
 * @param cause 原因となったエラー（オプション）
 * @returns 投稿エラーオブジェクト
 */
export function createPostError(
  type: PostErrorCode,
  message: string,
  cause?: Error,
): PostError {
  return {
    name: "PostError",
    type,
    message,
    cause,
  };
}

// 共有カーネルのRepositoryErrorを再エクスポート
export type { RepositoryError, RepositoryErrorCode };
