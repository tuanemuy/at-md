import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type {
  DisconnectGitHubInput,
  DisconnectGitHubUseCase,
} from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";

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
          new AccountError(
            AccountErrorCode.GITHUB_DISCONNECTION_FAILED,
            "GitHub連携の削除に失敗しました",
            error,
          ),
      );
  }
}
