import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { GitHubConnection } from "../models/user";
import type { UserRepository } from "../repositories/user";

/**
 * GitHub連携情報追加のユースケース
 */
export class AddGitHubConnectionUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * GitHub連携情報の追加
   * @param userId ユーザーID
   * @param connection GitHub連携情報
   * @returns 保存されたGitHub連携情報
   */
  async execute(
    userId: ID,
    connection: GitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    return await this.userRepository.addGitHubConnection(userId, connection);
  }
}
