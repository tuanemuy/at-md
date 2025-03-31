import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { SessionManager } from "@/domain/account/adapters/session-manager";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { ValidateSessionInput, ValidateSessionUseCase } from "../usecase";

/**
 * セッションを検証するユースケース実装
 */
export class ValidateSessionService implements ValidateSessionUseCase {
  private readonly authProvider: BlueskyAuthProvider;
  private readonly sessionManager: SessionManager;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      authProvider: BlueskyAuthProvider;
      sessionManager: SessionManager;
    };
  }) {
    this.authProvider = params.deps.authProvider;
    this.sessionManager = params.deps.sessionManager;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: ValidateSessionInput) {
    return this.sessionManager
      .get(input.context)
      .andThen((sessionData) =>
        this.authProvider.validateSession(sessionData.did),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ValidateSession",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to validate session",
            error,
          ),
      );
  }
}
