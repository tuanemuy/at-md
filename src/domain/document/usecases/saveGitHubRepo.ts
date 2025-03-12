import type { RepositoryError } from "@/domain/shared/models/common";
import type { Result } from "neverthrow";
import type { GitHubRepo } from "../models/githubRepo";
import type { GitHubRepoRepository } from "../repositories/githubRepo";

/**
 * GitHubリポジトリ保存のユースケース
 */
export class SaveGitHubRepoUseCase {
  constructor(private readonly gitHubRepoRepository: GitHubRepoRepository) {}

  /**
   * GitHubリポジトリの保存
   * @param gitHubRepo GitHubリポジトリオブジェクト
   * @returns 保存されたGitHubリポジトリ
   */
  async execute(
    gitHubRepo: GitHubRepo,
  ): Promise<Result<GitHubRepo, RepositoryError>> {
    return await this.gitHubRepoRepository.save(gitHubRepo);
  }
}
