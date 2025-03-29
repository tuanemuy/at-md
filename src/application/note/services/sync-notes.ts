import type { Result } from "@/lib/result";
import { ok } from "@/lib/result";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { TagRepository } from "@/domain/note/repositories/tag-repository";
import type { GitHubContentProvider } from "@/domain/note/adapters/github-content-provider";
import type { SyncNotesInput, SyncNotesUseCase } from "../usecase";
import { parseMarkdown } from "@/domain/note/services/parse-markdown";
import { SyncStatusCode } from "@/domain/note/models/sync-status";

/**
 * ノートを同期するユースケース実装
 */
export class SyncNotesService implements SyncNotesUseCase {
  private readonly githubConnectionRepository: GitHubConnectionRepository;
  private readonly noteRepository: NoteRepository;
  private readonly bookRepository: BookRepository;
  private readonly tagRepository: TagRepository;
  private readonly githubContentProvider: GitHubContentProvider;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      githubConnectionRepository: GitHubConnectionRepository;
      noteRepository: NoteRepository;
      bookRepository: BookRepository;
      tagRepository: TagRepository;
      githubContentProvider: GitHubContentProvider;
    };
  }) {
    this.githubConnectionRepository = params.deps.githubConnectionRepository;
    this.noteRepository = params.deps.noteRepository;
    this.bookRepository = params.deps.bookRepository;
    this.tagRepository = params.deps.tagRepository;
    this.githubContentProvider = params.deps.githubContentProvider;
  }

  /**
   * ユースケースを実行する
   */
  async execute(input: SyncNotesInput): Promise<Result<number, NoteError>> {
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
      return connectionResult.map((_value) => 0);
    }

    const bookResult = (
      await this.bookRepository.findByOwnerAndRepo(input.owner, input.repo)
    ).mapErr((error) => {
      return new NoteError(
        NoteErrorCode.BOOK_NOT_FOUND,
        "ブックが見つかりません",
        error,
      );
    });
    if (bookResult.isErr()) {
      return bookResult.map((_value) => 0);
    }

    const accessToken = connectionResult.value.accessToken;
    const book = bookResult.value;

    const pathsResults = (
      await this.githubContentProvider.listPaths(
        accessToken,
        input.owner,
        input.repo,
      )
    ).mapErr((error) => {
      return new NoteError(
        NoteErrorCode.GITHUB_CONTENT_FETCH_FAILED,
        "ファイルを取得できません",
        error,
      );
    });
    if (pathsResults.isErr()) {
      return pathsResults.map((_value) => 0);
    }

    // ToDo: Support renamed files
    const results = await Promise.all(
      pathsResults.value.map(async (filePath) => {
        const contentResult = (
          await this.githubContentProvider.getContent(
            accessToken,
            input.owner,
            input.repo,
            filePath,
          )
        ).map((content) => parseMarkdown(content));

        if (contentResult.isErr()) {
          return null;
        }

        const { title, body, tags, scope } = contentResult.value;
        return (
          await this.noteRepository.createOrUpdate({
            userId: input.userId,
            bookId: book.id,
            path: filePath,
            title:
              title || filePath.split("/").slice(-1)[0].replace(/\.md$/, ""),
            body,
            scope,
            tags,
          })
        ).unwrapOr(null);
      }),
    );

    await Promise.all([
      this.tagRepository.deleteUnused(book.id),
      this.bookRepository.update({
        ...book,
        syncStatus: {
          lastSyncedAt: new Date(),
          status: SyncStatusCode.SYNCED,
        },
      }),
    ]);

    return ok(results.filter((r) => r !== null).length);
  }
}
