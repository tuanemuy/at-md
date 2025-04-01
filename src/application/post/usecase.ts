import type { ApplicationServiceError } from "@/domain/types/error";
import type { ResultAsync } from "@/lib/result";
import type { Engagement, Post, PostStatus } from "@/domain/post/models";

/**
 * ノートを投稿する入力
 */
export interface PostNoteInput {
  userId: string;
  noteId: string;
  did: string;
  text: string;
}

/**
 * ノートを投稿するユースケース
 */
export interface PostNoteUseCase {
  execute(input: PostNoteInput): ResultAsync<Post, ApplicationServiceError>;
}

/**
 * 投稿を再試行する入力
 */
export interface RetryPostInput {
  userId: string;
  noteId: string;
  did: string;
  text: string;
}

/**
 * 投稿を再試行するユースケース
 */
export interface RetryPostUseCase {
  execute(input: RetryPostInput): ResultAsync<Post, ApplicationServiceError>;
}

/**
 * エンゲージメントを取得する入力
 */
export interface GetEngagementInput {
  uri: string;
}

/**
 * エンゲージメントを取得するユースケース
 */
export interface GetEngagementUseCase {
  execute(
    input: GetEngagementInput,
  ): ResultAsync<Engagement, ApplicationServiceError>;
}

/**
 * 投稿ステータスを確認する入力
 */
export interface CheckPostStatusInput {
  noteId: string;
}

/**
 * 投稿ステータスを確認するユースケース
 */
export interface CheckPostStatusUseCase {
  execute(
    input: CheckPostStatusInput,
  ): ResultAsync<PostStatus, ApplicationServiceError>;
}

