import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { Note } from "@/domain/note/models";
import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { GetNoteInput, GetNoteUseCase } from "../usecase";

/**
 * ノートの詳細を取得するユースケース実装
 */
export class GetNoteService implements GetNoteUseCase {
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
  async execute(input: GetNoteInput): Promise<Result<Note, NoteError>> {
    logger.info("Getting note", { bookId: input.bookId, noteId: input.noteId });

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

    // ノートを取得
    const noteResult = await this.noteRepository.findById(input.noteId);

    return noteResult
      .andThen((note) => {
        // ノートが指定されたブックに属しているか確認
        if (note.bookId !== input.bookId) {
          logger.error("Note does not belong to the specified book", {
            noteId: input.noteId,
            bookId: input.bookId,
            actualBookId: note.bookId,
          });
          return err(
            new NoteError(
              NoteErrorCode.NOTE_NOT_FOUND,
              "指定されたブックにノートが見つかりません",
            ),
          );
        }
        return noteResult;
      })
      .map((note) => {
        logger.info("Successfully got note", {
          noteId: input.noteId,
          bookId: input.bookId,
        });
        return note;
      })
      .mapErr((error) => {
        logger.error("Failed to get note", {
          noteId: input.noteId,
          bookId: input.bookId,
          error,
        });
        return new NoteError(
          NoteErrorCode.NOTE_NOT_FOUND,
          "ノートが見つかりません",
          error,
        );
      });
  }
} 