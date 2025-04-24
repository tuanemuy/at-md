import type { User } from "@/domain/account/models/user";
import type { GitHubCommit, GitHubRepository } from "@/domain/note/dtos";
import type { Book } from "@/domain/note/models/book";
import type { Note } from "@/domain/note/models/note";
import type { ApplicationServiceError } from "@/domain/types/error";
import {
  type PaginationParams,
  paginationParamsSchema,
} from "@/domain/types/pagination";
import type { ResultAsync } from "@/lib/result";
import { z } from "zod";

export const searchNotesInputSchema = z.object({
  bookId: z.string().nullish(),
  query: z.string().nullish(),
  pagination: paginationParamsSchema,
});
export type SearchNotesInput = z.infer<typeof searchNotesInputSchema>;

export const addBookInputSchema = z.object({
  userId: z.string(),
  owner: z.string(),
  repo: z.string(),
});
export type AddBookInput = z.infer<typeof addBookInputSchema>;

export interface NoteUsecase {
  /**
   * GitHubのリポジトリ一覧を取得する
   */
  searchRepositories: (input: {
    userId: string;
    query: string;
    owner: {
      type: "user" | "org";
      name: string;
    };
    pagination: PaginationParams;
  }) => ResultAsync<
    { repositories: GitHubRepository[]; count: number },
    ApplicationServiceError
  >;

  /**
   * ブックを追加する
   */
  addBook: (input: AddBookInput) => ResultAsync<Book, ApplicationServiceError>;

  /**
   * ブック一覧を取得する
   */
  listBooks: (input: {
    userId: string;
  }) => ResultAsync<Book[], ApplicationServiceError>;

  getBook: (input: {
    bookId: string;
  }) => ResultAsync<Book, ApplicationServiceError>;

  getBookByRepo: (input: {
    owner: string;
    repo: string;
  }) => ResultAsync<Book, ApplicationServiceError>;

  /**
   * ブックを削除する
   */
  deleteBook: (input: {
    userId: string;
    bookId: string;
  }) => ResultAsync<void, ApplicationServiceError>;

  deleteAllWebhooks: (input: {
    accessToken: string;
    userId: string;
  }) => ResultAsync<void, ApplicationServiceError>;

  /**
   * GitHubのPushからノートを作成する
   */
  pushNotes: (input: {
    owner: string;
    repo: string;
    installationId: number;
    commits: GitHubCommit[];
  }) => ResultAsync<{ synced: number; added: Note[] }, ApplicationServiceError>;

  /**
   * ノートを同期する
   */
  syncNotes: (input: {
    userId: string;
    owner: string;
    repo: string;
  }) => ResultAsync<{ synced: number }, ApplicationServiceError>;

  /**
   * ノート一覧を取得する
   */
  listNotes: (input: {
    bookId: string;
    pagination: PaginationParams;
  }) => ResultAsync<{ items: Note[]; count: number }, ApplicationServiceError>;

  /**
   * ノートを検索する
   */
  searchNotes: (
    input: SearchNotesInput,
  ) => ResultAsync<
    { items: (Note & { fullPath: string })[]; count: number },
    ApplicationServiceError
  >;

  /**
   * ノート情報を取得する
   */
  getNote: (input: {
    notePath: string;
  }) => ResultAsync<Note, ApplicationServiceError>;

  /**
   * タグ一覧を取得する
   */
  listTags: (input: {
    bookId: string;
  }) => ResultAsync<Note["tags"], ApplicationServiceError>;

  /**
   * タグでノートをフィルタリングする
   */
  listNotesByTag: (input: {
    bookId: string;
    tagId: string;
  }) => ResultAsync<{ items: Note[]; count: number }, ApplicationServiceError>;

  /**
   * ノートを削除する
   */
  deleteNote: (input: {
    noteId: string;
  }) => ResultAsync<void, ApplicationServiceError>;

  countBooks: () => ResultAsync<number, ApplicationServiceError>;

  countNotes: () => ResultAsync<number, ApplicationServiceError>;

  listBooksForSitemap: (input: {
    page: number;
    limit: number;
  }) => ResultAsync<
    (Omit<Book, "details" | "syncStatus"> & {
      user: Omit<User, "profile">;
    })[],
    ApplicationServiceError
  >;

  listNotesForSitemap: (input: {
    page: number;
    limit: number;
  }) => ResultAsync<
    (Omit<Note, "tags"> & {
      user: Omit<User, "profile">;
      book: Omit<Book, "details" | "syncStatus">;
    })[],
    ApplicationServiceError
  >;
}
