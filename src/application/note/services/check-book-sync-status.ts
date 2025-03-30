import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type {
  CheckBookSyncStatusInput,
  CheckBookSyncStatusUseCase,
} from "../usecase";

/**
 * ブックの同期状態を確認するユースケース実装
 */
export class CheckBookSyncStatusService implements CheckBookSyncStatusUseCase {
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
  execute(input: CheckBookSyncStatusInput) {
    return this.bookRepository
      .findById(input.bookId)
      .map((book) => book.syncStatus)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "CheckBookSyncStatus",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to check book sync status",
            error,
          ),
      );
  }
}

