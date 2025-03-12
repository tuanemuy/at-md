import type { RepositoryError } from "@/domain/shared/models/common";
import type { Result } from "neverthrow";
import type { DocumentTag } from "../models/tag";
import type { DocumentTagRepository } from "../repositories/tag";

/**
 * 文書タグ保存のユースケース
 */
export class SaveDocumentTagUseCase {
  constructor(private readonly documentTagRepository: DocumentTagRepository) {}

  /**
   * 文書タグの保存
   * @param documentTag 文書タグオブジェクト
   * @returns 保存された文書タグ
   */
  async execute(
    documentTag: DocumentTag,
  ): Promise<Result<DocumentTag, RepositoryError>> {
    return await this.documentTagRepository.save(documentTag);
  }
}
