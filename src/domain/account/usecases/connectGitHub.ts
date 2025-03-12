import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { GitHubConnection } from "../models/user";
import type { AuthError } from "../models/errors";
import type { AuthService } from "../services/auth";

/**
 * GitHubとの連携のユースケース
 */
export class ConnectGitHubUseCase {
  constructor(private readonly authService: AuthService) {}

  /**
   * GitHubとの連携
   * @param userId ユーザーID
   * @param installationId GitHubインストールID
   * @returns GitHub連携情報
   */
  async execute(
    userId: ID,
    installationId: number,
  ): Promise<Result<GitHubConnection, AuthError>> {
    return await this.authService.connectGitHub(userId, installationId);
  }
}
