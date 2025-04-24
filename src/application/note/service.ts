import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type { GitHubContentProvider } from "@/domain/note/adapters/github-content-provider";
import type { GitHubCommit } from "@/domain/note/dtos";
import type { Book } from "@/domain/note/models/book";
import { type Note, separator } from "@/domain/note/models/note";
import { NoteScope } from "@/domain/note/models/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import type { TagRepository } from "@/domain/note/repositories/tag-repository";
import { parseMarkdown } from "@/domain/note/services/parse-markdown";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { PaginationParams } from "@/domain/types/pagination";
import { logger } from "@/lib/logger";
import { ResultAsync, okAsync } from "@/lib/result";
import type { AddBookInput, NoteUsecase, SearchNotesInput } from "./usecase";

export class NoteService implements NoteUsecase {
  private readonly githubContentProvider: GitHubContentProvider;
  private readonly githubConnectionRepository: GitHubConnectionRepository;
  private readonly bookRepository: BookRepository;
  private readonly noteRepository: NoteRepository;
  private readonly tagRepository: TagRepository;

  constructor(params: {
    deps: {
      githubConnectionRepository: GitHubConnectionRepository;
      githubContentProvider: GitHubContentProvider;
      bookRepository: BookRepository;
      noteRepository: NoteRepository;
      tagRepository: TagRepository;
    };
  }) {
    this.githubConnectionRepository = params.deps.githubConnectionRepository;
    this.githubContentProvider = params.deps.githubContentProvider;
    this.bookRepository = params.deps.bookRepository;
    this.noteRepository = params.deps.noteRepository;
    this.tagRepository = params.deps.tagRepository;
  }

  public searchRepositories(input: {
    userId: string;
    query: string;
    owner: {
      type: "user" | "org";
      name: string;
    };
    pagination: PaginationParams;
  }) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .andThen((connection) =>
        this.githubContentProvider.searchRepositories(
          connection.accessToken,
          input.query,
          input.owner,
          input.pagination,
        ),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListRepositories",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list repositories",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to search repositories", error));
  }

  public addBook(input: AddBookInput) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .andThen((connection) =>
        this.githubContentProvider
          .getContent(
            connection.accessToken,
            input.owner,
            input.repo,
            "README.md",
          )
          .map((content) => ({
            accessToken: connection.accessToken,
            content: parseMarkdown(content),
          }))
          .orElse(() =>
            okAsync({
              accessToken: connection.accessToken,
              content: {
                title: input.repo,
                body: "",
              },
            }),
          ),
      )
      .andThen(({ accessToken, content }) =>
        this.githubContentProvider
          .setupWebhook(accessToken, input.owner, input.repo)
          .map((webhookId) => ({
            content,
            webhookId,
          })),
      )
      .andThen(({ content: { title, body }, webhookId }) =>
        this.bookRepository.create({
          userId: input.userId,
          owner: input.owner,
          repo: input.repo,
          webhookId,
          details: {
            name: title || input.repo,
            description: body,
          },
          syncStatus: {
            lastSyncedAt: null,
            status: SyncStatusCode.WAITING,
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
      )
      .orTee((error) => logger.error("Failed to add a book", error));
  }

  public listBooks(input: {
    userId: string;
  }) {
    return this.bookRepository
      .findByUserId(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListBooks",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list books",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to list books", error));
  }

  public getBook(input: {
    bookId: string;
  }) {
    return this.bookRepository
      .findById(input.bookId)
      .mapErr((error) => {
        return new ApplicationServiceError(
          "GetBook",
          ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
          "ブックが見つかりません",
          error,
        );
      })
      .orTee((error) => logger.debug("Failed to get book", error));
  }

  public getBookByRepo(input: {
    owner: string;
    repo: string;
  }) {
    return this.bookRepository
      .findByOwnerAndRepo(input.owner, input.repo)
      .mapErr((error) => {
        return new ApplicationServiceError(
          "GetBookByRepo",
          ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
          "ブックが見つかりません",
          error,
        );
      })
      .orTee((error) => logger.debug("Failed to get book by repo", error));
  }

  deleteBook(input: {
    userId: string;
    bookId: string;
  }) {
    return this.bookRepository
      .delete(input.bookId, input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "DeleteBook",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to delete book",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to delete book", error));
  }

  deleteAllWebhooks(input: {
    accessToken: string;
    userId: string;
  }) {
    return this.bookRepository
      .findByUserId(input.userId)
      .andThen((books) =>
        ResultAsync.fromThrowable(
          () =>
            Promise.all(
              books.map((book) =>
                this.githubContentProvider.deleteWebhook(
                  input.accessToken,
                  book.owner,
                  book.repo,
                  book.webhookId,
                ),
              ),
            ),
          (e) => e,
        )(),
      )
      .map(() => {})
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "DeleteWebhook",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to delete webhook",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to delete book", error));
  }

