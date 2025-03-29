import type { Result } from "@/lib/result";
import { ok } from "@/lib/result";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { TagRepository } from "@/domain/note/repositories/tag-repository";
import type { GitHubContentProvider } from "@/domain/note/adapters/github-content-provider";
import type { PushNotesInput, PushNotesUseCase } from "../usecase";
import { parseMarkdown } from "@/domain/note/services/parse-markdown";
import { SyncStatusCode } from "@/domain/note/models/sync-status";

/**
 * ノートを同期するユースケース実装
 */
export class PushNotesService implements PushNotesUseCase {
  private readonly noteRepository: NoteRepository;
  private readonly bookRepository: BookRepository;
  private readonly tagRepository: TagRepository;
  private readonly githubContentProvider: GitHubContentProvider;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      noteRepository: NoteRepository;
      bookRepository: BookRepository;
      tagRepository: TagRepository;
      githubContentProvider: GitHubContentProvider;
    };
  }) {
    this.noteRepository = params.deps.noteRepository;
    this.bookRepository = params.deps.bookRepository;
    this.tagRepository = params.deps.tagRepository;
    this.githubContentProvider = params.deps.githubContentProvider;
  }

  /**
   * ユースケースを実行する
   */
  async execute(input: PushNotesInput): Promise<Result<number, NoteError>> {
    const bookResult = (
      await this.bookRepository.findByOwnerAndRepo(input.owner, input.repo)
    ).mapErr(
      (error) =>
        new NoteError(
          NoteErrorCode.BOOK_NOT_FOUND,
          "ブックが見つかりません",
          error,
        ),
    );
    if (bookResult.isErr()) {
      return bookResult.map((_value) => 0);
    }
    const book = bookResult.value;

    // ToDo: Support renamed files
    let synced = 0;
    await Promise.all(
      input.commits.map(async (commit) => {
        const results = await Promise.all([
          ...commit.modified.map(async (filePath) => {
            const contentResult = (
              await this.githubContentProvider.getContentByInstallation(
                input.installationId,
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
          this.noteRepository.deleteByPath(book.id, commit.removed),
        ]);

        const success = results.slice(0, -1).filter((r) => r !== null).length;
        synced += success;
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

    return ok(synced);
  }
}
