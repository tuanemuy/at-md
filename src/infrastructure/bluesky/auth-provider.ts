/**
 * Bluesky認証アダプターの実装 - 公式APIライブラリを直接使用
 */
import { ok, err, type Result } from "@/lib/result";
import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState,
} from "@atproto/oauth-client-node";
import { Agent } from "@atproto/api";
import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import { type Profile, profileSchema } from "@/domain/account/models/profile";
import type { Session } from "@/domain/account/models/session";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { logger } from "@/lib/logger";
import {
  parseCookies,
  setCookie,
  clearCookie,
  type RequestContext,
} from "@/lib/cookie";

const stateMaxAge = 60 * 60;
const sessionMaxAge = 60 * 60 * 24 * 30;

/**
 * Bluesky認証アダプターの実装クラス
 */
export class DefaultBlueskyAuthProvider implements BlueskyAuthProvider {
  private readonly publicUrl: string;

  /**
   * コンストラクタ
   */
  constructor(config: {
    publicUrl: string;
  }) {
    this.publicUrl = config.publicUrl;
  }

  /**
   * OAuthクライアントの作成
   * @returns Result<NodeOAuthClient, ExternalServiceError>
   */
  private createOAuthClient(context: RequestContext) {
    // ストアの作成
    const stateStore = createStateStore(context);
    const sessionStore = createSessionStore(context);

    // OAuthクライアントをコンストラクタから直接生成
    const client = new NodeOAuthClient({
      clientMetadata: {
        client_name: "@md",
        client_id: `${this.publicUrl}/api/auth/client-metadata.json`,
        client_uri: this.publicUrl,
        redirect_uris: [`${this.publicUrl}/api/auth/callback`],
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

    return client;
  }

  /**
   * Blueskyの認証URLを取得する
   */
  async authorize(
    handle: string,
    context: RequestContext,
  ): Promise<Result<URL, ExternalServiceError>> {
    try {
      // OAuthクライアントの取得
      const clientResult = this.createOAuthClient(context);

      // 認証URLを生成
      const url = await clientResult.authorize(handle, {
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
    context: RequestContext,
  ): Promise<Result<Session, ExternalServiceError>> {
    try {
      // OAuthクライアントの取得
      const clientResult = this.createOAuthClient(context);

      // コードを交換してセッションを取得
      const { session } = await clientResult.callback(params);

      // アプリケーションの期待するSession型に変換
      const appSession: Session = {
        did: session.did,
      };

      logger.info("Successfully retrieved Bluesky session", {
        did: appSession.did,
      });

      return ok(appSession);
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
    context: RequestContext,
  ): Promise<Result<Profile, ExternalServiceError>> {
    try {
      const clientResult = this.createOAuthClient(context);
      const session = await clientResult.restore(did);
      
      // sessionがnullの場合はエラーを返す
      if (!session) {
        throw new Error('Session not found or expired');
      }
      
      const agent = new Agent(session);

      const { data: profileRecord } = await agent.com.atproto.repo.getRecord({
        repo: agent.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
      });

      const profile = profileSchema.parse(profileRecord.value);

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
 * Cookieベースのステートストアを作成する
 */
const createStateStore = (context: RequestContext) => {
  const { req, res } = context;

  return {
    set: async (key: string, state: NodeSavedState): Promise<void> => {
      setCookie(res, `bluesky_state_${key}`, JSON.stringify(state), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: stateMaxAge,
        path: "/",
      });
    },

    get: async (key: string): Promise<NodeSavedState | undefined> => {
      const cookies = parseCookies(req);
      const cookieValue = cookies[`bluesky_state_${key}`];
      if (!cookieValue) return undefined;

      try {
        return JSON.parse(cookieValue);
      } catch (e) {
        return undefined;
      }
    },

    del: async (key: string): Promise<void> => {
      clearCookie(res, `bluesky_state_${key}`);
    },
  };
};

/**
 * Cookieベースのセッションストアを作成する
 */
const createSessionStore = (context: RequestContext) => {
  const { req, res } = context;

  return {
    set: async (sub: string, session: NodeSavedSession): Promise<void> => {
      setCookie(res, `bluesky_session_${sub}`, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: sessionMaxAge,
        path: "/",
      });
    },

    get: async (sub: string): Promise<NodeSavedSession | undefined> => {
      const cookies = parseCookies(req);
      const cookieValue = cookies[`bluesky_session_${sub}`];
      if (!cookieValue) return undefined;

      try {
        return JSON.parse(cookieValue);
      } catch (e) {
        return undefined;
      }
    },

    del: async (sub: string): Promise<void> => {
      clearCookie(res, `bluesky_session_${sub}`);
    },
  };
};
