import type { ExternalServiceError } from "@/domain/types/error";
/**
 * Bluesky投稿アダプターのインターフェース
 */
import type { Result } from "neverthrow";
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
  ): Promise<Result<BlueskyPost, ExternalServiceError>>;

  /**
   * エンゲージメントを取得する
   */
  getEngagement(
    did: DID,
    uri: string,
  ): Promise<Result<Engagement, ExternalServiceError>>;
}
