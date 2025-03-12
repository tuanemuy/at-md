import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { DocumentTagRepository } from "../repositories/tag";

/**
 * 文書IDとタグIDによる文書タグ削除のユースケース
 */
export class DeleteDocumentTagByDocumentIdAndTagIdUseCase {
  constructor(private readonly documentTagRepository: DocumentTagRepository) {}

  /**
   * 文書IDとタグIDによる文書タグの削除
   * @param documentId 文書ID
   * @param tagId タグID
   * @returns void
   */
  async execute(
    documentId: ID,
    tagId: ID,
  ): Promise<Result<void, RepositoryError>> {
    return await this.documentTagRepository.deleteByDocumentIdAndTagId(
      documentId,
      tagId,
    );
  }
}
