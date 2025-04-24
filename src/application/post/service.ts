import type { BlueskyPostProvider } from "@/domain/post/adapters";
import { PostStatus } from "@/domain/post/models/post";
import type { PostRepository } from "@/domain/post/repositories";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { logger } from "@/lib/logger";
import type { PostUsecase } from "./usecase";

export class PostService implements PostUsecase {
  private readonly blueskyPostProvider: BlueskyPostProvider;
  private readonly postRepository: PostRepository;

  constructor(params: {
    deps: {
      postRepository: PostRepository;
      blueskyPostProvider: BlueskyPostProvider;
    };
  }) {
    this.postRepository = params.deps.postRepository;
    this.blueskyPostProvider = params.deps.blueskyPostProvider;
  }

  public postNote(input: {
    userId: string;
    bookId: string;
    notePath: string;
    did: string;
    text: string;
  }) {
    return this.blueskyPostProvider
      .createPost(input.did, input.text)
      .andThen((blueskyPost) =>
        this.postRepository.create({
          userId: input.userId,
          bookId: input.bookId,
          notePath: input.notePath,
          status: PostStatus.POSTED,
          platform: "bluesky",
          postUri: blueskyPost.uri,
          postCid: blueskyPost.cid,
        }),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "PostNote",
            ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
            "Failed to post note to Bluesky",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to post note", error));
  }

  public getPost(input: {
    bookId: string;
    notePath: string;
  }) {
    return this.postRepository
      .findByNotePath(input.bookId, input.notePath)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetPost",
            ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
            "投稿情報の取得に失敗しました",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to get post", error));
  }

  public getEngagementByNotePath(input: {
    bookId: string;
    notePath: string;
  }) {
    return this.postRepository
      .findByNotePath(input.bookId, input.notePath)
      .andThen((post) => this.blueskyPostProvider.getEngagement(post.postUri))
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetEngagement",
            ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
            "エンゲージメント情報の取得に失敗しました",
            error,
          ),
      );
  }

  public getEngagement(input: {
    uri: string;
  }) {
    return this.blueskyPostProvider
      .getEngagement(input.uri)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetEngagement",
            ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
            "エンゲージメント情報の取得に失敗しました",
            error,
          ),
      );
  }
}
