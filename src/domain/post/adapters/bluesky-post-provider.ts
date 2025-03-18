/**
 * Bluesky投稿アダプターのインターフェース
 */
import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/domain/types/error";
import type { Engagement } from "../models";
import type { BlueskyPost, DID } from "../dtos/bluesky-post";

/**
 * Bluesky投稿アダプターのインターフェース
 */
export interface BlueskyPostProvider {
  /**
   * 投稿を作成する
   */
  createPost(repo: DID, text: string): Promise<Result<BlueskyPost, ExternalServiceError>>;

  /**
   * エンゲージメントを取得する
   */
  getEngagement(uri: string): Promise<Result<Engagement, ExternalServiceError>>;
} 