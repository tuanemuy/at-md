import type { UserRepository } from "@/domain/account/repositories/user-repository";
import type { GetUserByIdInput, GetUserByIdUseCase } from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import type { Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import type { User } from "@/domain/account/models/user";

/**
 * ユーザー情報を取得するユースケース実装
 */
export class GetUserByIdService implements GetUserByIdUseCase {
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
  async execute(input: GetUserByIdInput): Promise<Result<User, AccountError>> {
    logger.info("Getting user by ID", {
      userId: input.userId,
    });

    return (await this.userRepository.findById(input.userId))
      .andTee((value) => {
        logger.info("Successfully got user", {
          userId: value.id,
        });
      })
      .mapErr((error) => {
        logger.error("Failed to get user", {
          error,
          userId: input.userId,
        });
        return new AccountError(
          AccountErrorCode.USER_NOT_FOUND,
          "ユーザーの取得に失敗しました",
          error,
        );
      });
  }
}
