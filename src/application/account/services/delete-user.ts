import type { UserRepository } from "@/domain/account/repositories/user-repository";
import type { DeleteUserInput, DeleteUserUseCase } from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { Result } from "@/lib/result";
import { logger } from "@/lib/logger";

/**
 * ユーザーを削除するユースケース実装
 */
export class DeleteUserService implements DeleteUserUseCase {
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
  async execute(input: DeleteUserInput): Promise<Result<void, AccountError>> {
    logger.info("Deleting user", {
      userId: input.userId,
    });

    // ユーザーを削除
    return (await this.userRepository.delete(input.userId))
      .map((_value) => {
        logger.info("Successfully deleted user", {
          userId: input.userId,
        });
      })
      .mapErr((error) => {
        logger.error("Failed to delete user", {
          error,
          userId: input.userId,
        });
        return new AccountError(
          AccountErrorCode.USER_NOT_FOUND,
          "ユーザーの削除に失敗しました",
          error,
        );
      });
  }
}
