import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Post } from "../models/post";
import type { PostRepository } from "../repositories/post";
import type { RepositoryError } from "../models/errors";

/**
 * 投稿取得のユースケース
 */
export class GetPostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * IDによる投稿取得
   * @param id 投稿ID
   * @returns 投稿またはnull
   */
  async execute(id: ID): Promise<Result<Post | null, RepositoryError>> {
    return await this.postRepository.findById(id);
  }
} 