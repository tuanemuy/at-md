import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { SyncStatus } from "@/domain/note/models/sync-status";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { CheckBookSyncStatusInput, CheckBookSyncStatusUseCase } from "../usecase";

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
  async execute(
    input: CheckBookSyncStatusInput,
  ): Promise<Result<SyncStatus, NoteError>> {
    logger.info("Checking book sync status", { bookId: input.bookId });

    // ブック情報を取得
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
    
    // 同期ステータスを返す
    logger.info("Successfully got book sync status", {
      bookId: input.bookId,
      status: book.syncStatus.status,
      lastSyncedAt: book.syncStatus.lastSyncedAt,
    });
    
    return ok(book.syncStatus);
  }
} 