import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";
import type { Document } from "../models/document";
import type { DocumentRepository } from "../repositories/document";

/**
 * 文書取得のユースケース
 */
export class GetDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  /**
   * IDによる文書取得
   * @param id 文書ID
   * @returns 文書またはnull
   */
  async execute(id: ID): Promise<Result<Document | null, RepositoryError>> {
    return await this.documentRepository.findById(id);
  }
}
