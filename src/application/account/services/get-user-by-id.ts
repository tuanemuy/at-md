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
  execute(input: GetUserByIdInput) {
    return this.userRepository
      .findById(input.userId)
      .mapErr(
        (error) =>
          new AccountError(
            AccountErrorCode.USER_NOT_FOUND,
            "ユーザーの取得に失敗しました",
            error,
          ),
      );
  }
}
