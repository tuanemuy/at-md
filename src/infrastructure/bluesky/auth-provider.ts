import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import { type Profile, profileSchema } from "@/domain/account/models/profile";
import type {
  AuthSessionRepository,
  AuthStateRepository,
} from "@/domain/account/repositories";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { logger } from "@/lib/logger";
import { type Result, err, ok } from "@/lib/result";
import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import { getOAuthClient, getAgent } from "./client";

/**
 * Bluesky認証アダプターの実装クラス
 */
export class DefaultBlueskyAuthProvider implements BlueskyAuthProvider {
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

  /**
   * Blueskyの認証URLを取得する
   */
  async authorize(handle: string): Promise<Result<URL, ExternalServiceError>> {
    try {
      const url = await this.oauthClient.authorize(handle, {
        scope: "'atproto transition:generic'",
      });

      logger.info("Generated Bluesky authorize URL", {
        handle,
      });

      return ok(url);
    } catch (error) {
      logger.error("Failed to generate Bluesky authorize URL", {
        error: error instanceof Error ? error.message : String(error),
        handle,
      });

      return err(
        new ExternalServiceError(
          "BlueskyAuth",
          ExternalServiceErrorCode.AUTHENTICATION_FAILED,
          "Failed to generate Bluesky authorization URL",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * コールバックURLからセッションを作成する
   */
  async callback(
    params: URLSearchParams,
  ): Promise<Result<string, ExternalServiceError>> {
    try {
      // コードを交換してセッションを取得
      const { session } = await this.oauthClient.callback(params);

      logger.info("Successfully retrieved Bluesky session", {
        did: session.did,
      });

      return ok(session.did);
    } catch (error) {
      logger.error("Failed to retrieve Bluesky session", {
        error: error instanceof Error ? error.message : String(error),
      });

      return err(
        new ExternalServiceError(
          "BlueskyAuth",
          ExternalServiceErrorCode.AUTHENTICATION_FAILED,
          "Failed to retrieve Bluesky session",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * ユーザープロフィールを取得する
   */
  async getUserProfile(
    did: string,
  ): Promise<Result<Profile, ExternalServiceError>> {
    const result = await getAgent(this.oauthClient, did);
    if (result.isErr()) {
      return err(result.error);
    }
    const agent = result.value;

    try {
      const response = await agent.com.atproto.repo.getRecord({
        repo: agent.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
      });

      if (!response.success) {
        return err(
          new ExternalServiceError(
            "Bluesky",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to get profile",
          ),
        );
      }

      const profile = profileSchema.parse({
        displayName: response.data.value.displayName,
        description: response.data.value.description,
        avatarUrl: response.data.value.avatar,
        bannerUrl: response.data.value.banner,
      });

      logger.info("Successfully retrieved Bluesky profile", {
        did,
        displayName: profile.displayName,
      });

      return ok(profile);
    } catch (error) {
      logger.error("Failed to retrieve Bluesky profile", {
        error: error instanceof Error ? error.message : String(error),
        did,
      });

      return err(
        new ExternalServiceError(
          "BlueskyAuth",
          ExternalServiceErrorCode.UNEXPECTED_ERROR,
          "Failed to retrieve Bluesky profile",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * セッションを検証する
   * @param did ユーザーのDID
   * @returns Result<void, ExternalServiceError>
   */
  async validateSession(
    did: string,
  ): Promise<Result<void, ExternalServiceError>> {
    try {
      await this.oauthClient.restore(did);
      logger.info("Successfully restored OAuth session", { did });
      return ok();
    } catch (error) {
      logger.error("Failed to get OAuth session", {
        error: error instanceof Error ? error.message : String(error),
        did,
      });
      return err(
        new ExternalServiceError(
          "BlueskyAuth",
          ExternalServiceErrorCode.AUTHENTICATION_FAILED,
          "Failed to get OAuth session",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}
