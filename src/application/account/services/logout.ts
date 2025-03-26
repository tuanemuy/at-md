import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { Result } from "@/lib/result";
import { logger } from "@/lib/logger";
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
  async execute(input: LogoutInput): Promise<Result<void, AccountError>> {
    logger.info("Executing logout");

    return (await this.sessionManager.remove(input.context))
      .map((_value) => {
        logger.info("Session was found");
      })
      .mapErr((error) => {
        return new AccountError(
          AccountErrorCode.SESSION_REVOCATION_FAILED,
          "セッションを削除できませんでした",
          error,
        );
      });
  }
}
