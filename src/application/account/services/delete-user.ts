import type { UserRepository } from "@/domain/account/repositories/user-repository";
import type { DeleteUserInput, DeleteUserUseCase } from "../usecase";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";

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
