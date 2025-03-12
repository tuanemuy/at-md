import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Post, PostStatus } from "../models/post";
import type { RepositoryError } from "../models/errors";

/**
 * 投稿リポジトリのインターフェース
 */
export interface PostRepository {
  /**
   * IDによる投稿検索
   * @param id 投稿ID
   * @returns 投稿またはnull
   */
  findById(id: ID): Promise<Result<Post | null, RepositoryError>>;

  /**
   * 文書IDによる投稿検索
   * @param documentId 文書ID
   * @returns 投稿またはnull
   */
  findByDocumentId(
    documentId: ID,
  ): Promise<Result<Post | null, RepositoryError>>;

  /**
   * ユーザーIDによる投稿検索
   * @param userId ユーザーID
   * @returns 投稿の配列
   */
  findByUserId(userId: ID): Promise<Result<Post[], RepositoryError>>;

  /**
   * 投稿の保存
   * @param post 投稿オブジェクト
   * @returns 保存された投稿
   */
  save(post: Post): Promise<Result<Post, RepositoryError>>;

  /**
   * 投稿ステータスの更新
   * @param id 投稿ID
   * @param status 新しいステータス
   * @param error エラーメッセージ（オプション）
   * @returns 更新された投稿
   */
  updateStatus(
    id: ID,
    status: PostStatus,
    error?: string,
  ): Promise<Result<Post, RepositoryError>>;

  /**
   * 投稿の削除
   * @param id 投稿ID
   * @returns void
   */
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}
