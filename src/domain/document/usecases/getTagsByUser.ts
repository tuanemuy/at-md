import type { RepositoryError } from "@/domain/shared/models/common";
import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { Tag } from "../models/tag";
import type { TagRepository } from "../repositories/tag";

/**
 * ユーザーに関連するタグを取得するユースケース
 */
export class GetTagsByUserUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * ユーザーIDによるタグ取得
   * @param userId ユーザーID
   * @returns タグの配列
   */
  async execute(userId: ID): Promise<Result<Tag[], RepositoryError>> {
    return await this.tagRepository.findByUserId(userId);
  }
}
