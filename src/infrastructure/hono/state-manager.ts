import type { StateManager } from "@/domain/account/adapters/state-manager";
import {
  type StateData,
  stateDataSchema,
} from "@/domain/account/models/state-data";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { RequestContext } from "@/domain/types/http";
import { validate } from "@/domain/types/validation";
import { ResultAsync } from "@/lib/result";
import { getIronSession } from "iron-session";

export class HonoStateManager implements StateManager<RequestContext> {
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
  set(context: RequestContext, data: StateData) {
    return ResultAsync.fromPromise(
      getIronSession<StateData>(context.req, context.res, {
        cookieName: "state",
        password: this.secret,
      }),
      (error) =>
        new ExternalServiceError(
          "StateManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save state data",
          error instanceof Error ? error : undefined,
        ),
    )
      .andTee((clientState) => {
        clientState.state = data.state;
      })
      .andThen((clientState) =>
        ResultAsync.fromPromise(
          clientState.save(),
          (error) =>
            new ExternalServiceError(
              "StateManager",
              ExternalServiceErrorCode.REQUEST_FAILED,
              "Failed to save state data",
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
      getIronSession<StateData>(context.req, context.res, {
        cookieName: "state",
        password: this.secret,
      }),
      (error) =>
        new ExternalServiceError(
          "StateManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save state data",
          error instanceof Error ? error : undefined,
        ),
    )
      .andThen((clientState) => validate(stateDataSchema, clientState))
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "StateManager",
            ExternalServiceErrorCode.RESPONSE_INVALID,
            "Failed to validate state data",
            error instanceof Error ? error : undefined,
          ),
      );
  }

  /**
   * セッションからデータを削除する
   */
  remove(context: RequestContext) {
    return ResultAsync.fromPromise(
      getIronSession<StateData>(context.req, context.res, {
        cookieName: "state",
        password: this.secret,
      }),
      (error) =>
        new ExternalServiceError(
          "StateManager",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to save state data",
          error instanceof Error ? error : undefined,
        ),
    ).map((clientState) => {
      clientState.destroy();
    });
  }
}
