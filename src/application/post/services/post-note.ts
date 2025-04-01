import type { BlueskyPostProvider } from "@/domain/post/adapters";
import type { PostRepository } from "@/domain/post/repositories";
import { PostStatus } from "@/domain/post/models/post";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import type { PostNoteInput, PostNoteUseCase } from "../usecase";

/**
 * ノートを投稿するユースケース実装
 */
export class PostNoteService implements PostNoteUseCase {
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
  execute(input: PostNoteInput) {
    return this.blueskyPostProvider
      .createPost(input.did, input.text)
      .andThen((blueskyPost) =>
        this.postRepository.create({
          userId: input.userId,
          noteId: input.noteId,
          status: PostStatus.POSTED,
          platform: "bluesky",
          postUri: blueskyPost.uri,
          postCid: blueskyPost.cid,
          errorMessage: null,
        }),
      )
      .orTee(async (error) => {
        await this.postRepository.create({
          userId: input.userId,
          noteId: input.noteId,
          status: PostStatus.ERROR,
          platform: "bluesky",
          postUri: null,
          postCid: null,
          errorMessage: error.message,
        });
      })
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "PostNote",
            ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
            "Failed to post note to Bluesky",
            error,
          ),
      );
  }
}

