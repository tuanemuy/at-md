import type { SessionData } from "@/domain/account/models/session-data";
import type { ExternalServiceError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";

export interface SessionManager<T> {
  /**
   * セッションにデータを保存する
   */
  set(context: T, data: SessionData): ResultAsync<void, ExternalServiceError>;

  /**
   * セッションからデータを取得する
   */
  get(context: T): ResultAsync<SessionData, ExternalServiceError>;

  /**
   * セッションからデータを削除する
   */
  remove(context: T): ResultAsync<void, ExternalServiceError>;
}
