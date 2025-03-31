import type { UserRepository } from "@/domain/account/repositories/user-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { DeleteUserInput, DeleteUserUseCase } from "../usecase";

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
  execute(input: DeleteUserInput) {
    return this.userRepository
      .delete(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "DeleteUser",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to delete user",
            error,
          ),
      );
  }
}
