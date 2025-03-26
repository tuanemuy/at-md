import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import type { BlueskyPostProvider } from "@/domain/post/adapters/bluesky-post-provider";
import {
  type BlueskyPost,
  type DID,
  blueskyPostSchema,
} from "@/domain/post/dtos/bluesky-post";
import {
  type Engagement,
  engagementSchema,
} from "@/domain/post/models/engagement";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
  ValidationError,
} from "@/domain/types/error";
import type {
  AuthSessionRepository,
  AuthStateRepository,
} from "@/domain/account/repositories";
import { type Result, err, ok } from "@/lib/result";
import { AppBskyFeedDefs } from "@atproto/api";
import { getOAuthClient, getAgent } from "./client";

export class DefaultBlueskyPostProvider implements BlueskyPostProvider {
  private readonly oauthClient: NodeOAuthClient;

  constructor(params: {
    config: {
      publicUrl: string;
    };
    deps: {
      authSessionRepository: AuthSessionRepository;
      authStateRepository: AuthStateRepository;
    };
  }) {
    this.oauthClient = getOAuthClient(params);
  }

  async createPost(
    did: DID,
    text: string,
  ): Promise<Result<BlueskyPost, ExternalServiceError>> {
    const result = await getAgent(this.oauthClient, did);
    if (result.isErr()) {
      return err(result.error);
    }
    const agent = result.value;

    try {
      const response = await agent.com.atproto.repo.createRecord({
        repo: did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text: text,
          createdAt: new Date().toISOString(),
        },
      });

      if (!response.success) {
        return err(
          new ExternalServiceError(
            "Bluesky",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to create a post",
          ),
        );
      }

      const post = blueskyPostSchema.parse({
        uri: response.data.uri,
        cid: response.data.cid,
      });
      return ok(post);
    } catch (error) {
      return err(
        new ExternalServiceError(
          "Bluesky",
          error instanceof ValidationError
            ? ExternalServiceErrorCode.RESPONSE_INVALID
            : ExternalServiceErrorCode.UNEXPECTED_ERROR,
          "Failed to create a post",
          error,
        ),
      );
    }
  }

  async getEngagement(
    did: DID,
    uri: string,
  ): Promise<Result<Engagement, ExternalServiceError>> {
    const result = await getAgent(this.oauthClient, did);
    if (result.isErr()) {
      return err(result.error);
    }
    const agent = result.value;

    try {
      const response = await agent.getPostThread({
        uri,
        depth: 0,
      });

      if (!response.success) {
        return err(
          new ExternalServiceError(
            "Bluesky",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to get post thread",
          ),
        );
      }

      // 投稿が見つからない場合や非表示の場合
      if (
        !response.data.thread ||
        !AppBskyFeedDefs.isThreadViewPost(response.data.thread)
      ) {
        return err(
          new ExternalServiceError(
            "Bluesky",
            ExternalServiceErrorCode.RESPONSE_INVALID,
            `Thread type is ${response.data.thread?.$type || "unknown"}`,
          ),
        );
      }

      const post = response.data.thread.post;
      const engagement = engagementSchema.parse({
        likes: post.likeCount || 0,
        reposts: post.repostCount || 0,
        quotes: post.quoteCount || 0,
        replies: post.replyCount || 0,
      });
      return ok(engagement);
    } catch (error) {
      return err(
        new ExternalServiceError(
          "Bluesky",
          error instanceof ValidationError
            ? ExternalServiceErrorCode.RESPONSE_INVALID
            : ExternalServiceErrorCode.UNEXPECTED_ERROR,
          "Failed to get engagement",
          error,
        ),
      );
    }
  }
}
