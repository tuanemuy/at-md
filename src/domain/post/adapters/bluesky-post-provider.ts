import type { ExternalServiceError } from "@/domain/types/error";
/**
 * Bluesky投稿アダプターのインターフェース
 */
import type { ResultAsync } from "neverthrow";
import type { BlueskyPost, DID } from "../dtos/bluesky-post";
import type { Engagement } from "../models";

/**
 * Bluesky投稿アダプターのインターフェース
 */
export interface BlueskyPostProvider {
  /**
   * 投稿を作成する
   */
  createPost(
    did: DID,
    text: string,
  ): ResultAsync<BlueskyPost, ExternalServiceError>;

  /**
   * エンゲージメントを取得する
   */
  getEngagement(uri: string): ResultAsync<Engagement, ExternalServiceError>;
}
