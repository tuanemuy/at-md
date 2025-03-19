import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { RepositoryErrorCode } from "@/domain/types/error";
import * as schema from "./schema";

export type PgDatabase = ReturnType<typeof drizzle<typeof schema>>;

const client = new PGlite(process.env.DATABASE_URL || undefined);
export const db = drizzle(client, { schema });

interface DatabaseError {
  code: string;
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if ("code" in value) {
    return true;
  }

  return false;
}

/**
 * データベースエラーコードをリポジトリエラーコードに変換する
 * 
 * PostgreSQLのエラーコードについて：
 * - クラス 08: 接続例外
 * - クラス 22: データ例外
 * - クラス 23: 整合性制約違反
 * - クラス 25: 無効なトランザクション状態
 * - クラス 40: トランザクションのロールバック
 * - クラス 42: 構文エラーまたはアクセス規則違反
 * - クラス 58: 外部データラッパーのエラー（システムエラー）
 * 
 * @param code PostgreSQLエラーコード
 * @returns 対応するリポジトリエラーコード
 */
export function codeToRepositoryErrorCode(code?: string): RepositoryErrorCode {
  if (!code) {
    return RepositoryErrorCode.UNKNOWN_ERROR;
  }

  // 接頭辞でエラークラスを特定
  const prefix = code.substring(0, 2);

  // 特定のエラーコードの優先的な処理
  if (code === "23505") {
    return RepositoryErrorCode.UNIQUE_VIOLATION;
  }

  // エラークラスによる分類
  switch (prefix) {
    case "08": // 接続例外
      return RepositoryErrorCode.CONNECTION_ERROR;
    case "22": // データ例外
      return RepositoryErrorCode.DATA_ERROR;
    case "23": // 整合性制約違反
      return RepositoryErrorCode.CONSTRAINT_VIOLATION;
    case "25": // 無効なトランザクション状態
      return RepositoryErrorCode.TRANSACTION_ERROR;
    case "40": // トランザクションのロールバック
      return RepositoryErrorCode.TRANSACTION_ROLLBACK_ERROR;
    case "42": // 構文エラーまたはアクセス規則違反
      return RepositoryErrorCode.SYNTAX_OR_ACCESS_ERROR;
    case "58": // 外部データラッパーのエラー（システムエラー）
      return RepositoryErrorCode.SYSTEM_ERROR;
    default:
      return RepositoryErrorCode.UNKNOWN_ERROR;
  }
}
