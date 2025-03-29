import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type {
  GetGitHubConnectionsInput,
  GetGitHubConnectionsUseCase,
} from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";

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
          new AccountError(
            AccountErrorCode.GITHUB_CONNECTION_FAILED,
            "GitHub連携情報の取得に失敗しました",
            error,
          ),
      );
  }
}
