import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import type { ListNotesInput, ListNotesUseCase } from "../usecase";

/**
 * ブック内のノート一覧を取得するユースケース実装
 */
export class ListNotesService implements ListNotesUseCase {
  private readonly noteRepository: NoteRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      noteRepository: NoteRepository;
    };
  }) {
    this.noteRepository = params.deps.noteRepository;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: ListNotesInput) {
    return this.noteRepository
      .findByBookId(input.bookId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListNotes",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list notes",
            error,
          ),
      );
  }
}

