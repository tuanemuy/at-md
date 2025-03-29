import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { Book } from "@/domain/note/models";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { ListBooksInput, ListBooksUseCase } from "../usecase";

/**
 * ブック一覧を取得するユースケース実装
 */
export class ListBooksService implements ListBooksUseCase {
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
  async execute(input: ListBooksInput): Promise<Result<Book[], NoteError>> {
    logger.info("Listing books", { userId: input.userId });

    // ユーザーのブック一覧を取得
    return (await this.bookRepository.findByUserId(input.userId))
      .map((books) => {
        logger.info("Successfully listed books", {
          userId: input.userId,
          count: books.length,
        });
        return books;
      })
      .mapErr((error) => {
        logger.error("Failed to list books", {
          userId: input.userId,
          error,
        });
        return new NoteError(
          NoteErrorCode.BOOK_NOT_FOUND,
          "ブック一覧の取得に失敗しました",
          error,
        );
      });
  }
} 