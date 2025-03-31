import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { ListNotesByTagInput, ListNotesByTagUseCase } from "../usecase";

/**
 * タグでノートをフィルタリングするユースケース実装
 */
export class ListNotesByTagService implements ListNotesByTagUseCase {
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
  execute(input: ListNotesByTagInput) {
    return this.noteRepository
      .findByTag(input.bookId, input.tagId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListNotesByTag",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list notes by tag",
            error,
          ),
      );
  }
}
