import type { RepositoryError } from "@/domain/shared/models/common";
import type { Result } from "neverthrow";
import type { Tag } from "../models/tag";
import type { TagRepository } from "../repositories/tag";

/**
 * タグ保存のユースケース
 */
export class SaveTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * タグの保存
   * @param tag タグオブジェクト
   * @returns 保存されたタグ
   */
  async execute(tag: Tag): Promise<Result<Tag, RepositoryError>> {
    return await this.tagRepository.save(tag);
  }
}
