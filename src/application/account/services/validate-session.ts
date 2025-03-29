import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { SessionManager } from "@/domain/account/adapters/session-manager";
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
          new AccountError(
            AccountErrorCode.SESSION_VALIDATION_FAILED,
            "セッションの検証に失敗しました",
            error,
          ),
      );
  }
}
