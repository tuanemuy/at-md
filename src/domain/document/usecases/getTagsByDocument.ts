import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { Tag } from "../models/tag";
import type { TagRepository } from "../repositories/tag";

/**
 * 文書に関連するタグを取得するユースケース
 */
export class GetTagsByDocumentUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * 文書IDによるタグ取得
   * @param documentId 文書ID
   * @returns タグの配列
   */
  async execute(documentId: ID): Promise<Result<Tag[], RepositoryError>> {
    return await this.tagRepository.findByDocumentId(documentId);
  }
}
