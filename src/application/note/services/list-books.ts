import type { BookRepository } from "@/domain/note/repositories/book-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
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
  execute(input: ListBooksInput) {
    return this.bookRepository
      .findByUserId(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListBooks",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list books",
            error,
          ),
      );
  }
}
