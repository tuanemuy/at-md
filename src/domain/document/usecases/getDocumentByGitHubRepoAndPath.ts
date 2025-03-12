import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { Document } from "../models/document";
import type { DocumentRepository } from "../repositories/document";

/**
 * GitHubリポジトリとパスによる文書取得のユースケース
 */
export class GetDocumentByGitHubRepoAndPathUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  /**
   * GitHubリポジトリIDとパスによる文書取得
   * @param gitHubRepoId GitHubリポジトリID
   * @param path ファイルパス
   * @returns 文書またはnull
   */
  async execute(
    gitHubRepoId: ID,
    path: string,
  ): Promise<Result<Document | null, RepositoryError>> {
    return await this.documentRepository.findByGitHubRepoAndPath(
      gitHubRepoId,
      path,
    );
  }
}
