import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type {
  StartBlueskyAuthInput,
  StartBlueskyAuthUseCase,
} from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";

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
          new AccountError(
            AccountErrorCode.AUTHORIZATION_FAILED,
            "Blueskyの認証URLの取得に失敗しました",
            error,
          ),
      );
  }
}
