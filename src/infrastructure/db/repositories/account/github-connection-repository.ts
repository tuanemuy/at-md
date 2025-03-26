import type { GitHubConnection } from "@/domain/account/models";
import { gitHubConnectionSchema } from "@/domain/account/models";
import type {
  CreateGitHubConnection,
  GitHubConnectionRepository,
  UpdateGitHubConnection,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import {
  type PgDatabase,
  codeToRepositoryErrorCode,
  isDatabaseError,
} from "../../client";
import { githubConnections } from "../../schema/account";

/**
 * GitHubConnectionRepositoryの実装
 */
export class DrizzleGitHubConnectionRepository
  implements GitHubConnectionRepository
{
  constructor(private readonly db: PgDatabase) {}

  /**
   * GitHub連携情報を作成する
   */
  async create(
    connection: CreateGitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      const [savedConnection] = await this.db
        .insert(githubConnections)
        .values(connection)
        .onConflictDoUpdate({
          target: githubConnections.userId,
          set: {
            accessToken: connection.accessToken,
            refreshToken: connection.refreshToken,
          },
        })
        .returning();

      if (!savedConnection) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.UNKNOWN_ERROR,
            "Failed to create GitHub connection",
          ),
        );
      }

      return ok(savedConnection);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to create GitHub connection",
          error,
        ),
      );
    }
  }

  /**
   * GitHub連携情報を更新する
   */
  async update(
    connection: UpdateGitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      const [updatedConnection] = await this.db
        .update(githubConnections)
        .set(connection)
        .where(eq(githubConnections.id, connection.id))
        .returning();

      if (!updatedConnection) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.NOT_FOUND,
            "GitHub connection not found",
          ),
        );
      }

      return ok(updatedConnection);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to update GitHub connection",
          error,
        ),
      );
    }
  }

  /**
   * 指定したユーザーIDのGitHub連携情報を取得する
   */
  async findByUserId(
    userId: string,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      const [githubConnection] = await this.db
        .select()
        .from(githubConnections)
        .where(eq(githubConnections.userId, userId))
        .limit(1);

      if (!githubConnection) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.NOT_FOUND,
            "GitHub connection not found",
          ),
        );
      }

      return ok(githubConnection);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find GitHub connections by user ID",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのGitHub連携情報を取得する
   */
  async findById(
    id: string,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      const [githubConnection] = await this.db
        .select()
        .from(githubConnections)
        .where(eq(githubConnections.id, id))
        .limit(1);

      if (!githubConnection) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.NOT_FOUND,
            "GitHub connection not found",
          ),
        );
      }

      return ok(githubConnection);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find GitHub connection by ID",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのGitHub連携情報を削除する
   */
  async deleteByUserId(userId: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .delete(githubConnections)
        .where(eq(githubConnections.userId, userId));
      return ok(undefined);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete GitHub connection",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのGitHub連携情報を削除する
   */
  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db
        .delete(githubConnections)
        .where(eq(githubConnections.id, id));
      return ok(undefined);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete GitHub connection",
          error,
        ),
      );
    }
  }
}
