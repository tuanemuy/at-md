import type { BookRepository } from "@/domain/note/repositories/book-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
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
  execute(input: GetBookInput) {
    return this.bookRepository.findById(input.bookId).mapErr((error) => {
      return new ApplicationServiceError(
        "GetBook",
        ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
        "ブックが見つかりません",
        error,
      );
    });
  }
}
