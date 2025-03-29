import type { ResultAsync } from "@/lib/result";
import type { NoteError } from "@/domain/note/models/errors";
import type { Book } from "@/domain/note/models/book";
import type { Note } from "@/domain/note/models/note";
import type { SyncStatus } from "@/domain/note/models/sync-status";
import type { GitHubRepository, GitHubCommit } from "@/domain/note/dtos";
import type { PaginationParams } from "@/domain/types/pagination";

/**
 * リポジトリ一覧を取得するユースケースの入力
 */
export interface ListRepositoriesInput {
  userId: string;
}

/**
 * リポジトリ一覧を取得するユースケース
 */
export interface ListRepositoriesUseCase {
  execute(input: ListRepositoriesInput): ResultAsync<GitHubRepository[], NoteError>;
}

/**
 * ブックを追加するユースケースの入力
 */
export interface AddBookInput {
  userId: string;
  owner: string;
  repo: string;
}

/**
 * ブックを追加するユースケース
 */
export interface AddBookUseCase {
  execute(input: AddBookInput): ResultAsync<Book, NoteError>;
}

/**
 * ブック一覧を取得するユースケースの入力
 */
export interface ListBooksInput {
  userId: string;
}

/**
 * ブック一覧を取得するユースケース
 */
export interface ListBooksUseCase {
  execute(input: ListBooksInput): ResultAsync<Book[], NoteError>;
}

/**
 * ブック情報を取得するユースケースの入力
 */
export interface GetBookInput {
  bookId: string;
}

/**
 * ブック情報を取得するユースケース
 */
export interface GetBookUseCase {
  execute(input: GetBookInput): ResultAsync<Book, NoteError>;
}

/**
 * ブックを削除するユースケースの入力
 */
export interface DeleteBookInput {
  userId: string;
  bookId: string;
}

/**
 * ブックを削除するユースケース
 */
export interface DeleteBookUseCase {
  execute(input: DeleteBookInput): ResultAsync<void, NoteError>;
}

/**
 * GitHubのPushからノートを作成するユースケースの入力
 */
export interface PushNotesInput {
  userId: string;
  owner: string;
  repo: string;
  installationId: number;
  commits: GitHubCommit[];
}

/**
 * GitHubのPushからノートを作成するユースケース
 */
export interface PushNotesUseCase {
  execute(input: PushNotesInput): ResultAsync<number, NoteError>;
}

/**
 * ノートを同期するユースケースの入力
 */
export interface SyncNotesInput {
  userId: string;
  owner: string;
  repo: string;
}

/**
 * ノートを同期するユースケース
 */
export interface SyncNotesUseCase {
  execute(input: SyncNotesInput): ResultAsync<number, NoteError>;
}

/**
 * ノート一覧を取得するユースケースの入力
 */
export interface ListNotesInput {
  bookId: string;
  pagination: PaginationParams;
}

/**
 * ノート一覧を取得するユースケース
 */
export interface ListNotesUseCase {
  execute(input: ListNotesInput): ResultAsync<Note[], NoteError>;
}

/**
 * ノートを検索するユースケースの入力
 */
export interface SearchNotesInput {
  bookId: string;
  query: string;
  page: number;
  perPage: number;
}

/**
 * ノートを検索するユースケース
 */
export interface SearchNotesUseCase {
  execute(input: SearchNotesInput): ResultAsync<Note[], NoteError>;
}

/**
 * ノート情報を取得するユースケースの入力
 */
export interface GetNoteInput {
  bookId: string;
  noteId: string;
}

/**
 * ノート情報を取得するユースケース
 */
export interface GetNoteUseCase {
  execute(input: GetNoteInput): ResultAsync<Note, NoteError>;
}

/**
 * タグ一覧を取得するユースケースの入力
 */
export interface ListTagsInput {
  bookId: string;
}

/**
 * タグ一覧を取得するユースケース
 */
export interface ListTagsUseCase {
  execute(input: ListTagsInput): ResultAsync<Note["tags"], NoteError>;
}

/**
 * タグでノートをフィルタリングするユースケースの入力
 */
export interface ListNotesByTagInput {
  bookId: string;
  tagId: string;
}

/**
 * タグでノートをフィルタリングするユースケース
 */
export interface ListNotesByTagUseCase {
  execute(input: ListNotesByTagInput): ResultAsync<Note[], NoteError>;
}

/**
 * ブックの同期状態を確認するユースケースの入力
 */
export interface CheckBookSyncStatusInput {
  bookId: string;
}

/**
 * ブックの同期状態を確認するユースケース
 */
export interface CheckBookSyncStatusUseCase {
  execute(input: CheckBookSyncStatusInput): ResultAsync<SyncStatus, NoteError>;
}
