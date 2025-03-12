import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Post } from "../models/post";
import type { PostRepository } from "../repositories/post";
import type { RepositoryError } from "../models/errors";

/**
 * 文書IDによる投稿取得のユースケース
 */
export class GetPostsByDocumentUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * 文書IDによる投稿取得
   * @param documentId 文書ID
   * @returns 投稿の配列
   */
  async execute(documentId: ID): Promise<Result<Post[], RepositoryError>> {
    const result = await this.postRepository.findByDocumentId(documentId);
    if (result.isErr()) {
      return err(result.error);
    }

    const post = result.value;
    return ok(post ? [post] : []);
  }
}
