import { bookSchema } from "@/domain/note/models/book";
import type {
  CreateBook,
  UpdateBook,
} from "@/domain/note/repositories/book-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { and, asc, count, eq } from "drizzle-orm";
import { ResultAsync, err, ok } from "neverthrow";
import { type PgDatabase, mapRepositoryError } from "../../client";
import { users } from "../../schema/account";
import { bookDetails, books, syncStatuses } from "../../schema/note";

/**
 * BookRepositoryの実装
 */
export class DrizzleBookRepository implements BookRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * ブックを作成する
   */
  create(book: CreateBook) {
    return ResultAsync.fromPromise(
      this.db.transaction(async (tx) => {
        const [savedBook] = await tx.insert(books).values(book).returning();

        if (!savedBook) {
          throw new Error("Failed to save book");
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

        return bookSchema.parse({
          ...savedBook,
          details: savedDetails,
          syncStatus: savedStatus,
        });
      }),
      mapRepositoryError,
    );
  }

  /**
   * ブックを更新する
   */
  update(book: UpdateBook) {
    return ResultAsync.fromPromise(
      this.db.transaction(async (tx) => {
        const [updatedBook] = await tx
          .update(books)
          .set(book)
          .where(eq(books.id, book.id))
          .returning();

        if (!updatedBook) {
          throw new Error("Failed to update book");
        }

        const [updatedDetails] = await tx
          .update(bookDetails)
          .set(
            book.details || {
              updatedAt: new Date(),
            },
          )
          .where(eq(bookDetails.bookId, book.id))
          .returning();

        if (!updatedDetails) {
          throw new Error("Failed to update book details");
        }

        const [updatedStatus] = await tx
          .update(syncStatuses)
          .set(
            book.syncStatus || {
              updatedAt: new Date(),
            },
          )
          .where(eq(syncStatuses.bookId, book.id))
          .returning();

        if (!updatedStatus) {
          throw new Error("Failed to update book sync status");
        }

        return bookSchema.parse({
          ...updatedBook,
          details: updatedDetails,
          syncStatus: updatedStatus,
        });
      }),
      mapRepositoryError,
    );
  }

  /**
   * 指定したIDのブックを取得する
   */
  findById(id: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          book: books,
          details: bookDetails,
          syncStatus: syncStatuses,
        })
        .from(books)
        .innerJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .innerJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(eq(books.id, id))
        .limit(1),
      mapRepositoryError,
    ).andThen(([book]) =>
      book
        ? ok({
            ...book.book,
            details: book.details,
            syncStatus: book.syncStatus,
          })
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Book not found",
            ),
          ),
    );
  }

  /**
   * 指定したユーザーIDのブック一覧を取得する
   */
  findByUserId(userId: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          book: books,
          details: bookDetails,
          syncStatus: syncStatuses,
        })
        .from(books)
        .innerJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .innerJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(eq(books.userId, userId)),
      mapRepositoryError,
    ).map((bookResults) =>
      bookResults.map((row) => ({
        ...row.book,
        details: row.details,
        syncStatus: row.syncStatus,
      })),
    );
  }

  /**
   * 指定したオーナーとリポジトリのブックを取得する
   */
  findByOwnerAndRepo(owner: string, repo: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          book: books,
          details: bookDetails,
          syncStatus: syncStatuses,
        })
        .from(books)
        .innerJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .innerJoin(syncStatuses, eq(books.id, syncStatuses.bookId))
        .where(and(eq(books.owner, owner), eq(books.repo, repo)))
        .limit(1),
      mapRepositoryError,
    ).andThen(([book]) =>
      book
        ? ok({
            ...book.book,
            details: book.details,
            syncStatus: book.syncStatus,
          })
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Book not found",
            ),
          ),
    );
  }

  /**
   * 指定したIDのブックを削除する
   */
  delete(id: string, userId: string) {
    return ResultAsync.fromThrowable(async () => {
      const [deleted] = await this.db
        .delete(books)
        .where(and(eq(books.id, id), eq(books.userId, userId)))
        .returning();
      return deleted;
    }, mapRepositoryError)();
  }

  count() {
    return ResultAsync.fromPromise(
      this.db
        .select({
          count: count(),
        })
        .from(books),
      mapRepositoryError,
    ).map((results) => results.at(0)?.count || 0);
  }

  list(page: number, limit: number) {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(books)
        .innerJoin(users, eq(books.userId, users.id))
        .orderBy(asc(books.id))
        .limit(limit)
        .offset((page - 1) * limit),
      mapRepositoryError,
    ).map((results) =>
      results.map((row) => ({
        ...row.books,
        user: row.users,
      })),
    );
  }
}
