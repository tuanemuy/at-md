import type { RepositoryError } from "@/domain/shared/models/common";
import type { Result } from "neverthrow";
import type { User } from "../models/user";
import type { UserRepository } from "../repositories/user";

/**
 * ユーザー保存のユースケース
 */
export class SaveUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * ユーザーの保存
   * @param user ユーザーオブジェクト
   * @returns 保存されたユーザー
   */
  async execute(user: User): Promise<Result<User, RepositoryError>> {
    return await this.userRepository.save(user);
  }
} 