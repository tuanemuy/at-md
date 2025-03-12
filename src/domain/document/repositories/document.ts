import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Document } from "../models/document";
import type { RepositoryError } from "@/domain/shared/models/common";

/**
 * 文書リポジトリのインターフェース
 */
export interface DocumentRepository {
  /**
   * IDによる文書検索
   * @param id 文書ID
   * @returns 文書またはnull
   */
  findById(id: ID): Promise<Result<Document | null, RepositoryError>>;

  /**
   * GitHubリポジトリとパスによる文書検索
   * @param gitHubRepoId GitHubリポジトリID
   * @param path ファイルパス
   * @returns 文書またはnull
   */
  findByGitHubRepoAndPath(
    gitHubRepoId: ID,
    path: string,
  ): Promise<Result<Document | null, RepositoryError>>;

  /**
   * GitHubリポジトリによる文書検索
   * @param gitHubRepoId GitHubリポジトリID
   * @returns 文書の配列
   */
  findByGitHubRepo(
    gitHubRepoId: ID,
  ): Promise<Result<Document[], RepositoryError>>;

  /**
   * 文書の保存
   * @param document 文書オブジェクト
   * @returns 保存された文書
   */
  save(document: Document): Promise<Result<Document, RepositoryError>>;
}
