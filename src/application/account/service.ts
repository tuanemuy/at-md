import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { GitHubAppProvider } from "@/domain/account/adapters/github-app-provider";
import type { SessionManager } from "@/domain/account/adapters/session-manager";
import type { StateManager } from "@/domain/account/adapters/state-manager";
import type { GitHubConnectionRepository } from "@/domain/account/repositories/github-connection-repository";
import type { UserRepository } from "@/domain/account/repositories/user-repository";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { logger } from "@/lib/logger";
import { errAsync, okAsync } from "neverthrow";
import { v4 as uuid } from "uuid";
import type { AccountUsecase } from "./usecase";

export class AccountService<T> implements AccountUsecase<T> {
  private readonly publicUrl: string;
  private readonly clientId: string;
  private readonly appName: string;
  private readonly authProvider: BlueskyAuthProvider;
  private readonly sessionManager: SessionManager<T>;
  private readonly stateManager: StateManager<T>;
  private readonly githubAppProvider: GitHubAppProvider;
  private readonly githubConnectionRepository: GitHubConnectionRepository;
  private readonly userRepository: UserRepository;

  constructor(params: {
    deps: {
      publicUrl: string;
      clientId: string;
      appName: string;
      authProvider: BlueskyAuthProvider;
      githubAppProvider: GitHubAppProvider;
      githubConnectionRepository: GitHubConnectionRepository;
      userRepository: UserRepository;
      sessionManager: SessionManager<T>;
      stateManager: StateManager<T>;
    };
  }) {
    this.publicUrl = params.deps.publicUrl;
    this.clientId = params.deps.clientId;
    this.appName = params.deps.appName;
    this.authProvider = params.deps.authProvider;
    this.githubAppProvider = params.deps.githubAppProvider;
    this.githubConnectionRepository = params.deps.githubConnectionRepository;
    this.userRepository = params.deps.userRepository;
    this.sessionManager = params.deps.sessionManager;
    this.stateManager = params.deps.stateManager;
  }

  public getClientMetadata() {
    return this.authProvider.getClientMetadata();
  }

