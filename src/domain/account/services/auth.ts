import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { User, GitHubConnection } from "../models/user";
import type { AuthError } from "../models/errors";

/**
 * 認証サービスのインターフェース
 */
export interface AuthService {
  /**
   * Blueskyを使用した認証
   * @param did DID (Decentralized Identifier)
   * @param jwt JWT (JSON Web Token)
   * @returns 認証されたユーザー
   */
  authenticateWithBluesky(
    did: string,
    jwt: string,
  ): Promise<Result<User, AuthError>>;

  /**
   * GitHubとの連携
   * @param userId ユーザーID
   * @param installationId GitHubインストールID
   * @returns GitHub連携情報
   */
  connectGitHub(
    userId: ID,
    installationId: number,
  ): Promise<Result<GitHubConnection, AuthError>>;
}
