import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { DBOrder } from "@/domain/types/pagination";
import type { SearchNotesInput, SearchNotesUseCase } from "../usecase";

/**
 * ノートを検索するユースケース実装
 */
export class SearchNotesService implements SearchNotesUseCase {
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
  execute(input: SearchNotesInput) {
    return this.noteRepository
      .search(input.bookId, input.query, {
        ...input.pagination,
        order: DBOrder.DESC,
        orderBy: "updatedAt",
      })
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "SearchNotes",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to search notes",
            error,
          ),
      );
  }
}
