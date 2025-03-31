import type { UserRepository } from "@/domain/account/repositories/user-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { UpdateProfileInput, UpdateProfileUseCase } from "../usecase";

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
  execute(input: UpdateProfileInput) {
    return this.userRepository
      .update({
        id: input.userId,
        ...input,
      })
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "UpdateProfile",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to update profile",
            error,
          ),
      );
  }
}