  public pushNotes(input: {
    owner: string;
    repo: string;
    installationId: number;
    commits: GitHubCommit[];
  }) {
    return this.bookRepository
      .findByOwnerAndRepo(input.owner, input.repo)
      .andThen((book) =>
        ResultAsync.fromThrowable(
          async () => {
            let synced = 0;
            const added: Note[] = [];
            for (const commit of input.commits) {
              const modifiedNotes = await this.createNotes(
                book,
                commit.modified,
                {
                  token: input.installationId,
                  owner: input.owner,
                  repo: input.repo,
                },
              );
              const addedNotes = await this.createNotes(book, commit.added, {
                token: input.installationId,
                owner: input.owner,
                repo: input.repo,
              });

              await this.noteRepository
                .deleteByPath(
                  book.id,
                  commit.removed.filter(
                    (filePath) =>
                      filePath.endsWith(".md") && filePath !== "README.md",
                  ),
                )
                .unwrapOr(null);

              synced += modifiedNotes.length;
              synced += addedNotes.length;
              added.push(...addedNotes);
            }

            await Promise.all([
              this.tagRepository.deleteUnused(book.id),
              this.bookRepository.update({
                id: book.id,
                syncStatus: {
                  lastSyncedAt: new Date(),
                  status: SyncStatusCode.SYNCED,
                },
              }),
            ]);

            return { book, synced, added };
          },
          (e) => e,
        )(),
      )
      .andThen(({ book, synced, added }) =>
        this.githubContentProvider
          .getContentByInstallation(
            input.installationId,
            input.owner,
            input.repo,
            "README.md",
          )
          .map((content) => ({
            book,
            synced,
            added,
            content: parseMarkdown(content),
          })),
      )
      .andThen(({ book, synced, added, content: { title, body } }) =>
        this.bookRepository
          .update({
            id: book.id,
            details: {
              name: title || book.details.name,
              description: body,
            },
            syncStatus: {
              lastSyncedAt: new Date(),
              status: SyncStatusCode.SYNCED,
            },
          })
          .map(() => ({
            synced,
            added,
          })),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "PushNotes",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to push notes",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to push notes", error));
  }

  public syncNotes(input: {
    userId: string;
    owner: string;
    repo: string;
  }) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .andThen((connection) =>
        this.bookRepository
          .findByOwnerAndRepo(input.owner, input.repo)
          .map((book) => ({ book, connection })),
      )
      .andThen(({ book, connection }) =>
        this.githubContentProvider
          .getContent(
            connection.accessToken,
            input.owner,
            input.repo,
            "README.md",
          )
          .map((content) => ({
            book,
            connection,
            content: parseMarkdown(content),
          }))
          .orElse(() =>
            okAsync({
              book,
              connection,
              content: {
                title: input.repo,
                body: "",
              },
            }),
          ),
      )
      .andThen(({ book, connection, content: { title, body } }) =>
        this.bookRepository
          .update({
            id: book.id,
            details: {
              name: title || book.details.name,
              description: body,
            },
          })
          .map(() => ({
            book,
            connection,
          })),
      )
      .andThen(({ book, connection }) =>
        this.githubContentProvider
          .listPaths(connection.accessToken, input.owner, input.repo)
          .map((paths) => ({ book, connection, paths })),
      )
      .andThen(({ book, connection, paths }) =>
        ResultAsync.fromThrowable(
          async () => {
            const results = await this.createNotes(book, paths, {
              token: connection.accessToken,
              owner: input.owner,
              repo: input.repo,
            });

            await Promise.all([
              this.tagRepository.deleteUnused(book.id),
              this.bookRepository.update({
                id: book.id,
                syncStatus: {
                  lastSyncedAt: new Date(),
                  status: SyncStatusCode.SYNCED,
                },
              }),
            ]);

            return { synced: results.filter((r) => r !== null).length };
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
      )
      .orTee((error) => logger.error("Failed to sync notes", error));
  }

  public listNotes(input: {
    bookId: string;
    pagination: PaginationParams;
  }) {
    return this.noteRepository
      .findByBookId(input.bookId, input.pagination)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListNotes",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list notes",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to list notes", error));
  }

  public searchNotes(input: SearchNotesInput) {
    return this.noteRepository
      .search(input.bookId, input.query, input.pagination)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "SearchNotes",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to search notes",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to search notes", error));
  }

  public getNote(input: {
    notePath: string;
  }) {
    return this.noteRepository
      .findByPath(input.notePath)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetNote",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to get note",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to get note", error));
  }

  public listTags(input: {
    bookId: string;
  }) {
    return this.tagRepository
      .findByBookId(input.bookId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListTags",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list tags",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to list tags", error));
  }

  public listNotesByTag(input: {
    bookId: string;
    tagId: string;
  }) {
    return this.noteRepository
      .findByTag(input.bookId, input.tagId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListNotesByTag",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list notes by tag",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to list notes by tag", error));
  }

  deleteNote(input: {
    noteId: string;
  }) {
    return this.noteRepository
      .delete(input.noteId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "DeleteNote",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to delete note",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to delete note", error));
  }

  public countBooks() {
    return this.bookRepository
      .count()
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "CountBooks",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to count books",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to count books", error));
  }

  public listBooksForSitemap(input: { page: number; limit: number }) {
    return this.bookRepository
      .list(input.page, input.limit)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListBooksWithoutDetails",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list user books without details",
            error,
          ),
      )
      .orTee((error) =>
        logger.debug("Failed to list user books without details", error),
      );
  }

  public countNotes() {
    return this.noteRepository
      .count()
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "CountNotes",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to count notes",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to count notes", error));
  }

  public listNotesForSitemap(input: { page: number; limit: number }) {
    return this.noteRepository
      .list(input.page, input.limit)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListBookNotesWithoutTags",
            ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
            "Failed to list  book notes without tags",
            error,
          ),
      )
      .orTee((error) =>
        logger.debug("Failed to list book notes without tags", error),
      );
  }

  private getContent(
    owner: string,
    repo: string,
    path: string,
    token: string | number,
  ) {
    if (typeof token === "number") {
      return this.githubContentProvider.getContentByInstallation(
        token,
        owner,
        repo,
        path,
      );
    }
    return this.githubContentProvider.getContent(token, owner, repo, path);
  }

  private async createNotes(
    book: Book,
    paths: string[],
    installation: {
      token: string | number;
      owner: string;
      repo: string;
    },
  ) {
    const created: Note[] = [];
    for (const path of paths) {
      if (path.endsWith(".md") && path !== "README.md") {
        const contentResult = (
          await this.getContent(
            installation.owner,
            installation.repo,
            path,
            installation.token,
          )
        ).map((content) => parseMarkdown(content));

        if (contentResult.isErr()) {
          continue;
        }

        const { title, body, tags, scope } = contentResult.value;

        if (scope !== NoteScope.PUBLIC) {
          continue;
        }

        await this.noteRepository
          .createOrUpdate({
            userId: book.userId,
            bookId: book.id,
            path: path.replace("/", separator),
            title: title || path.split("/").slice(-1)[0].replace(/\.md$/, ""),
            body,
            scope,
            tags,
          })
          .match(
            (note) => {
              if (note) {
                created.push(note);
              }
            },
            (error) => {
              logger.error("Failed to create note", error);
            },
          );
      }
    }
    return created;
  }
}