  public startBlueskyAuth(input: {
    handle: string;
    context: T;
  }) {
    const state = uuid();
    return this.stateManager
      .set(input.context, {
        state,
      })
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "StartBlueskyAuth",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to set state",
            error,
          ),
      )
      .andThen(() =>
        this.authProvider
          .authorize(input.handle, state)
          .map((url) => url.toString())
          .mapErr(
            (error) =>
              new ApplicationServiceError(
                "StartBlueskyAuth",
                ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
                "Failed to start Bluesky auth",
                error,
              ),
          ),
      )
      .orTee((error) => logger.error("Failed to start Bluesky auth", error));
  }

  public handleBlueskyAuthCallback(input: {
    params: URLSearchParams;
    context: T;
  }) {
    return this.stateManager
      .get(input.context)
      .andThen(({ state }) =>
        this.authProvider.callback(input.params).andThen((data) => {
          if (data.state !== state) {
            return errAsync(new Error("Invalid state"));
          }
          return okAsync(data.did);
        }),
      )
      .andThen((did) =>
        this.userRepository
          .findByDid(did)
          .map((user) => ({ did, user }))
          .orElse(() => okAsync({ did, user: null })),
      )
      .andThen(({ did, user }) =>
        this.authProvider
          .getUserProfile(did)
          .map((profile) => ({ did, user, profile })),
      )
      .andThen(({ did, user, profile }) =>
        !user
          ? this.userRepository.create({
              did,
              handle: profile.handle,
              profile: {
                displayName: profile.displayName || null,
                description: profile.description || null,
                avatarUrl: profile.avatar || null,
                bannerUrl: profile.banner || null,
              },
            })
          : okAsync(user),
      )
      .andThen((user) =>
        this.sessionManager
          .set(input.context, {
            user: {
              id: user.id,
              did: user.did,
            },
          })
          .map(() => user),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "HandleBlueskyAuthCallback",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to handle Bluesky auth callback",
            error,
          ),
      )
      .orTee((error) =>
        logger.error("Failed to handle Bluesky auth callback", error),
      );
  }

  public validateSession(input: {
    context: T;
  }) {
    return this.sessionManager
      .get(input.context)
      .andThen((sessionData) =>
        this.authProvider.validateSession(sessionData.user.did),
      )
      .andThen((did) =>
        this.userRepository.findByDid(did).map((user) => ({
          user: {
            id: user.id,
            did: user.did,
          },
        })),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ValidateSession",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to validate session",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to validate session", error));
  }

  public logout(input: {
    context: T;
  }) {
    return this.sessionManager
      .remove(input.context)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "Logout",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to logout",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to logout", error));
  }

  public startGitHubAccessTokenFlow(input: {
    context: T;
  }) {
    const state = uuid();
    return this.stateManager
      .set(input.context, {
        state,
      })
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "StartGitHubAccessTokenFlow",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to set state",
            error,
          ),
      )
      .map(
        () =>
          `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_url=${this.publicUrl}/api/auth/github/callback&state=${state}`,
      )
      .orTee((error) =>
        logger.error("Failed to start GitHub access token flow", error),
      );
  }

  public startGitHubAppsInstallation(input: {
    context: T;
  }) {
    const state = uuid();
    return this.stateManager
      .set(input.context, {
        state,
      })
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "StartGitHubAppsInstallation",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to set state",
            error,
          ),
      )
      .map(
        () =>
          `https://github.com/apps/${this.appName}/installations/new?state=${state}`,
      )
      .orTee((error) =>
        logger.error("Failed to start GitHub Apps installation", error),
      );
  }

  public connectGitHub(input: {
    userId: string;
    code: string;
    state: string;
    context: T;
  }) {
    return this.stateManager
      .get(input.context)
      .andThen(({ state }) =>
        state === input.state
          ? okAsync()
          : errAsync(new Error("Invalid state")),
      )
      .andThen(() => this.githubAppProvider.getAccessToken(input.code))
      .andThen(({ accessToken, refreshToken, expiresAt }) =>
        this.githubConnectionRepository.create({
          userId: input.userId,
          accessToken,
          refreshToken: refreshToken || null,
          expiresAt: expiresAt || null,
        }),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ConnectGitHub",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to connect to GitHub",
            error,
          ),
      )
      .map(() => {})
      .orTee((error) => logger.error("Failed to connect to GitHub", error));
  }

  public disconnectGitHub(input: {
    userId: string;
  }) {
    return this.githubConnectionRepository
      .deleteByUserId(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "DisconnectGitHub",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to disconnect GitHub",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to disconnect GitHub", error));
  }

  public refreshGitHubConnection(input: {
    userId: string;
  }) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .andThen((connection) =>
        connection.refreshToken
          ? okAsync({ connection, refreshToken: connection.refreshToken })
          : errAsync(new Error("No connection found")),
      )
      .andThen(({ connection, refreshToken }) =>
        this.githubAppProvider
          .refreshAccessToken(refreshToken)
          .andThen(({ accessToken, refreshToken }) =>
            this.githubConnectionRepository.update({
              id: connection.id,
              userId: connection.userId,
              accessToken,
              refreshToken: refreshToken || null,
              expiresAt: connection.expiresAt || null,
            }),
          ),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "RefreshGitHubConnection",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to refresh GitHub connection",
            error,
          ),
      )
      .orTee((error) =>
        logger.error("Failed to refresh GitHub connection", error),
      );
  }

  public getUserById(input: {
    userId: string;
  }) {
    return this.userRepository
      .findById(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetUserById",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to get user",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to get user by ID", error));
  }

  public getUserByHandle(input: {
    handle: string;
  }) {
    return this.userRepository
      .findByHandle(input.handle)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetUserById",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to get user",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to get user by handle", error));
  }

  public syncProfile(input: {
    userId: string;
    did: string;
  }) {
    return this.authProvider
      .getUserProfile(input.did)
      .andThen((profile) =>
        this.userRepository.update({
          id: input.userId,
          profile: {
            displayName: profile.displayName || null,
            description: profile.description || null,
            avatarUrl: profile.avatar || null,
            bannerUrl: profile.banner || null,
          },
        }),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "UpdateProfile",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to update profile",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to update profile", error));
  }

  public deleteUser(input: {
    userId: string;
  }) {
    return this.userRepository
      .delete(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "DeleteUser",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to delete user",
            error,
          ),
      )
      .orTee((error) => logger.error("Failed to delete user", error));
  }

  public getGitHubConnection(input: {
    userId: string;
  }) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "GetGitHubConnections",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to get GitHub connections",
            error,
          ),
      )
      .orTee((error) =>
        logger.debug("Failed to get GitHub connections", error),
      );
  }

  public listGitHubInstallations(input: {
    userId: string;
  }) {
    return this.githubConnectionRepository
      .findByUserId(input.userId)
      .andThen((connection) =>
        connection.expiresAt && connection.expiresAt < new Date()
          ? this.refreshGitHubConnection({
              userId: input.userId,
            })
          : okAsync(connection),
      )
      .andThen((connection) =>
        this.githubAppProvider.listInstallations(connection.accessToken),
      )
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListGitHubInstallations",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to get GitHub installations",
            error,
          ),
      )
      .orTee((error) =>
        logger.debug("Failed to list GitHub installations", error),
      );
  }

  public countUsers() {
    return this.userRepository
      .count()
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "CountUsers",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to count users",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to count users", error));
  }

  public listUsers(input: { page: number; limit: number }) {
    return this.userRepository
      .list(input.page, input.limit)
      .mapErr(
        (error) =>
          new ApplicationServiceError(
            "ListUsers",
            ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
            "Failed to list users",
            error,
          ),
      )
      .orTee((error) => logger.debug("Failed to list users", error));
  }
}
