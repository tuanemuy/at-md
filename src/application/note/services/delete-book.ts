import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { DeleteBookInput, DeleteBookUseCase } from "../usecase";

/**
 * ブックを削除するユースケース実装
 */
export class DeleteBookService implements DeleteBookUseCase {
  private readonly bookRepository: BookRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      bookRepository: BookRepository;
    };
  }) {
    this.bookRepository = params.deps.bookRepository;
  }

  /**
   * ユースケースを実行する
   */
  async execute(input: DeleteBookInput): Promise<Result<void, NoteError>> {
    logger.info("Deleting book", { 
      userId: input.userId,
      bookId: input.bookId 
    });

    // ブック情報を取得して所有者確認
    const bookResult = await this.bookRepository.findById(input.bookId);
    if (bookResult.isErr()) {
      logger.error("Failed to find book", {
        bookId: input.bookId,
        error: bookResult.error,
      });
      return err(
        new NoteError(
          NoteErrorCode.BOOK_NOT_FOUND,
          "ブックが見つかりません",
          bookResult.error,
        ),
      );
    }

    const book = bookResult.value;
    
    // 所有者確認
    if (book.userId !== input.userId) {
      logger.error("User is not the owner of the book", {
        bookId: input.bookId,
        userId: input.userId,
        bookUserId: book.userId,
      });
      return err(
        new NoteError(
          NoteErrorCode.INVALID_REPOSITORY,
          "このブックを削除する権限がありません",
        ),
      );
    }

    // ブックを削除
    return (await this.bookRepository.delete(input.bookId))
      .map(() => {
        logger.info("Successfully deleted book", {
          bookId: input.bookId,
          userId: input.userId,
        });
        return undefined;
      })
      .mapErr((error) => {
        logger.error("Failed to delete book", {
          bookId: input.bookId,
          userId: input.userId,
          error,
        });
        return new NoteError(
          NoteErrorCode.INVALID_REPOSITORY,
          "ブックの削除に失敗しました",
          error,
        );
      });
  }
} 