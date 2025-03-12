import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Post } from "../models/post";
import type { PostRepository } from "../repositories/post";
import type { PostService } from "../services/post";
import type { PostError, RepositoryError } from "../models/errors";
import { createPostError } from "../models/errors";
import { publishPost } from "../models/post";

/**
 * 投稿公開のユースケース
 */
export class PublishPostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postService: PostService,
  ) {}

  /**
   * 投稿の公開
   * @param id 投稿ID
   * @returns 公開された投稿
   */
  async execute(id: ID): Promise<Result<Post, PostError | RepositoryError>> {
    // 投稿を取得
    const postResult = await this.postRepository.findById(id);
    if (postResult.isErr()) {
      return err(postResult.error);
    }

    const post = postResult.value;
    if (!post) {
      return err(createPostError("API_ERROR", `投稿が見つかりません: ${id}`));
    }

    // すでに公開済みの場合は再公開しない
    if (post.status === "published") {
      return ok(post);
    }

    // Blueskyでの投稿ステータスを確認
    const statusResult = await this.postService.getPostStatus(id);
    if (statusResult.isErr()) {
      return err(statusResult.error);
    }

    const status = statusResult.value;

    // 投稿が公開されている場合はURIを取得して更新
    if (status === "published") {
      // 実際のURIはBlueskyから取得する必要があります
      // ここでは仮のURIを設定
      const uri = `at://${post.userId}/app.bsky.feed.post/${id}`;

      // 投稿を公開済みに更新
      const updatedPost = publishPost(post, uri);

      // 更新された投稿を保存
      const updateResult = await this.postRepository.updateStatus(
        id,
        "published",
        undefined,
      );

      if (updateResult.isErr()) {
        return err(updateResult.error);
      }

      return ok(updateResult.value);
    }

    if (status === "failed") {
      // 失敗した場合はエラーを返す
      return err(createPostError("API_ERROR", "Blueskyへの投稿に失敗しました"));
    }

    // まだ処理中の場合
    return ok(post);
  }
}
