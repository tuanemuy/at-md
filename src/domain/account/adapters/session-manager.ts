import type { Result } from "@/lib/result";
import type { RequestContext } from "@/domain/types/http";
import type { ExternalServiceError } from "@/domain/types/error";
import type { SessionData } from "@/domain/account/models/session-data";

export interface SessionManager {
  /**
   * セッションにデータを保存する
   */
  set(
    context: RequestContext,
    data: SessionData,
  ): Promise<Result<void, ExternalServiceError>>;

  /**
   * セッションからデータを取得する
   */
  get(
    context: RequestContext,
  ): Promise<Result<SessionData, ExternalServiceError>>;

  /**
   * セッションからデータを削除する
   */
  remove(context: RequestContext): Promise<Result<void, ExternalServiceError>>;
}
