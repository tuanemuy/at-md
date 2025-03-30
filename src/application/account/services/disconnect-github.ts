import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type {
  DisconnectGitHubInput,
  DisconnectGitHubUseCase,
} from "../usecase";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";

/**
 * GitHub連携を解除するユースケース実装
 */
export class DisconnectGitHubService implements DisconnectGitHubUseCase {
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
  execute(input: DisconnectGitHubInput) {
    return this.githubConnectionRepository
      .deleteByUserId(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "DisconnectGitHub",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to disconnect GitHub",
            error,
          ),
      );
  }
}
