import type { SessionData } from "@/domain/account/models/session-data";
import type { ExternalServiceError } from "@/domain/types/error";
import type { RequestContext } from "@/domain/types/http";
import type { ResultAsync } from "neverthrow";

export interface SessionManager {
  /**
   * セッションにデータを保存する
   */
  set(
    context: RequestContext,
    data: SessionData,
  ): ResultAsync<void, ExternalServiceError>;

  /**
   * セッションからデータを取得する
   */
  get(context: RequestContext): ResultAsync<SessionData, ExternalServiceError>;

  /**
   * セッションからデータを削除する
   */
  remove(context: RequestContext): ResultAsync<void, ExternalServiceError>;
}
