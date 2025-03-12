import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { GitHubRepo } from "../models/githubRepo";
import type { GitHubRepoRepository } from "../repositories/githubRepo";

/**
 * GitHubリポジトリ取得のユースケース
 */
export class GetGitHubRepoUseCase {
  constructor(private readonly gitHubRepoRepository: GitHubRepoRepository) {}

  /**
   * IDによるGitHubリポジトリ取得
   * @param id GitHubリポジトリID
   * @returns GitHubリポジトリまたはnull
   */
  async execute(id: ID): Promise<Result<GitHubRepo | null, RepositoryError>> {
    return await this.gitHubRepoRepository.findById(id);
  }
}
