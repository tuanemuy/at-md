import type { Post } from "@/domain/post/models";
import type {
  CreatePost,
  PostRepository,
  UpdatePost,
} from "@/domain/post/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import {
  type PgDatabase,
  codeToRepositoryErrorCode,
  isDatabaseError,
} from "../../client";
import { posts } from "../../schema/post";

/**
 * PostRepositoryの実装
 */
export class DrizzlePostRepository implements PostRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * 投稿を作成する
   */
  async create(post: CreatePost): Promise<Result<Post, RepositoryError>> {
    try {
      const [savedPost] = await this.db.insert(posts).values(post).returning();

      if (!savedPost) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.UNKNOWN_ERROR,
            "Failed to create post",
          ),
        );
      }

      return ok(savedPost);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to create post",
          error,
        ),
      );
    }
  }

  /**
   * 投稿を更新する
   */
  async update(post: UpdatePost): Promise<Result<Post, RepositoryError>> {
    try {
      const [updatedPost] = await this.db
        .update(posts)
        .set(post)
        .where(eq(posts.id, post.id))
        .returning();

      if (!updatedPost) {
        return err(
          new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Post not found"),
        );
      }

      return ok(updatedPost);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to update post",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDの投稿を取得する
   */
  async findById(id: string): Promise<Result<Post, RepositoryError>> {
    try {
      const [post] = await this.db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

      if (!post) {
        return err(
          new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Post not found"),
        );
      }

      return ok(post);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find post by ID",
          error,
        ),
      );
    }
  }

  /**
   * 指定したノートIDの投稿を取得する
   */
  async findByNoteId(noteId: string): Promise<Result<Post, RepositoryError>> {
    try {
      const [post] = await this.db
        .select()
        .from(posts)
        .where(eq(posts.noteId, noteId))
        .limit(1);

      if (!post) {
        return err(
          new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Post not found"),
        );
      }

      return ok(post);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find posts by note ID",
          error,
        ),
      );
    }
  }

  /**
   * 指定したユーザーIDの投稿を取得する
   */
  async findByUserId(userId: string): Promise<Result<Post[], RepositoryError>> {
    try {
      const postResults = await this.db
        .select()
        .from(posts)
        .where(eq(posts.userId, userId));

      return ok(postResults);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find posts by user ID",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDの投稿を削除する
   */
  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(posts).where(eq(posts.id, id));
      return ok(undefined);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete post",
          error,
        ),
      );
    }
  }
}
