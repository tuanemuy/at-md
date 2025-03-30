import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { GitHubContentProvider } from "@/domain/note/adapters/github-content-provider";
import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type { AddBookInput, AddBookUseCase } from "../usecase";
import { parseMarkdown } from "@/domain/note/services/parse-markdown";

/**
 * ブックを追加するユースケース実装
 */
export class AddBookService implements AddBookUseCase {
  private readonly githubConnectionRepository: GitHubConnectionRepository;
  private readonly githubContentProvider: GitHubContentProvider;
  private readonly bookRepository: BookRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      githubConnectionRepository: GitHubConnectionRepository;
      githubContentProvider: GitHubContentProvider;
      bookRepository: BookRepository;
    };
  }) {
    this.githubConnectionRepository = params.deps.githubConnectionRepository;
    this.githubContentProvider = params.deps.githubContentProvider;
    this.bookRepository = params.deps.bookRepository;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: AddBookInput) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .andThen((connection) =>
        this.githubContentProvider.getContent(
          connection.accessToken,
          input.owner,
          input.repo,
          "README.md",
        ),
      )
      .map((content) => parseMarkdown(content))
      .andThen(({ title, body }) =>
        this.bookRepository.create({
          userId: input.userId,
          owner: input.owner,
          repo: input.repo,
          details: {
            name: title || input.repo,
            description: body,
          },
          syncStatus: {
            lastSyncedAt: null,
            status: SyncStatusCode.SYNCED,
          },
        }),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "AddBook",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to add a book",
            error,
          ),
      );
  }
}
