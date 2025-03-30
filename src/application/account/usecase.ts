/**
 * アカウント管理コンテキストのユースケース定義
 */
import type { ResultAsync } from "@/lib/result";
import type { RequestContext } from "@/domain/types/http";
import type { ApplicationServiceError } from "@/domain/types/error";
import type { SessionData } from "@/domain/account/models/session-data";
import type { User } from "@/domain/account/models/user";
import type { GitHubConnection } from "@/domain/account/models/github-connection";

/**
 * Bluesky認証を開始するユースケース
 */
export interface StartBlueskyAuthInput {
  handle: string;
}

export interface StartBlueskyAuthUseCase {
  execute(
    input: StartBlueskyAuthInput,
  ): ResultAsync<URL, ApplicationServiceError>;
}

/**
 * Bluesky認証のコールバックを処理するユースケース
 */
export interface HandleBlueskyAuthCallbackInput {
  params: URLSearchParams;
}

export interface HandleBlueskyAuthCallbackUseCase {
  execute(
    input: HandleBlueskyAuthCallbackInput,
  ): ResultAsync<void, ApplicationServiceError>;
}

/**
 * セッションを検証するユースケース
 */
export interface ValidateSessionInput {
  context: RequestContext;
}

export interface ValidateSessionUseCase {
  execute(
    input: ValidateSessionInput,
  ): ResultAsync<SessionData, ApplicationServiceError>;
}

/**
 * ログアウトするユースケース
 */
export interface LogoutInput {
  context: RequestContext;
}

export interface LogoutUseCase {
  execute(input: LogoutInput): ResultAsync<void, ApplicationServiceError>;
}

/**
 * GitHubと連携するユースケース
 */
export interface ConnectGitHubInput {
  userId: string;
  code: string;
}

export interface ConnectGitHubUseCase {
  execute(
    input: ConnectGitHubInput,
  ): ResultAsync<void, ApplicationServiceError>;
}

/**
 * GitHub連携を解除するユースケース
 */
export interface DisconnectGitHubInput {
  userId: string;
}

export interface DisconnectGitHubUseCase {
  execute(
    input: DisconnectGitHubInput,
  ): ResultAsync<void, ApplicationServiceError>;
}

/**
 * ユーザー情報を取得するユースケース
 */
export interface GetUserByIdInput {
  userId: string;
}

export interface GetUserByIdUseCase {
  execute(input: GetUserByIdInput): ResultAsync<User, ApplicationServiceError>;
}

/**
 * ユーザープロフィールを更新するユースケース
 */
export interface UpdateProfileInput {
  userId: string;
  did: string;
  profile: {
    displayName: string | null;
    description: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
  };
}

export interface UpdateProfileUseCase {
  execute(
    input: UpdateProfileInput,
  ): ResultAsync<User, ApplicationServiceError>;
}

/**
 * ユーザーを削除するユースケース
 */
export interface DeleteUserInput {
  userId: string;
}

export interface DeleteUserUseCase {
  execute(input: DeleteUserInput): ResultAsync<void, ApplicationServiceError>;
}

/**
 * GitHub連携を取得するユースケース
 */
export interface GetGitHubConnectionsInput {
  userId: string;
}

export interface GetGitHubConnectionsUseCase {
  execute(
    input: GetGitHubConnectionsInput,
  ): ResultAsync<GitHubConnection, ApplicationServiceError>;
}
