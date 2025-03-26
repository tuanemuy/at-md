import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type {
  DisconnectGitHubInput,
  DisconnectGitHubUseCase,
} from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { Result } from "@/lib/result";
import { logger } from "@/lib/logger";

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
  async execute(
    input: DisconnectGitHubInput,
  ): Promise<Result<void, AccountError>> {
    logger.info("Disconnecting GitHub account", {
      userId: input.userId,
    });

    return (await this.githubConnectionRepository.deleteByUserId(input.userId))
      .map((_value) => {
        logger.info("Successfully disconnected GitHub account", {
          userId: input.userId,
        });
      })
      .mapErr((error) => {
        logger.error("Failed to delete GitHub connection", {
          error,
          userId: input.userId,
        });
        return new AccountError(
          AccountErrorCode.GITHUB_DISCONNECTION_FAILED,
          "GitHub連携の削除に失敗しました",
          error,
        );
      });
  }
}
