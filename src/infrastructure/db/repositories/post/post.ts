import { eq } from "drizzle-orm";
import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Post, PostStatus } from "@/domain/post/models/post";
import type { PostRepository } from "@/domain/post/repositories/post";
import type { RepositoryError } from "@/domain/post/models/errors";
import { createRepositoryError } from "@/domain/shared/models/common";
import type { PgDatabase } from "../../client";
import { posts } from "../../schema";
import type { PostsTable } from "../../schema/types";

/**
 * 投稿リポジトリの実装
 */
export class DrizzlePostRepository implements PostRepository {
  /**
   * @param db データベースクライアント
   */
  constructor(private readonly db: PgDatabase) {}

  /**
   * IDによる投稿検索
   * @param id 投稿ID
   * @returns 投稿またはnull
   */
  async findById(id: ID): Promise<Result<Post | null, RepositoryError>> {
    try {
      // 投稿情報を取得
      const postData = await this.db.query.posts.findFirst({
        where: eq(posts.id, id),
      });

      if (!postData) {
        return ok(null);
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToPost(postData));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find post by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 文書IDによる投稿検索
   * @param documentId 文書ID
   * @returns 投稿またはnull
   */
  async findByDocumentId(
    documentId: ID,
  ): Promise<Result<Post | null, RepositoryError>> {
    try {
      // 投稿情報を取得
      const postData = await this.db.query.posts.findFirst({
        where: eq(posts.documentId, documentId),
      });

      if (!postData) {
        return ok(null);
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToPost(postData));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find post by document ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * ユーザーIDによる投稿検索
   * @param userId ユーザーID
   * @returns 投稿の配列
   */
  async findByUserId(userId: ID): Promise<Result<Post[], RepositoryError>> {
    try {
      // 投稿情報を取得
      const postsData = await this.db.query.posts.findMany({
        where: eq(posts.userId, userId),
      });

      // ドメインモデルに変換して返す
      return ok(postsData.map((post) => this.mapToPost(post)));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find posts by user ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 投稿の保存
   * @param post 投稿オブジェクト
   * @returns 保存された投稿
   */
  async save(post: Post): Promise<Result<Post, RepositoryError>> {
    try {
      // 投稿が存在するか確認
      const existingPost = await this.db.query.posts.findFirst({
        where: eq(posts.id, post.id),
      });

      let result: PostsTable;

      if (existingPost) {
        // 既存投稿の更新
        [result] = await this.db
          .update(posts)
          .set({
            platform: post.platform,
            uri: post.uri,
            status: post.status,
            error: post.error,
            publishedAt: post.publishedAt,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, post.id))
          .returning();
      } else {
        // 新規投稿の作成
        [result] = await this.db
          .insert(posts)
          .values({
            id: post.id,
            documentId: post.documentId,
            userId: post.userId,
            platform: post.platform,
            uri: post.uri,
            status: post.status,
            error: post.error,
            publishedAt: post.publishedAt,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          })
          .returning();
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToPost(result));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to save post: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 投稿ステータスの更新
   * @param id 投稿ID
   * @param status 新しいステータス
   * @param error エラーメッセージ（オプション）
   * @returns 更新された投稿
   */
  async updateStatus(
    id: ID,
    status: PostStatus,
    error?: string,
  ): Promise<Result<Post, RepositoryError>> {
    try {
      // 投稿が存在するか確認
      const existingPost = await this.db.query.posts.findFirst({
        where: eq(posts.id, id),
      });

      if (!existingPost) {
        return err(
          createRepositoryError(
            "NOT_FOUND",
            `Post with ID ${id} not found`,
            undefined,
          ),
        );
      }

      // 更新データの準備
      const updateData: Partial<PostsTable> = {
        status,
        updatedAt: new Date(),
      };

      // エラーメッセージがある場合は追加
      if (error !== undefined) {
        updateData.error = error;
      }

      // publishedステータスの場合は公開日時を設定
      if (status === "published") {
        updateData.publishedAt = new Date();
      }

      // 投稿を更新
      const [result] = await this.db
        .update(posts)
        .set(updateData)
        .where(eq(posts.id, id))
        .returning();

      // ドメインモデルに変換して返す
      return ok(this.mapToPost(result));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to update post status: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 投稿の削除
   * @param id 投稿ID
   * @returns void
   */
  async delete(id: ID): Promise<Result<void, RepositoryError>> {
    try {
      // 投稿を削除
      await this.db.delete(posts).where(eq(posts.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to delete post: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * データベースの投稿データをドメインモデルに変換
   * @param data データベースの投稿データ
   * @returns 投稿ドメインモデル
   */
  private mapToPost(data: PostsTable): Post {
    return {
      id: data.id,
      documentId: data.documentId,
      userId: data.userId,
      platform: data.platform,
      uri: data.uri,
      status: data.status,
      publishedAt: data.publishedAt,
      error: data.error ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
