import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { Document } from "../models/document";
import type { DocumentRepository } from "../repositories/document";

/**
 * GitHubリポジトリに関連する文書を取得するユースケース
 */
export class GetDocumentsByGitHubRepoUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  /**
   * GitHubリポジトリIDによる文書取得
   * @param gitHubRepoId GitHubリポジトリID
   * @returns 文書の配列
   */
  async execute(
    gitHubRepoId: ID,
  ): Promise<Result<Document[], RepositoryError>> {
    return await this.documentRepository.findByGitHubRepo(gitHubRepoId);
  }
}
