import type { Result } from "neverthrow";
import type { User } from "../models/user";
import type { AuthError } from "../models/errors";
import type { AuthService } from "../services/auth";

/**
 * Blueskyを使用した認証のユースケース
 */
export class AuthenticateWithBlueskyUseCase {
  constructor(private readonly authService: AuthService) {}

  /**
   * Blueskyを使用した認証
   * @param did DID (Decentralized Identifier)
   * @param jwt JWT (JSON Web Token)
   * @returns 認証されたユーザー
   */
  async execute(did: string, jwt: string): Promise<Result<User, AuthError>> {
    return await this.authService.authenticateWithBluesky(did, jwt);
  }
}
