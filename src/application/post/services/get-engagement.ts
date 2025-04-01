import type { BlueskyPostProvider } from "@/domain/post/adapters";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { GetEngagementInput, GetEngagementUseCase } from "../usecase";

/**
 * エンゲージメントを取得するユースケース実装
 */
export class GetEngagementService implements GetEngagementUseCase {
  private readonly blueskyPostProvider: BlueskyPostProvider;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      blueskyPostProvider: BlueskyPostProvider;
    };
  }) {
    this.blueskyPostProvider = params.deps.blueskyPostProvider;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: GetEngagementInput) {
    return this.blueskyPostProvider
      .getEngagement(input.uri)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetEngagement",
            ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
            "エンゲージメント情報の取得に失敗しました",
            error,
          ),
      );
  }
}

