import type { BlueskyPostProvider } from "@/domain/post/adapters";
import type { PostRepository } from "@/domain/post/repositories";
import { PostStatus } from "@/domain/post/models/post";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { RetryPostInput, RetryPostUseCase } from "../usecase";

/**
 * 投稿を再試行するユースケース実装
 */
export class RetryPostService implements RetryPostUseCase {
  private readonly postRepository: PostRepository;
  private readonly blueskyPostProvider: BlueskyPostProvider;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      postRepository: PostRepository;
      blueskyPostProvider: BlueskyPostProvider;
    };
  }) {
    this.postRepository = params.deps.postRepository;
    this.blueskyPostProvider = params.deps.blueskyPostProvider;
  }

  /**
   * ユースケースを実行する
   */
  execute(input: RetryPostInput) {
    return this.postRepository
      .findByNoteId(input.noteId)
      .andThen((existingPost) =>
        this.blueskyPostProvider
          .createPost(input.did, input.text)
          .map((post) => ({ existingPost, blueskyPost: post })),
      )
      .andThen(({ existingPost, blueskyPost }) =>
        this.postRepository.update({
          id: existingPost.id,
          userId: existingPost.userId,
          noteId: existingPost.noteId,
          status: PostStatus.POSTED,
          postUri: blueskyPost.uri,
          postCid: blueskyPost.cid,
          errorMessage: null,
        }),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "RetryPost",
            ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
            "Failed to retry post to Bluesky",
            error,
          ),
      );
  }
}

