import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import { blueskyProfileSchema } from "@/domain/account/dtos/bluesky-profile";
import type {
  AuthSessionRepository,
  AuthStateRepository,
} from "@/domain/account/repositories";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { validate } from "@/domain/types/validation";
import { ResultAsync } from "@/lib/result";
import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import { getAgent, getOAuthClient } from "./client";

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
   * クライアントメタデータを取得する
   */
  getClientMetadata() {
    return this.oauthClient.clientMetadata;
  }

  /**
   * Blueskyの認証URLを取得する
   */
  authorize(handle: string, state: string) {
    return ResultAsync.fromPromise(
      this.oauthClient.authorize(handle, {
        state,
        scope: "atproto transition:generic",
      }),
      (error) =>
        new ExternalServiceError(
          "BlueskyAuth",
          ExternalServiceErrorCode.AUTHENTICATION_FAILED,
          "Failed to generate Bluesky authorization URL",
          error instanceof Error ? error : undefined,
        ),
    );
  }

  /**
   * コールバックURLからセッションを作成する
   */
  callback(params: URLSearchParams) {
    return ResultAsync.fromPromise(this.oauthClient.callback(params), (e) => e)
      .map(({ session, state }) => ({ did: session.did, state }))
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "BlueskyAuth",
            ExternalServiceErrorCode.AUTHENTICATION_FAILED,
            "Failed to retrieve Bluesky session",
            error instanceof Error ? error : undefined,
          ),
      );
  }

  /**
   * ユーザープロフィールを取得する
   */
  getUserProfile(did: string) {
    return getAgent(this.oauthClient, did)
      .andThen((agent) =>
        ResultAsync.fromPromise(
          agent.getProfile({
            actor: agent.assertDid,
          }),
          (e) => e,
        ),
      )
      .andThen((response) => validate(blueskyProfileSchema, response.data))
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "BlueskyAuth",
            ExternalServiceErrorCode.AUTHENTICATION_FAILED,
            "Failed to get profile",
            error instanceof Error ? error : undefined,
          ),
      );
  }

  /**
   * セッションを検証する
   * @param did ユーザーのDID
   * @returns Result<void, ExternalServiceError>
   */
  validateSession(did: string) {
    return ResultAsync.fromPromise(
      this.oauthClient.restore(did).then((session) => session.did),
      (error) =>
        new ExternalServiceError(
          "BlueskyAuth",
          ExternalServiceErrorCode.AUTHENTICATION_FAILED,
          "Failed to validate Bluesky session",
          error instanceof Error ? error : undefined,
        ),
    );
  }
}
