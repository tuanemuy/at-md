import { and, eq } from "drizzle-orm";
import { type Result, err, ok } from "@/lib/result";
import type { Book } from "@/domain/note/models";
import { bookSchema } from "@/domain/note/models/book";
import type {
  CreateBook,
  UpdateBook,
} from "@/domain/note/repositories/book-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import {
  type PgDatabase,
  isDatabaseError,
  codeToRepositoryErrorCode,
} from "../../client";
import { books, bookDetails, syncStatuses } from "../../schema/note";

/**
 * BookRepositoryの実装
 */
export class DrizzleBookRepository implements BookRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * ブックを作成する
   */
  async create(book: CreateBook): Promise<Result<Book, RepositoryError>> {
    try {
      // トランザクションで全てのデータを保存
      const result = await this.db.transaction(async (tx) => {
        // ブックの保存
        const [savedBook] = await tx.insert(books).values(book).returning();

        if (!savedBook) {
          throw new Error("Failed to parse book data");
        }

        // ブック詳細の保存
        const [savedDetails] = await tx
          .insert(bookDetails)
          .values({
            bookId: savedBook.id,
            ...book.details,
          })
          .returning();

        if (!savedDetails) {
          throw new Error("Failed to parse book data");
        }

        // 同期ステータスの保存
        const [savedStatus] = await tx
          .insert(syncStatuses)
          .values({
            bookId: savedBook.id,
            ...book.syncStatus,
          })
          .returning();

        if (!savedStatus) {
          throw new Error("Failed to parse book data");
        }

        // ドメインモデルに変換
        const parsed = bookSchema.safeParse({
          ...savedBook,
          details: {
            name: savedDetails.name,
            description: savedDetails.description,
          },
          syncStatus: {
            lastSyncedAt: savedStatus.lastSyncedAt,
            status: savedStatus.status,
          },
        });

        if (!parsed.success) {
          throw new Error("Failed to parse book data");
        }

        return parsed.data;
      });

      return ok(result);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse book data",
          error,
        ),
      );
    }
  }

  /**
   * ブックを更新する
   */
  async update(book: UpdateBook): Promise<Result<Book, RepositoryError>> {
    try {
      // トランザクションで全てのデータを更新
      const result = await this.db.transaction(async (tx) => {
        // ブックの更新
        const [updatedBook] = await tx
          .update(books)
          .set(book)
          .where(eq(books.id, book.id))
          .returning();

        if (!updatedBook) {
          throw new Error("Failed to parse book data");
        }

        // ブック詳細の更新
        const [updatedDetails] = await tx
          .update(bookDetails)
          .set(book.details)
          .where(eq(bookDetails.bookId, book.id))
          .returning();

        if (!updatedDetails) {
          throw new Error("Failed to parse book data");
        }

        // 同期ステータスの更新
        const [updatedStatus] = await tx
          .update(syncStatuses)
          .set(book.syncStatus)
          .where(eq(syncStatuses.bookId, book.id))
          .returning();

        if (!updatedStatus) {
          throw new Error("Failed to parse book data");
        }

        // ドメインモデルに変換
        const parsed = bookSchema.safeParse({
          ...updatedBook,
          details: {
            name: updatedDetails.name,
            description: updatedDetails.description,
          },
          syncStatus: {
            lastSyncedAt: updatedStatus.lastSyncedAt,
            status: updatedStatus.status,
          },
        });

        if (!parsed.success) {
          throw new Error("Failed to parse book data");
        }

        return parsed.data;
      });

      return ok(result);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to update book",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのブックを取得する
   */
  async findById(id: string): Promise<Result<Book | null, RepositoryError>> {
    try {
      const [book] = await this.db
        .select({
          book: books,
          details: bookDetails,
          syncStatus: syncStatuses,
        })
        .from(books)
        .leftJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .leftJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(eq(books.id, id))
        .limit(1);

      if (!book || !book.details || !book.syncStatus) return ok(null);

      // ドメインモデルに変換
      const parsed = bookSchema.safeParse({
        ...book.book,
        details: {
          name: book.details.name,
          description: book.details.description,
        },
        syncStatus: {
          lastSyncedAt: book.syncStatus.lastSyncedAt,
          status: book.syncStatus.status,
        },
      });

      if (!parsed.success) {
        throw new Error("Failed to parse book data");
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
          "Failed to find book",
          error,
        ),
      );
    }
  }

  /**
   * 指定したユーザーIDのブック一覧を取得する
   */
  async findByUserId(userId: string): Promise<Result<Book[], RepositoryError>> {
    try {
      const bookResults = await this.db
        .select({
          book: books,
          details: bookDetails,
          syncStatus: syncStatuses,
        })
        .from(books)
        .leftJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .leftJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(eq(books.userId, userId));

      // 有効なデータのみフィルタしてドメインモデルに変換
      const parsedBooks = bookResults
        .filter(
          (
            row,
          ): row is typeof row & {
            details: NonNullable<typeof row.details>;
            syncStatus: NonNullable<typeof row.syncStatus>;
          } => row.details !== null && row.syncStatus !== null,
        )
        .map((row) => {
          const parsed = bookSchema.safeParse({
            ...row.book,
            details: {
              name: row.details.name,
              description: row.details.description,
            },
            syncStatus: {
              lastSyncedAt: row.syncStatus.lastSyncedAt,
              status: row.syncStatus.status,
            },
          });

          if (!parsed.success) {
            throw new Error("Failed to parse book data");
          }

          return parsed.data;
        });

      return ok(parsedBooks);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find books",
          error,
        ),
      );
    }
  }

  /**
   * 指定したオーナーとリポジトリのブックを取得する
   */
  async findByOwnerAndRepo(
    owner: string,
    repo: string,
  ): Promise<Result<Book | null, RepositoryError>> {
    try {
      const [book] = await this.db
        .select({
          book: books,
          details: bookDetails,
          syncStatus: syncStatuses,
        })
        .from(books)
        .leftJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .leftJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(and(eq(books.owner, owner), eq(books.repo, repo)))
        .limit(1);

      if (!book || !book.details || !book.syncStatus) return ok(null);

      // ドメインモデルに変換
      const parsed = bookSchema.safeParse({
        ...book.book,
        details: {
          name: book.details.name,
          description: book.details.description,
        },
        syncStatus: {
          lastSyncedAt: book.syncStatus.lastSyncedAt,
          status: book.syncStatus.status,
        },
      });

      if (!parsed.success) {
        throw new Error("Failed to parse book data");
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
          "Failed to find book",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのブックを削除する
   */
  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.transaction(async (tx) => {
        // 関連データを削除（外部キー制約でカスケード削除されるが、明示的に削除）
        await tx.delete(syncStatuses).where(eq(syncStatuses.bookId, id));
        await tx.delete(bookDetails).where(eq(bookDetails.bookId, id));
        await tx.delete(books).where(eq(books.id, id));
      });

      return ok(undefined);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete book",
          error,
        ),
      );
    }
  }
}
