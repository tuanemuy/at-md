/**
 * 投稿管理コンテキストのエラー定義
 */
import { AnyError } from "@/lib/error";

/**
 * 投稿管理関連のエラーコード
 */
export const PostErrorCode = {
  // 投稿関連
  POST_FAILED: "post_failed",
  POST_NOT_FOUND: "post_not_found",
  INVALID_POST_CONTENT: "invalid_post_content",

  // エンゲージメント関連
  ENGAGEMENT_FETCH_FAILED: "engagement_fetch_failed",
  INVALID_ENGAGEMENT_DATA: "invalid_engagement_data",

  // 認証関連
  UNAUTHORIZED: "unauthorized",
  AUTHENTICATION_FAILED: "authentication_failed",
} as const;

export type PostErrorCode = (typeof PostErrorCode)[keyof typeof PostErrorCode];

/**
 * 投稿管理コンテキスト固有のエラー
 */
export class PostError extends AnyError {
  public readonly name = "PostError";
  public readonly cause?: Error;

  constructor(
    public code: PostErrorCode,
    public message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}
