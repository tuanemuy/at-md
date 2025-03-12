import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { GitHubRepo } from "../models/githubRepo";
import type { GitHubRepoRepository } from "../repositories/githubRepo";

/**
 * ユーザーに関連するGitHubリポジトリを取得するユースケース
 */
export class GetGitHubReposByUserUseCase {
  constructor(private readonly gitHubRepoRepository: GitHubRepoRepository) {}

  /**
   * ユーザーIDによるGitHubリポジトリ取得
   * @param userId ユーザーID
   * @returns GitHubリポジトリの配列
   */
  async execute(userId: ID): Promise<Result<GitHubRepo[], RepositoryError>> {
    return await this.gitHubRepoRepository.findByUserId(userId);
  }
}
