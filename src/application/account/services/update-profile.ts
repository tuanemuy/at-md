import type { UserRepository } from "@/domain/account/repositories/user-repository";
import type { UpdateProfileInput, UpdateProfileUseCase } from "../usecase";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";

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
          new AccountError(
            AccountErrorCode.UPDATE_FAILED,
            "プロフィールの更新に失敗しました",
            error,
          ),
      );
  }
}
