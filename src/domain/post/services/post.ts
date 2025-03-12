import type { Result } from "neverthrow";
import type { Post, PostStatus } from "../models/post";
import type { PostError } from "../models/errors";
import type { ID } from "@/domain/shared/models/id";

/**
 * 投稿サービスのインターフェース
 */
export interface PostService {
  /**
   * 投稿を作成する
   * @param documentId 文書ID
   * @returns 作成された投稿
   */
  createPost(documentId: ID): Promise<Result<Post, PostError>>;

  /**
   * 投稿のステータスを取得する
   * @param postId 投稿ID
   * @returns 投稿ステータス
   */
  getPostStatus(postId: ID): Promise<Result<PostStatus, PostError>>;
} 