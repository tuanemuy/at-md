import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { UserRepository } from "@/domain/account/repositories/user-repository";
import type {
  HandleBlueskyAuthCallbackInput,
  HandleBlueskyAuthCallbackUseCase,
} from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import { type Result, ok } from "@/lib/result";
import { logger } from "@/lib/logger";

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
  async execute(
    input: HandleBlueskyAuthCallbackInput,
  ): Promise<Result<void, AccountError>> {
    logger.info("Handling Bluesky auth callback");

    // コールバックを処理してセッション情報を取得
    const callbackResult = (
      await this.authProvider.callback(input.params)
    ).mapErr((error) => {
      logger.error("Failed to handle Bluesky auth callback", {
        error,
      });
      return new AccountError(
        AccountErrorCode.CALLBACK_FAILED,
        "Blueskyの認証コールバック処理に失敗しました",
        error,
      );
    });

    if (callbackResult.isErr()) {
      return callbackResult.map((_value) => {});
    }

    const did = callbackResult.value;

    const existingUserResult = (
      await this.userRepository.findByDid(did)
    ).mapErr((error) => {
      logger.error("Failed to check existing user", {
        error,
        did,
      });
      return new AccountError(
        AccountErrorCode.SESSION_CREATION_FAILED,
        "ユーザー情報の確認に失敗しました",
        error,
      );
    });

    if (existingUserResult.isErr()) {
      return existingUserResult.map((_value) => {});
    }

    if (existingUserResult.value) {
      logger.info("Existing user found, returning session", {
        did,
      });
      return ok();
    }

    // ユーザープロフィールを取得
    const profileResult = (await this.authProvider.getUserProfile(did)).mapErr(
      (error) => {
        logger.error("Failed to get user profile", {
          error,
          did,
        });
        return new AccountError(
          AccountErrorCode.CALLBACK_FAILED,
          "ユーザープロフィールの取得に失敗しました",
          error,
        );
      },
    );

    if (profileResult.isErr()) {
      return profileResult.map((_value) => {});
    }

    const profile = profileResult.value;

    return (
      await this.userRepository.create({
        did,
        profile: {
          displayName: profile.displayName,
          description: profile.description,
          avatarUrl: profile.avatarUrl,
          bannerUrl: profile.bannerUrl,
        },
      })
    )
      .map((value) => {
        logger.info("Successfully created new user and session", {
          userId: value.id,
          did,
        });
      })
      .mapErr((error) => {
        logger.error("Failed to create new user", {
          error,
          did,
        });
        return new AccountError(
          AccountErrorCode.SESSION_CREATION_FAILED,
          "新規ユーザーの作成に失敗しました",
          error,
        );
      });
  }
}
