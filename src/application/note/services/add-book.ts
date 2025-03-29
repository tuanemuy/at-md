import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { Book } from "@/domain/note/models";
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
  async execute(input: AddBookInput): Promise<Result<Book, NoteError>> {
    const connectionResult = (
      await this.githubConnectionRepository.findByUserId(input.userId)
    ).mapErr(
      (error) =>
        new NoteError(
          NoteErrorCode.CONNECTION_NOT_FOUND,
          "GitHub連携情報が見つかりません",
          error,
        ),
    );

    if (connectionResult.isErr()) {
      return connectionResult.map((_value) => ({}) as Book);
    }

    const connection = connectionResult.value;
    const getContentResult = await this.githubContentProvider.getContent(
      connection.accessToken,
      input.owner,
      input.repo,
      "README.md",
    );

    if (getContentResult.isErr()) {
      return err(
        new NoteError(
          NoteErrorCode.GITHUB_CONTENT_FETCH_FAILED,
          "README.mdの取得に失敗しました",
          getContentResult.error,
        ),
      );
    }

    const { title, body } = parseMarkdown(getContentResult.value);

    return (
      await this.bookRepository.create({
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
      })
    )
      .map((book) => {
        return book;
      })
      .mapErr((error) => {
        return new NoteError(
          NoteErrorCode.INVALID_REPOSITORY,
          "ブックの追加に失敗しました",
          error,
        );
      });
  }
}
