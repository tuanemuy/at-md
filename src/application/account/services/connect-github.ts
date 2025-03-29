import type { GitHubAppProvider } from "@/domain/account/adapters/github-app-provider";
import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type { ConnectGitHubInput, ConnectGitHubUseCase } from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";

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
  execute(input: ConnectGitHubInput) {
    return this.githubAppProvider
      .getAccessToken(input.code)
      .andThen(({ accessToken, refreshToken }) =>
        this.githubConnectionRepository.create({
          userId: input.userId,
          accessToken,
          refreshToken: refreshToken || null,
        }),
      )
      .mapErr(
        (error) =>
          new AccountError(
            AccountErrorCode.GITHUB_CONNECTION_FAILED,
            "GitHubとの連携に失敗しました",
            error,
          ),
      )
      .map(() => {});
  }
}
