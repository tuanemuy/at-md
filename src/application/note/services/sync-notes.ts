import { ResultAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
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
  execute(input: SyncNotesInput) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .andThen((connection) =>
        this.bookRepository
          .findByOwnerAndRepo(input.owner, input.repo)
          .map((book) => ({ book, connection })),
      )
      .andThen(({ book, connection }) =>
        this.githubContentProvider
          .listPaths(connection.accessToken, input.owner, input.repo)
          .map((paths) => ({ book, connection, paths })),
      )
      .andThen(({ book, connection, paths }) =>
        ResultAsync.fromThrowable(
          async () => {
            const results = await Promise.all(
              paths.map(async (filePath) => {
                const contentResult = (
                  await this.githubContentProvider.getContent(
                    connection.accessToken,
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
                      title ||
                      filePath.split("/").slice(-1)[0].replace(/\.md$/, ""),
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

            return results.filter((r) => r !== null).length;
          },
          (e) => e,
        )(),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "SyncNotes",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to sync notes",
            error,
          ),
      );
  }
}
