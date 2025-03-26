import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type {
  GetGitHubConnectionsInput,
  GetGitHubConnectionsUseCase,
} from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import { type Result, err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import type { GitHubConnection } from "@/domain/account/models/github-connection";

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
  async execute(
    input: GetGitHubConnectionsInput,
  ): Promise<Result<GitHubConnection, AccountError>> {
    logger.info("Getting GitHub connection", {
      userId: input.userId,
    });

    return (await this.githubConnectionRepository.findByUserId(input.userId))
      .andTee((value) => {
        logger.info("Successfully got GitHub connections", {
          userId: value.userId,
        });
      })
      .mapErr((error) => {
        logger.error("Failed to get GitHub connections", {
          error,
          userId: input.userId,
        });
        return new AccountError(
          AccountErrorCode.GITHUB_CONNECTION_FAILED,
          "GitHub連携情報の取得に失敗しました",
          error,
        );
      });
  }
}
