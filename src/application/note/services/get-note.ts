import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { GetNoteInput, GetNoteUseCase } from "../usecase";

/**
 * ノートの詳細を取得するユースケース実装
 */
export class GetNoteService implements GetNoteUseCase {
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
  execute(input: GetNoteInput) {
    return this.noteRepository
      .findById(input.noteId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetNote",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to get note",
            error,
          ),
      );
  }
}
