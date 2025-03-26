import type { GitHubAppProvider } from "@/domain/account/adapters/github-app-provider";
import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type { ConnectGitHubInput, ConnectGitHubUseCase } from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { Result } from "@/lib/result";
import { logger } from "@/lib/logger";

/**
 * GitHubとの連携を行うユースケース実装
 */
export class ConnectGitHubService implements ConnectGitHubUseCase {
  private readonly githubAppProvider: GitHubAppProvider;
  private readonly githubConnectionRepository: GitHubConnectionRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      githubAppProvider: GitHubAppProvider;
      githubConnectionRepository: GitHubConnectionRepository;
    };
  }) {
    this.githubAppProvider = params.deps.githubAppProvider;
    this.githubConnectionRepository = params.deps.githubConnectionRepository;
  }

  /**
   * ユースケースを実行する
   */
  async execute(
    input: ConnectGitHubInput,
  ): Promise<Result<void, AccountError>> {
    logger.info("Connecting GitHub account", {
      userId: input.userId,
    });

    const tokenResult = (
      await this.githubAppProvider.getAccessToken(input.code)
    ).mapErr((error) => {
      logger.error("Failed to get GitHub access token", {
        error,
      });
      return new AccountError(
        AccountErrorCode.GITHUB_CONNECTION_FAILED,
        "GitHubのアクセストークンの取得に失敗しました",
        error,
      );
    });

    if (tokenResult.isErr()) {
      return tokenResult.map((_value) => {});
    }

    const { accessToken, refreshToken } = tokenResult.value;

    return (
      await this.githubConnectionRepository.create({
        userId: input.userId,
        accessToken,
        refreshToken: refreshToken || null,
      })
    )
      .map((_value) => {
        logger.info("Successfully created GitHub connection", {
          userId: input.userId,
        });
      })
      .mapErr((error) => {
        logger.error("Failed to create GitHub connection", {
          error,
          userId: input.userId,
        });
        return new AccountError(
          AccountErrorCode.GITHUB_CONNECTION_FAILED,
          "GitHub連携の作成に失敗しました",
          error,
        );
      });
  }
}
