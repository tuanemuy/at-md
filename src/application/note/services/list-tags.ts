import type { TagRepository } from "@/domain/note/repositories/tag-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { ListTagsInput, ListTagsUseCase } from "../usecase";

/**
 * タグ一覧を取得するユースケース実装
 */
export class ListTagsService implements ListTagsUseCase {
  private readonly tagRepository: TagRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      tagRepository: TagRepository;
    };
  }) {
    this.tagRepository = params.deps.tagRepository;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: ListTagsInput) {
    return this.tagRepository
      .findByBookId(input.bookId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListTags",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list tags",
            error,
          ),
      );
  }
}
