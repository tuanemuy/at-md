import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { SessionManager } from "@/domain/account/adapters/session-manager";
import type { LogoutInput, LogoutUseCase } from "../usecase";

/**
 * ログアウトのユースケース実装
 */
export class LogoutService implements LogoutUseCase {
  private readonly sessionManager: SessionManager;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      sessionManager: SessionManager;
    };
  }) {
    this.sessionManager = params.deps.sessionManager;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: LogoutInput) {
    return this.sessionManager
      .remove(input.context)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "Logout",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to logout",
            error,
          ),
      );
  }
}
