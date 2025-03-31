import type { BookRepository } from "@/domain/note/repositories/book-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
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
  execute(input: DeleteBookInput) {
    return this.bookRepository
      .delete(input.bookId, input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "DeleteBook",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to delete book",
            error,
          ),
      );
  }
}
