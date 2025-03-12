import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { User } from "../models/user";
import type { UserRepository } from "../repositories/user";

/**
 * ユーザーID取得のユースケース
 */
export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * IDによるユーザー取得
   * @param id ユーザーID
   * @returns ユーザーまたはnull
   */
  async execute(id: ID): Promise<Result<User | null, RepositoryError>> {
    return await this.userRepository.findById(id);
  }
}
