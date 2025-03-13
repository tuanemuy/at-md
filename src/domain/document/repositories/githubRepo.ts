import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { GitHubRepo } from "../models/githubRepo";
import type { RepositoryError } from "@/domain/shared/models/common";

/**
 * GitHubリポジトリリポジトリのインターフェース
 */
export interface GitHubRepoRepository {
  /**
   * IDによるGitHubリポジトリ検索
   * @param id GitHubリポジトリID
   * @returns GitHubリポジトリまたはnull
   */
  findById(id: ID): Promise<Result<GitHubRepo | null, RepositoryError>>;

  /**
   * フルネームによるGitHubリポジトリ検索
   * @param fullName リポジトリのフルネーム（owner/name）
   * @returns GitHubリポジトリまたはnull
   */
  findByFullName(
    fullName: string,
  ): Promise<Result<GitHubRepo | null, RepositoryError>>;

  /**
   * ユーザーIDによるGitHubリポジトリ検索
   * @param userId ユーザーID
   * @returns GitHubリポジトリの配列
   */
  findByUserId(userId: ID): Promise<Result<GitHubRepo[], RepositoryError>>;

  /**
   * GitHubリポジトリの保存
   * @param gitHubRepo GitHubリポジトリオブジェクト
   * @returns 保存されたGitHubリポジトリ
   */
  save(gitHubRepo: GitHubRepo): Promise<Result<GitHubRepo, RepositoryError>>;

  /**
   * GitHubリポジトリの削除
   * @param id GitHubリポジトリID
   * @returns void
   */
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}
