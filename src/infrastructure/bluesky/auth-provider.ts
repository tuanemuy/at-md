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
/**
 * Bluesky認証アダプターの実装 - 公式APIライブラリを直接使用
 */
import { type Result, err, ok } from "@/lib/result";
import { Agent } from "@atproto/api";
import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState,
  type OAuthSession,
} from "@atproto/oauth-client-node";

/**
 * Bluesky認証アダプターの実装クラス
 */
export class DefaultBlueskyAuthProvider implements BlueskyAuthProvider {
  private readonly oauthClient: NodeOAuthClient;

  /**
   * コンストラクタ
   */
  constructor(params: {
    config: {
      publicUrl: string;
    };
    deps: {
      authSessionRepository: AuthSessionRepository;
      authStateRepository: AuthStateRepository;
    };
  }) {
    const stateStore = createStateStore(params.deps.authStateRepository);
    const sessionStore = createSessionStore(params.deps.authSessionRepository);

    this.oauthClient = new NodeOAuthClient({
      clientMetadata: {
        client_name: "@md",
        client_id: `${params.config.publicUrl}/api/auth/client-metadata.json`,
        client_uri: params.config.publicUrl,
        redirect_uris: [`${params.config.publicUrl}/api/auth/callback`],
        scope: "atproto transition:generic",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        token_endpoint_auth_method: "none",
        dpop_bound_access_tokens: true,
      },
      stateStore,
      sessionStore,
    });
  }

  /**
   * OAuthセッションを取得する
   * @param did ユーザーのDID
   * @returns Result<OAuthSession, ExternalServiceError>
   */
  async getOAuthSession(
    did: string,
  ): Promise<Result<OAuthSession, ExternalServiceError>> {
    try {
      // セッションを復元
      const session = await this.oauthClient.restore(did);

      if (!session) {
        logger.error("Failed to restore OAuth session", { did });
        return err(
          new ExternalServiceError(
            "BlueskyAuth",
            ExternalServiceErrorCode.AUTHENTICATION_FAILED,
            "Session not found or expired",
          ),
        );
      }

      logger.info("Successfully restored OAuth session", { did });
      return ok(session);
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

  /**
   * Blueskyの認証URLを取得する
   */
  async authorize(handle: string): Promise<Result<URL, ExternalServiceError>> {
    try {
      // 認証URLを生成
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
   * コールバックURLからセッション情報を取得する
   */
  async callback(
    params: URLSearchParams,
  ): Promise<Result<OAuthSession, ExternalServiceError>> {
    try {
      // コードを交換してセッションを取得
      const { session } = await this.oauthClient.callback(params);

      logger.info("Successfully retrieved Bluesky session", {
        did: session.did,
      });

      return ok(session);
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
    const oauthSessionResult = await this.getOAuthSession(did);

    if (oauthSessionResult.isErr()) {
      return err(oauthSessionResult.error);
    }

    const agent = new Agent(oauthSessionResult.value);

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
          ExternalServiceErrorCode.PROFILE_RETRIEVAL_FAILED,
          "Failed to retrieve Bluesky profile",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}

/**
 * データベースベースのステートストアを作成する
 */
const createStateStore = (authStateRepository: AuthStateRepository) => {
  return {
    set: async (key: string, state: NodeSavedState): Promise<void> => {
      const result = await authStateRepository.create({
        key,
        state: JSON.stringify(state),
      });

      if (result.isErr()) {
        logger.error("Failed to save auth state", {
          key,
          error: result.error,
        });
        throw new Error("Failed to save auth state");
      }
    },

    get: async (key: string): Promise<NodeSavedState | undefined> => {
      const result = await authStateRepository.findByKey(key);

      if (result.isErr()) {
        logger.error("Failed to get auth state", {
          key,
          error: result.error,
        });
        return undefined;
      }

      const authState = result.value;
      if (!authState) return undefined;

      try {
        return JSON.parse(authState.state);
      } catch (e) {
        logger.error("Failed to parse auth state", { key });
        return undefined;
      }
    },

    del: async (key: string): Promise<void> => {
      const result = await authStateRepository.deleteByKey(key);

      if (result.isErr()) {
        logger.error("Failed to delete auth state", {
          key,
          error: result.error,
        });
      }
    },
  };
};

/**
 * データベースベースのセッションストアを作成する
 */
const createSessionStore = (authSessionRepository: AuthSessionRepository) => {
  return {
    set: async (sub: string, session: NodeSavedSession): Promise<void> => {
      const result = await authSessionRepository.create({
        key: sub,
        session: JSON.stringify(session),
      });

      if (result.isErr()) {
        logger.error("Failed to save auth session", {
          sub,
          error: result.error,
        });
        throw new Error("Failed to save auth session");
      }
    },

    get: async (sub: string): Promise<NodeSavedSession | undefined> => {
      const result = await authSessionRepository.findByKey(sub);

      if (result.isErr()) {
        logger.error("Failed to get auth session", {
          sub,
          error: result.error,
        });
        return undefined;
      }

      const authSession = result.value;
      if (!authSession) return undefined;

      try {
        return JSON.parse(authSession.session);
      } catch (e) {
        logger.error("Failed to parse auth session", { sub });
        return undefined;
      }
    },

    del: async (sub: string): Promise<void> => {
      const result = await authSessionRepository.deleteByKey(sub);

      if (result.isErr()) {
        logger.error("Failed to delete auth session", {
          sub,
          error: result.error,
        });
      }
    },
  };
};
