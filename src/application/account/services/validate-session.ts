import type { Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { SessionData } from "@/domain/account/models/session-data";
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
  async execute(
    input: ValidateSessionInput,
  ): Promise<Result<SessionData, AccountError>> {
    const result = (await this.sessionManager.get(input.context)).mapErr(
      (error) => {
        return new AccountError(
          AccountErrorCode.SESSION_NOT_FOUND,
          "セッションが見つかりません",
          error,
        );
      },
    );
    if (result.isErr()) {
      return result;
    }
    const sessionData = result.value;

    return (await this.authProvider.validateSession(sessionData.did))
      .map((_value) => {
        logger.info("Session validated successfully", sessionData);
        return sessionData;
      })
      .mapErr((error) => {
        logger.error("Failed to validate session", {
          error,
          did: sessionData.did,
        });
        return new AccountError(
          AccountErrorCode.SESSION_VALIDATION_FAILED,
          "セッションの検証に失敗しました",
          error,
        );
      });
  }
}
