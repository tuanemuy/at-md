import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Post } from "../models/post";
import type { PostRepository } from "../repositories/post";
import type { RepositoryError } from "../models/errors";

/**
 * ユーザーIDによる投稿取得のユースケース
 */
export class GetPostsByUserUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * ユーザーIDによる投稿取得
   * @param userId ユーザーID
   * @returns 投稿の配列
   */
  async execute(userId: ID): Promise<Result<Post[], RepositoryError>> {
    return await this.postRepository.findByUserId(userId);
  }
}
