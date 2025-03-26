import type { UserRepository } from "@/domain/account/repositories/user-repository";
import type { UpdateProfileInput, UpdateProfileUseCase } from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import type { User } from "@/domain/account/models/user";

/**
 * ユーザープロフィールを更新するユースケース実装
 */
export class UpdateProfileService implements UpdateProfileUseCase {
  private readonly userRepository: UserRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      userRepository: UserRepository;
    };
  }) {
    this.userRepository = params.deps.userRepository;
  }

  /**
   * ユースケースを実行する
   */
  async execute(
    input: UpdateProfileInput,
  ): Promise<Result<User, AccountError>> {
    logger.info("Updating user profile", {
      userId: input.userId,
    });

    // プロフィールを更新
    return (
      await this.userRepository.update({
        id: input.userId,
        ...input,
      })
    )
      .andTee((value) => {
        logger.info("Successfully updated user profile", {
          userId: value.id,
        });
      })
      .mapErr((error) => {
        logger.error("Failed to update user profile", {
          error,
          userId: input.userId,
        });
        return new AccountError(
          AccountErrorCode.UPDATE_FAILED,
          "プロフィールの更新に失敗しました",
          error,
        );
      });
  }
}
