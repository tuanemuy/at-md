import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { TagRepository } from "../repositories/tag";

/**
 * タグ削除のユースケース
 */
export class DeleteTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * タグの削除
   * @param id タグID
   * @returns void
   */
  async execute(id: ID): Promise<Result<void, RepositoryError>> {
    return await this.tagRepository.delete(id);
  }
}
