import { z } from "zod";
import type {
  AnyError,
  RepositoryError,
  RepositoryErrorCode,
} from "@/domain/shared/models/common";

/**
 * 同期エラーコードのスキーマ
 */
export const syncErrorCodeSchema = z.enum([
  "GITHUREPO_NOT_FOUND",
  "FILE_NOT_FOUND",
  "PARSE_ERROR",
  "API_ERROR",
]);

/**
 * 同期エラーコードの型
 */
export type SyncErrorCode = z.infer<typeof syncErrorCodeSchema>;

/**
 * 同期エラーの型
 */
export interface SyncError extends AnyError {
  name: "SyncError";
  type: SyncErrorCode;
  message: string;
  cause?: Error;
}

/**
 * 同期エラーを作成する
 * @param type エラーコード
 * @param message エラーメッセージ
 * @param cause 原因となったエラー（オプション）
 * @returns 同期エラーオブジェクト
 */
export function createSyncError(
  type: SyncErrorCode,
  message: string,
  cause?: Error,
): SyncError {
  return {
    name: "SyncError",
    type,
    message,
    cause,
  };
}

// 共有カーネルのRepositoryErrorを再エクスポート
export type { RepositoryError, RepositoryErrorCode };
