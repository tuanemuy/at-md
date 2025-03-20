import { and, eq } from "drizzle-orm";
import { type Result, err, ok } from "@/lib/result";
import type { Post } from "@/domain/post/models";
import { postSchema } from "@/domain/post/models/post";
import type {
  PostRepository,
  CreatePost,
  UpdatePost,
} from "@/domain/post/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import {
  type PgDatabase,
  isDatabaseError,
  codeToRepositoryErrorCode,
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
        throw new Error("Failed to create post");
      }

      const parsed = postSchema.safeParse({
        id: savedPost.id,
        userId: savedPost.userId,
        noteId: savedPost.noteId,
        postUri: savedPost.postUri || undefined,
        postCid: savedPost.postCid || undefined,
        status: savedPost.status,
        errorMessage: savedPost.errorMessage || undefined,
        createdAt: savedPost.createdAt,
        updatedAt: savedPost.updatedAt,
      });
      if (!parsed.success) {
        throw new Error("Failed to parse post data");
      }

      return ok(parsed.data);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
          new RepositoryError(RepositoryErrorCode.DATA_ERROR, "Post not found"),
        );
      }

      const parsed = postSchema.safeParse({
        id: updatedPost.id,
        userId: updatedPost.userId,
        noteId: updatedPost.noteId,
        postUri: updatedPost.postUri || undefined,
        postCid: updatedPost.postCid || undefined,
        status: updatedPost.status,
        errorMessage: updatedPost.errorMessage || undefined,
        createdAt: updatedPost.createdAt,
        updatedAt: updatedPost.updatedAt,
      });
      if (!parsed.success) {
        throw new Error("Failed to parse post data");
      }

      return ok(parsed.data);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
  async findById(id: string): Promise<Result<Post | null, RepositoryError>> {
    try {
      const [post] = await this.db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

      if (!post) return ok(null);

      const parsed = postSchema.safeParse({
        id: post.id,
        userId: post.userId,
        noteId: post.noteId,
        postUri: post.postUri || undefined,
        postCid: post.postCid || undefined,
        status: post.status,
        errorMessage: post.errorMessage || undefined,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      });
      if (!parsed.success) {
        throw new Error("Failed to parse post data");
      }

      return ok(parsed.data);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
  async findByNoteId(
    noteId: string,
  ): Promise<Result<Post | null, RepositoryError>> {
    try {
      const [post] = await this.db
        .select()
        .from(posts)
        .where(eq(posts.noteId, noteId))
        .limit(1);

      if (!post) return ok(null);

      const parsed = postSchema.safeParse({
        id: post.id,
        userId: post.userId,
        noteId: post.noteId,
        postUri: post.postUri || undefined,
        postCid: post.postCid || undefined,
        status: post.status,
        errorMessage: post.errorMessage || undefined,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      });
      if (!parsed.success) {
        throw new Error("Failed to parse post data");
      }

      return ok(parsed.data);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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

      const parsedPosts = postResults.map((post) => {
        const parsed = postSchema.safeParse({
          id: post.id,
          userId: post.userId,
          noteId: post.noteId,
          postUri: post.postUri || undefined,
          postCid: post.postCid || undefined,
          status: post.status,
          errorMessage: post.errorMessage || undefined,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        });
        if (!parsed.success) {
          throw new Error("Failed to parse post data");
        }
        return parsed.data;
      });

      return ok(parsedPosts);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
