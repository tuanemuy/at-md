/**
 * ブックの同期状態を表す値オブジェクト
 */
import { z } from "zod";

/**
 * 同期ステータス
 */
export const SyncStatusCode = {
  WAITING: "waiting",
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
    SyncStatusCode.WAITING,
    SyncStatusCode.SYNCED,
    SyncStatusCode.ERROR,
  ]),
});

/**
 * 同期状態の型定義
 */
export type SyncStatus = z.infer<typeof syncStatusSchema>;
