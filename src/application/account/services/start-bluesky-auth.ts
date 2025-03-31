import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type {
  StartBlueskyAuthInput,
  StartBlueskyAuthUseCase,
} from "../usecase";

/**
 * Bluesky認証を開始するユースケース実装
 */
export class StartBlueskyAuthService implements StartBlueskyAuthUseCase {
  private readonly authProvider: BlueskyAuthProvider;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      authProvider: BlueskyAuthProvider;
    };
  }) {
    this.authProvider = params.deps.authProvider;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: StartBlueskyAuthInput) {
    return this.authProvider
      .authorize(input.handle)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "StartBlueskyAuth",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to start Bluesky auth",
            error,
          ),
      );
  }
}
