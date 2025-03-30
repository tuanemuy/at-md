import { okAsync } from "@/lib/result";
import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { UserRepository } from "@/domain/account/repositories/user-repository";
import type {
  HandleBlueskyAuthCallbackInput,
  HandleBlueskyAuthCallbackUseCase,
} from "../usecase";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";

/**
 * Bluesky認証のコールバックを処理するユースケース実装
 */
export class HandleBlueskyAuthCallbackService
  implements HandleBlueskyAuthCallbackUseCase
{
  private readonly authProvider: BlueskyAuthProvider;
  private readonly userRepository: UserRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      authProvider: BlueskyAuthProvider;
      userRepository: UserRepository;
    };
  }) {
    this.authProvider = params.deps.authProvider;
    this.userRepository = params.deps.userRepository;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: HandleBlueskyAuthCallbackInput) {
    return this.authProvider
      .callback(input.params)
      .andThen((did) =>
        this.userRepository
          .findByDid(did)
          .map((user) => ({ did, user }))
          .orElse(() => okAsync({ did, user: null })),
      )
      .andThen(({ did, user }) =>
        this.authProvider
          .getUserProfile(did)
          .map((profile) => ({ did, user, profile })),
      )
      .andThen(({ did, user, profile }) =>
        !user
          ? this.userRepository.create({
              did,
              profile,
            })
          : okAsync(),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "HandleBlueskyAuthCallback",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to handle Bluesky auth callback",
            error,
          ),
      )
      .map(() => {});
  }
}
