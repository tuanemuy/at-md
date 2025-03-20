/**
 * ノート管理コンテキストのエラー定義
 */
import { AnyError } from "@/domain/types/error";

/**
 * ノート管理関連のエラーコード
 */
export const NoteErrorCode = {
  // 同期関連
  SYNC_IN_PROGRESS: "sync_in_progress",
  SYNC_FAILED: "sync_failed",
  INVALID_CONTENT: "invalid_content",
  PARSE_ERROR: "parse_error",

  // ブック関連
  BOOK_NOT_FOUND: "book_not_found",
  BOOK_ALREADY_EXISTS: "book_already_exists",
  INVALID_REPOSITORY: "invalid_repository",
  WEBHOOK_SETUP_FAILED: "webhook_setup_failed",

  // タグ関連
  TAG_NOT_FOUND: "tag_not_found",
  TAG_ALREADY_EXISTS: "tag_already_exists",
  INVALID_TAG_NAME: "invalid_tag_name",

  // ノート関連
  NOTE_NOT_FOUND: "note_not_found",
  NOTE_ALREADY_EXISTS: "note_already_exists",
  INVALID_NOTE_FORMAT: "invalid_note_format",

  // 検索関連
  SEARCH_FAILED: "search_failed",
  INVALID_QUERY: "invalid_query",
} as const;

export type NoteErrorCode = (typeof NoteErrorCode)[keyof typeof NoteErrorCode];

/**
 * ノート管理コンテキスト固有のエラー
 */
export class NoteError extends AnyError {
  constructor(
    public code: NoteErrorCode,
    public message: string,
    public cause?: Error | unknown,
  ) {
    super(code, message, cause);
  }
}
