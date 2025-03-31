import type {
  AuthSessionRepository,
  AuthStateRepository,
} from "@/domain/account/repositories";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { logger } from "@/lib/logger";
import { type Result, ResultAsync, err, ok } from "@/lib/result";
import { Agent } from "@atproto/api";
import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState,
} from "@atproto/oauth-client-node";

async function _getAgent(oauthClient: NodeOAuthClient, did: string) {
  const session = await oauthClient.restore(did);
  return new Agent(session);
}
export const getAgent = ResultAsync.fromThrowable(
  _getAgent,
  (error) =>
    new ExternalServiceError(
      "BlueskyAuth",
      ExternalServiceErrorCode.AUTHENTICATION_FAILED,
      "Failed to get OAuth session",
      error instanceof Error ? error : undefined,
    ),
);

export function getOAuthClient(params: {
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

  return new NodeOAuthClient({
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
