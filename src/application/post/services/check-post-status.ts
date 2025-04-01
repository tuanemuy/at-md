import type { PostRepository } from "@/domain/post/repositories";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { CheckPostStatusInput, CheckPostStatusUseCase } from "../usecase";

/**
 * 投稿ステータスを確認するユースケース実装
 */
export class CheckPostStatusService implements CheckPostStatusUseCase {
  private readonly postRepository: PostRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      postRepository: PostRepository;
    };
  }) {
    this.postRepository = params.deps.postRepository;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: CheckPostStatusInput) {
    return this.postRepository
      .findByNoteId(input.noteId)
      .map((post) => post.status)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "CheckPostStatus",
            ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
            "投稿ステータスの確認に失敗しました",
            error,
          ),
      );
  }
} 