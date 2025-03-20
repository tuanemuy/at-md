/**
 * ブックの同期状態を表す値オブジェクト
 */
import { z } from "zod";

/**
 * 同期ステータス
 */
export const SyncStatusCode = {
  SYNCING: "syncing",
  SYNCED: "synced",
  ERROR: "error",
} as const;

export type SyncStatusCode =
  (typeof SyncStatusCode)[keyof typeof SyncStatusCode];

/**
 * 同期状態のZodスキーマ
 */
export const syncStatusSchema = z.object({
  lastSyncedAt: z.date().nullable(),
  status: z.enum([
    SyncStatusCode.SYNCING,
    SyncStatusCode.SYNCED,
    SyncStatusCode.ERROR,
  ]),
});

/**
 * 同期状態の型定義
 */
export type SyncStatus = z.infer<typeof syncStatusSchema>;

/**
 * 同期中かどうかを判定する
 */
export function isSyncing(syncStatus: SyncStatus): boolean {
  return syncStatus.status === SyncStatusCode.SYNCING;
}

/**
 * 同期エラーかどうかを判定する
 */
export function isSyncError(syncStatus: SyncStatus): boolean {
  return syncStatus.status === SyncStatusCode.ERROR;
}
