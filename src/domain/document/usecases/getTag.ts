import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { Tag } from "../models/tag";
import type { TagRepository } from "../repositories/tag";

/**
 * タグ取得のユースケース
 */
export class GetTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * IDによるタグ取得
   * @param id タグID
   * @returns タグまたはnull
   */
  async execute(id: ID): Promise<Result<Tag | null, RepositoryError>> {
    return await this.tagRepository.findById(id);
  }
}
