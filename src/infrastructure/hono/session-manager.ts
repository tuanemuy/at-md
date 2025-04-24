import type { SessionManager } from "@/domain/account/adapters/session-manager";
import {
  type SessionData,
  sessionDataSchema,
} from "@/domain/account/models/session-data";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { RequestContext } from "@/domain/types/http";
import { validate } from "@/domain/types/validation";
import { getIronSession } from "iron-session";
import { ResultAsync } from "neverthrow";

export class HonoSessionManager implements SessionManager<RequestContext> {
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
        clientSession.user = data.user;
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
    )
      .andThen((clientSession) => validate(sessionDataSchema, clientSession))
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "SessionManager",
            ExternalServiceErrorCode.RESPONSE_INVALID,
            "Failed to validate session data",
            error instanceof Error ? error : undefined,
          ),
      );
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
