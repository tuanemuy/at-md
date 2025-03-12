import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { DocumentTagRepository } from "../repositories/tag";

/**
 * 文書タグ削除のユースケース
 */
export class DeleteDocumentTagUseCase {
  constructor(private readonly documentTagRepository: DocumentTagRepository) {}

  /**
   * 文書タグの削除
   * @param id 文書タグID
   * @returns void
   */
  async execute(id: ID): Promise<Result<void, RepositoryError>> {
    return await this.documentTagRepository.delete(id);
  }
}
