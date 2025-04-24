import type {
  CreatePost,
  PostRepository,
  UpdatePost,
} from "@/domain/post/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { ResultAsync, err, ok } from "@/lib/result";
import { and, eq } from "drizzle-orm";
import { type Database, mapRepositoryError } from "../../client";
import { posts } from "../../schema/post";

/**
 * PostRepositoryの実装
 */
export class DrizzlePostRepository implements PostRepository {
  constructor(private readonly db: Database) {}

  /**
   * 投稿を作成する
   */
  create(post: CreatePost) {
    return ResultAsync.fromPromise(
      this.db.insert(posts).values(post).returning(),
      mapRepositoryError,
    ).andThen(([savedPost]) =>
      savedPost
        ? ok(savedPost)
        : err(
            new RepositoryError(
              RepositoryErrorCode.UNKNOWN_ERROR,
              "Failed to create post",
            ),
          ),
    );
  }

  /**
   * 投稿を更新する
   */
  update(post: UpdatePost) {
    return ResultAsync.fromPromise(
      this.db.update(posts).set(post).where(eq(posts.id, post.id)).returning(),
      mapRepositoryError,
    ).andThen(([updatedPost]) =>
      updatedPost
        ? ok(updatedPost)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Post not found",
            ),
          ),
    );
  }

  /**
   * 指定したIDの投稿を取得する
   */
  findById(id: string) {
    return ResultAsync.fromPromise(
      this.db.select().from(posts).where(eq(posts.id, id)).limit(1),
      mapRepositoryError,
    ).andThen(([post]) =>
      post
        ? ok(post)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Post not found",
            ),
          ),
    );
  }

  /**
   * 指定したノートIDの投稿を取得する
   */
  findByNotePath(bookId: string, notePath: string) {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(posts)
        .where(and(eq(posts.bookId, bookId), eq(posts.notePath, notePath)))
        .limit(1),
      mapRepositoryError,
    ).andThen(([post]) =>
      post
        ? ok(post)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Post not found",
            ),
          ),
    );
  }

  /**
   * 指定したユーザーIDの投稿を取得する
   */
  findByUserId(userId: string) {
    return ResultAsync.fromPromise(
      this.db.select().from(posts).where(eq(posts.userId, userId)),
      mapRepositoryError,
    );
  }

  /**
   * 指定したIDの投稿を削除する
   */
  delete(id: string) {
    return ResultAsync.fromPromise(
      this.db.delete(posts).where(eq(posts.id, id)),
      mapRepositoryError,
    ).map(() => {});
  }
}
