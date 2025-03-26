import { getIronSession } from "iron-session";
import { type Result, ok, err } from "@/lib/result";
import type { RequestContext } from "@/domain/types/http";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { SessionData } from "@/domain/account/models/session-data";
import type { SessionManager } from "@/domain/account/adapters/session-manager";

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
  async set(
    context: RequestContext,
    data: SessionData,
  ): Promise<Result<void, ExternalServiceError>> {
    try {
      const clientSession = await getIronSession<SessionData>(
        context.req,
        context.res,
        {
          cookieName: "sid",
          password: this.secret,
        },
      );
      clientSession.did = data.did;
      await clientSession.save();
      return ok();
    } catch (error) {
      return err(
        new ExternalServiceError(
          "SessionManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save session data",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * セッションからデータを取得する
   */
  async get(
    context: RequestContext,
  ): Promise<Result<SessionData, ExternalServiceError>> {
    try {
      const clientSession = await getIronSession<SessionData>(
        context.req,
        context.res,
        {
          cookieName: "sid",
          password: this.secret,
        },
      );
      return ok(clientSession);
    } catch (error) {
      return err(
        new ExternalServiceError(
          "SessionManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save session data",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * セッションからデータを削除する
   */
  async remove(
    context: RequestContext,
  ): Promise<Result<void, ExternalServiceError>> {
    try {
      const clientSession = await getIronSession<SessionData>(
        context.req,
        context.res,
        {
          cookieName: "sid",
          password: this.secret,
        },
      );
      clientSession.destroy();
      return ok();
    } catch (error) {
      return err(
        new ExternalServiceError(
          "SessionManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save session data",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}
