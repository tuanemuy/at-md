import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { PostRepository } from "../repositories/post";
import type { RepositoryError } from "../models/errors";

/**
 * 投稿削除のユースケース
 */
export class DeletePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * 投稿の削除
   * @param id 投稿ID
   * @returns void
   */
  async execute(id: ID): Promise<Result<void, RepositoryError>> {
    return await this.postRepository.delete(id);
  }
}
