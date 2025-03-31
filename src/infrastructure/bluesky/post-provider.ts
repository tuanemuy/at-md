import type {
  AuthSessionRepository,
  AuthStateRepository,
} from "@/domain/account/repositories";
import type { BlueskyPostProvider } from "@/domain/post/adapters/bluesky-post-provider";
import { type DID, blueskyPostSchema } from "@/domain/post/dtos/bluesky-post";
import { engagementSchema } from "@/domain/post/models/engagement";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { validate } from "@/domain/types/validation";
import { ResultAsync, err, ok } from "@/lib/result";
import { AppBskyFeedDefs } from "@atproto/api";
import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import { getAgent, getOAuthClient } from "./client";

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

  createPost(did: DID, text: string) {
    return getAgent(this.oauthClient, did).andThen((agent) =>
      ResultAsync.fromPromise(
        agent.com.atproto.repo.createRecord({
          repo: did,
          collection: "app.bsky.feed.post",
          record: {
            $type: "app.bsky.feed.post",
            text: text,
            createdAt: new Date().toISOString(),
          },
        }),
        (e) => e,
      )
        .andThen((response) => validate(blueskyPostSchema, response.data))
        .mapErr(
          (error) =>
            new ExternalServiceError(
              "Bluesky",
              ExternalServiceErrorCode.RESPONSE_INVALID,
              "Failed to create a post",
              error,
            ),
        ),
    );
  }

  getEngagement(did: DID, uri: string) {
    return getAgent(this.oauthClient, did).andThen((agent) =>
      ResultAsync.fromPromise(
        agent.getPostThread({
          uri,
          depth: 0,
        }),
        (e) => e,
      )
        .andThen((response) => {
          if (
            !response.data.thread ||
            !AppBskyFeedDefs.isThreadViewPost(response.data.thread)
          ) {
            return err(
              new Error(
                `Thread type is ${response.data.thread?.$type || "unknown"}`,
              ),
            );
          }
          return ok(response.data.thread.post);
        })
        .andThen((post) => validate(engagementSchema, post))
        .mapErr(
          (error) =>
            new ExternalServiceError(
              "Bluesky",
              ExternalServiceErrorCode.RESPONSE_INVALID,
              "Failed to get engagement",
              error,
            ),
        ),
    );
  }
}
