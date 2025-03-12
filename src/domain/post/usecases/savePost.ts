import type { Result } from "neverthrow";
import type { Post } from "../models/post";
import type { PostRepository } from "../repositories/post";
import type { RepositoryError } from "../models/errors";

/**
 * 投稿保存のユースケース
 */
export class SavePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * 投稿の保存
   * @param post 投稿オブジェクト
   * @returns 保存された投稿
   */
  async execute(post: Post): Promise<Result<Post, RepositoryError>> {
    return await this.postRepository.save(post);
  }
} 