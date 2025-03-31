import type { SessionManager } from "@/domain/account/adapters/session-manager";
import type { SessionData } from "@/domain/account/models/session-data";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { RequestContext } from "@/domain/types/http";
import { ResultAsync } from "@/lib/result";
import { getIronSession } from "iron-session";

export class DefaultSessionManager implements SessionManager {
  private readonly secret: string;

  constructor(params: {
    config: {
      secret: string;
    };
  }) {
    this.secret = params.config.secret;
  }

  /**
   * セッションにデータを保存する
   */
  set(context: RequestContext, data: SessionData) {
    return ResultAsync.fromPromise(
      getIronSession<SessionData>(context.req, context.res, {
        cookieName: "sid",
        password: this.secret,
      }),
      (error) =>
        new ExternalServiceError(
          "SessionManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save session data",
          error instanceof Error ? error : undefined,
        ),
    )
      .andTee((clientSession) => {
        clientSession.did = data.did;
      })
      .andThen((clientSession) =>
        ResultAsync.fromPromise(
          clientSession.save(),
          (error) =>
            new ExternalServiceError(
              "SessionManager",
              ExternalServiceErrorCode.REQUEST_FAILED,
              "Failed to save session data",
              error instanceof Error ? error : undefined,
            ),
        ),
      );
  }

  /**
   * セッションからデータを取得する
   */
  get(context: RequestContext) {
    return ResultAsync.fromPromise(
      getIronSession<SessionData>(context.req, context.res, {
        cookieName: "sid",
        password: this.secret,
      }),
      (error) =>
        new ExternalServiceError(
          "SessionManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save session data",
          error instanceof Error ? error : undefined,
        ),
    ).map((clientSession) => clientSession);
  }

  /**
   * セッションからデータを削除する
   */
  remove(context: RequestContext) {
    return ResultAsync.fromPromise(
      getIronSession<SessionData>(context.req, context.res, {
        cookieName: "sid",
        password: this.secret,
      }),
      (error) =>
        new ExternalServiceError(
          "SessionManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save session data",
          error instanceof Error ? error : undefined,
        ),
    ).map((clientSession) => {
      clientSession.destroy();
    });
  }
}
