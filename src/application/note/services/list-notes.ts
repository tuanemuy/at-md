import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { Note } from "@/domain/note/models";
import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { ListNotesInput, ListNotesUseCase } from "../usecase";

/**
 * ブック内のノート一覧を取得するユースケース実装
 */
export class ListNotesService implements ListNotesUseCase {
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
  async execute(input: ListNotesInput): Promise<Result<Note[], NoteError>> {
    logger.info("Listing notes", { bookId: input.bookId });

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

    // ノート一覧を取得
    const notesResult = await this.noteRepository.findByBookId(input.bookId);

    return notesResult
      .map((result) => {
        logger.info("Successfully listed notes", {
          bookId: input.bookId,
          count: result.items.length,
          total: result.count,
        });
        return result.items;
      })
      .mapErr((error) => {
        logger.error("Failed to list notes", {
          bookId: input.bookId,
          error,
        });
        return new NoteError(
          NoteErrorCode.NOTE_NOT_FOUND,
          "ノート一覧の取得に失敗しました",
          error,
        );
      });
  }
} 