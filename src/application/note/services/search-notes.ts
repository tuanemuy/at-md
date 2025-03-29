import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { Note } from "@/domain/note/models";
import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { SearchNotesInput, SearchNotesUseCase } from "../usecase";
import { DBOrder } from "@/domain/types/pagination";

/**
 * ノートを検索するユースケース実装
 */
export class SearchNotesService implements SearchNotesUseCase {
  private readonly noteRepository: NoteRepository;
  private readonly bookRepository: BookRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      noteRepository: NoteRepository;
      bookRepository: BookRepository;
    };
  }) {
    this.noteRepository = params.deps.noteRepository;
    this.bookRepository = params.deps.bookRepository;
  }

  /**
   * ユースケースを実行する
   */
  async execute(input: SearchNotesInput): Promise<Result<Note[], NoteError>> {
    logger.info("Searching notes", { 
      bookId: input.bookId,
      query: input.query,
      page: input.pagination.page,
      limit: input.pagination.limit,
    });

    // 指定されたブックが存在するか確認
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

    // ノートを検索
    const searchResult = await this.noteRepository.search(
      input.bookId,
      input.query,
      {
        ...input.pagination,
        order: DBOrder.DESC,
        orderBy: "updatedAt",
      },
    );

    return searchResult
      .map((result) => {
        logger.info("Successfully searched notes", {
          bookId: input.bookId,
          query: input.query,
          count: result.items.length,
          total: result.count,
        });
        return result.items;
      })
      .mapErr((error) => {
        logger.error("Failed to search notes", {
          bookId: input.bookId,
          query: input.query,
          error,
        });
        return new NoteError(
          NoteErrorCode.NOTE_NOT_FOUND,
          "ノートの検索に失敗しました",
          error,
        );
      });
  }
} 