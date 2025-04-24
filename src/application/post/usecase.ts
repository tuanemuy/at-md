import type { Engagement, Post } from "@/domain/post/models";
import type { ApplicationServiceError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";

export interface PostUsecase {
  /**
   * ノートを投稿する
   */
  postNote: (input: {
    userId: string;
    bookId: string;
    notePath: string;
    did: string;
    text: string;
  }) => ResultAsync<Post, ApplicationServiceError>;

  getPost: (input: {
    bookId: string;
    notePath: string;
  }) => ResultAsync<Post, ApplicationServiceError>;

  /**
   * 投稿IDからを取得する
   */
  getEngagementByNotePath: (input: {
    bookId: string;
    notePath: string;
  }) => ResultAsync<Engagement, ApplicationServiceError>;

  /**
   * エンゲージメントを取得する
   */
  getEngagement: (input: {
    uri: string;
  }) => ResultAsync<Engagement, ApplicationServiceError>;
}
