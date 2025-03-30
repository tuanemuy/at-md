import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { GitHubContentProvider } from "@/domain/note/adapters/github-content-provider";
import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type {
  ListRepositoriesInput,
  ListRepositoriesUseCase,
} from "../usecase";

/**
 * リポジトリ一覧を取得するユースケース実装
 */
export class ListRepositoriesService implements ListRepositoriesUseCase {
  private readonly githubConnectionRepository: GitHubConnectionRepository;
  private readonly githubContentProvider: GitHubContentProvider;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      githubConnectionRepository: GitHubConnectionRepository;
      githubContentProvider: GitHubContentProvider;
    };
  }) {
    this.githubConnectionRepository = params.deps.githubConnectionRepository;
    this.githubContentProvider = params.deps.githubContentProvider;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: ListRepositoriesInput) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .andThen((connection) =>
        this.githubContentProvider.listRepositories(connection.accessToken),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListRepositories",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list repositories",
            error,
          ),
      );
  }
}
