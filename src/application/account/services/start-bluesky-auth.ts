import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type {
  StartBlueskyAuthInput,
  StartBlueskyAuthUseCase,
} from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { Result } from "@/lib/result";
import { logger } from "@/lib/logger";

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
  async execute(
    input: StartBlueskyAuthInput,
  ): Promise<Result<URL, AccountError>> {
    logger.info("Starting Bluesky auth process", {
      handle: input.handle,
    });
    return (await this.authProvider.authorize(input.handle))
      .andTee(() => {
        logger.info("Successfully generated Bluesky auth URL", {
          handle: input.handle,
        });
      })
      .mapErr((error) => {
        logger.error("Failed to get Bluesky auth URL", {
          error,
          handle: input.handle,
        });

        return new AccountError(
          AccountErrorCode.AUTHORIZATION_FAILED,
          "Blueskyの認証URLの取得に失敗しました",
          error,
        );
      });
  }
}
