import type { Book } from "@/domain/note/models";
import type {
  CreateBook,
  UpdateBook,
} from "@/domain/note/repositories/book-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
import { and, eq } from "drizzle-orm";
import {
  type PgDatabase,
  codeToRepositoryErrorCode,
  isDatabaseError,
} from "../../client";
import { bookDetails, books, syncStatuses } from "../../schema/note";

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
      const result = await this.db.transaction(async (tx) => {
        const [savedBook] = await tx.insert(books).values(book).returning();

        if (!savedBook) {
          throw new Error("Failed to save book data");
        }

        const [savedDetails] = await tx
          .insert(bookDetails)
          .values({
            bookId: savedBook.id,
            ...book.details,
          })
          .returning();

        if (!savedDetails) {
          throw new Error("Failed to save book details");
        }

        const [savedStatus] = await tx
          .insert(syncStatuses)
          .values({
            bookId: savedBook.id,
            ...book.syncStatus,
          })
          .returning();

        if (!savedStatus) {
          throw new Error("Failed to save book sync status");
        }

        return {
          ...savedBook,
          details: {
            name: savedDetails.name,
            description: savedDetails.description,
          },
          syncStatus: {
            lastSyncedAt: savedStatus.lastSyncedAt,
            status: savedStatus.status,
          },
        };
      });

      return ok(result);
    } catch (error) {
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
      const result = await this.db.transaction(async (tx) => {
        const [updatedBook] = await tx
          .update(books)
          .set(book)
          .where(eq(books.id, book.id))
          .returning();

        if (!updatedBook) {
          throw new Error("Failed to parse book data");
        }

        const [updatedDetails] = await tx
          .update(bookDetails)
          .set(book.details)
          .where(eq(bookDetails.bookId, book.id))
          .returning();

        if (!updatedDetails) {
          throw new Error("Failed to parse book data");
        }

        const [updatedStatus] = await tx
          .update(syncStatuses)
          .set(book.syncStatus)
          .where(eq(syncStatuses.bookId, book.id))
          .returning();

        if (!updatedStatus) {
          throw new Error("Failed to parse book data");
        }

        return {
          ...updatedBook,
          details: {
            name: updatedDetails.name,
            description: updatedDetails.description,
          },
          syncStatus: {
            lastSyncedAt: updatedStatus.lastSyncedAt,
            status: updatedStatus.status,
          },
        };
      });

      return ok(result);
    } catch (error) {
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
  async findById(id: string): Promise<Result<Book, RepositoryError>> {
    try {
      const [book] = await this.db
        .select({
          book: books,
          details: bookDetails,
          syncStatus: syncStatuses,
        })
        .from(books)
        .innerJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .innerJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(eq(books.id, id))
        .limit(1);

      if (!book) {
        return err(
          new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Book not found"),
        );
      }

      return ok({
        ...book.book,
        details: book.details,
        syncStatus: book.syncStatus,
      });
    } catch (error) {
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
        .innerJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .innerJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(eq(books.userId, userId));

      const parsedBooks = bookResults.map((row) => {
        return {
          ...row.book,
          details: {
            name: row.details.name,
            description: row.details.description,
          },
          syncStatus: {
            lastSyncedAt: row.syncStatus.lastSyncedAt,
            status: row.syncStatus.status,
          },
        };
      });

      return ok(parsedBooks);
    } catch (error) {
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
  ): Promise<Result<Book, RepositoryError>> {
    try {
      const [book] = await this.db
        .select({
          book: books,
          details: bookDetails,
          syncStatus: syncStatuses,
        })
        .from(books)
        .innerJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .innerJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(and(eq(books.owner, owner), eq(books.repo, repo)))
        .limit(1);

      if (!book) {
        return err(
          new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Book not found"),
        );
      }

      return ok({
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
    } catch (error) {
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
      await this.db.delete(books).where(eq(books.id, id));
      return ok(undefined);
    } catch (error) {
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
