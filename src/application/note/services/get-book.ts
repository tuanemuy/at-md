import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { Book } from "@/domain/note/models";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { GetBookInput, GetBookUseCase } from "../usecase";

/**
 * ブック情報を取得するユースケース実装
 */
export class GetBookService implements GetBookUseCase {
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
  async execute(input: GetBookInput): Promise<Result<Book, NoteError>> {
    logger.info("Getting book", { bookId: input.bookId });

    // ブック情報を取得
    return (await this.bookRepository.findById(input.bookId))
      .map((book) => {
        logger.info("Successfully got book", {
          bookId: input.bookId,
          userId: book.userId,
        });
        return book;
      })
      .mapErr((error) => {
        logger.error("Failed to get book", {
          bookId: input.bookId,
          error,
        });
        return new NoteError(
          NoteErrorCode.BOOK_NOT_FOUND,
          "ブックが見つかりません",
          error,
        );
      });
  }
} 