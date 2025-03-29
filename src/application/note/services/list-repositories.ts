import type { Result } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { GitHubRepository } from "@/domain/note/dtos";
import type { GitHubContentProvider } from "@/domain/note/adapters/github-content-provider";
import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type { GitHubConnection } from "@/domain/account/models";
import type { ListRepositoriesInput, ListRepositoriesUseCase } from "../usecase";
import { RepositoryError } from "@/domain/types/error";

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
  async execute(
    input: ListRepositoriesInput,
  ): Promise<Result<GitHubRepository[], NoteError>> {
    logger.info("Listing GitHub repositories", { userId: input.userId });

    // GitHub連携情報を取得
    const connectionResult = await this.githubConnectionRepository.findByUserId(
      input.userId,
    );
    if (connectionResult.isErr()) {
      logger.error("Failed to find GitHub connection", {
        userId: input.userId,
        error: connectionResult.error,
      });
      return err(
        new NoteError(
          NoteErrorCode.CONNECTION_NOT_FOUND,
          "GitHub連携情報が見つかりません",
          connectionResult.error,
        ),
      );
    }

    const connection = connectionResult.value;

    // リポジトリ一覧を取得
    const repositoriesResult = await this.githubContentProvider.listRepositories(
      connection.accessToken,
    );
    
    if (repositoriesResult.isErr()) {
      logger.error("Failed to list GitHub repositories", {
        userId: input.userId,
        error: repositoriesResult.error,
      });
      return err(
        new NoteError(
          NoteErrorCode.GITHUB_CONTENT_FETCH_FAILED,
          "リポジトリ一覧の取得に失敗しました",
          repositoriesResult.error,
        ),
      );
    }
    
    const repositories = repositoriesResult.value;
    logger.info("Successfully listed GitHub repositories", {
      userId: input.userId,
      count: repositories.length,
    });
    
    return ok(repositories);
  }
} 
