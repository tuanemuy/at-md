import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type {
  GetGitHubConnectionsInput,
  GetGitHubConnectionsUseCase,
} from "../usecase";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";

/**
 * GitHub連携一覧を取得するユースケース実装
 */
export class GetGitHubConnectionsService
  implements GetGitHubConnectionsUseCase
{
  private readonly githubConnectionRepository: GitHubConnectionRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      githubConnectionRepository: GitHubConnectionRepository;
    };
  }) {
    this.githubConnectionRepository = params.deps.githubConnectionRepository;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: GetGitHubConnectionsInput) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetGitHubConnections",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to get GitHub connections",
            error,
          ),
      );
  }
}
