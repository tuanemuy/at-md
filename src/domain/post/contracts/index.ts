import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Post, PostPlatform } from "../models/post";
import type { PostError } from "../models/errors";

/**
 * 投稿管理コンテキストの外部向けインターフェース
 */
export interface PostContext {
  /**
   * 文書IDに関連する投稿を取得する
   * @param documentId 文書ID
   * @returns 投稿の配列
   */
  getPostsByDocumentId(documentId: ID): Promise<Result<Post[], PostError>>;

  /**
   * 文書から新しい投稿を作成する
   * @param documentId 文書ID
   * @param platform 投稿プラットフォーム
   * @param userId ユーザーID
   * @returns 作成された投稿
   */
  createPostFromDocument(
    documentId: ID,
    platform: PostPlatform,
    userId: ID
  ): Promise<Result<Post, PostError>>;

  /**
   * 投稿を公開する
   * @param postId 投稿ID
   * @returns 公開された投稿
   */
  publishPost(postId: ID): Promise<Result<Post, PostError>>;
} 