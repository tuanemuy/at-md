import type { UserRepository } from "@/domain/account/repositories/user-repository";
import type { GetUserByIdInput, GetUserByIdUseCase } from "../usecase";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";

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
          new ApplicationServiceError(
            "GetUserById",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to get user",
            error,
          ),
      );
  }
}
