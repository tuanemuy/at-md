import type { RepositoryError } from "@/domain/shared/models/common";
import type { Result } from "neverthrow";
import type { Document } from "../models/document";
import type { DocumentRepository } from "../repositories/document";

/**
 * 文書保存のユースケース
 */
export class SaveDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  /**
   * 文書の保存
   * @param document 文書オブジェクト
   * @returns 保存された文書
   */
  async execute(
    document: Document,
  ): Promise<Result<Document, RepositoryError>> {
    return await this.documentRepository.save(document);
  }
}
