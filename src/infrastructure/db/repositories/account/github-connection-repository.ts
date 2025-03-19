import { and, eq } from "drizzle-orm";
import { type Result, err, ok } from "@/lib/result";
import { v7 as uuidv7 } from "uuid";
import type { GitHubConnection } from "@/domain/account/models";
import type { GitHubConnectionRepository } from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import {
  type PgDatabase,
  isDatabaseError,
  codeToRepositoryErrorCode,
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
   * GitHub連携情報を保存する
   * 新規作成または更新を行う
   */
  async save(
    connection: GitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const [savedConnection] = await tx
          .insert(githubConnections)
          .values({
            id: connection.id,
            userId: connection.userId,
            accessToken: connection.accessToken,
            refreshToken: connection.refreshToken || null,
            expiresAt: connection.expiresAt || null,
            scope: connection.scope.join(" "), // スコープを空白区切りの文字列として保存
          })
          .onConflictDoUpdate({
            target: githubConnections.id,
            set: {
              accessToken: connection.accessToken,
              refreshToken: connection.refreshToken || null,
              expiresAt: connection.expiresAt || null,
              scope: connection.scope.join(" "), // スコープを空白区切りの文字列として保存
            },
          })
          .returning();

        if (!savedConnection) {
          throw new Error("Failed to save GitHub connection");
        }

        return {
          ...savedConnection,
          refreshToken: savedConnection.refreshToken || undefined,
          expiresAt: savedConnection.expiresAt || undefined,
          scope: savedConnection.scope ? savedConnection.scope.split(" ").filter(Boolean) : [], // 文字列からスコープ配列に変換
        };
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to save GitHub connection",
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
  ): Promise<Result<GitHubConnection[], RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const connectionResults = await tx
          .select()
          .from(githubConnections)
          .where(eq(githubConnections.userId, userId));

        if (connectionResults.length === 0) return [];

        return connectionResults.map(connection => ({
          ...connection,
          refreshToken: connection.refreshToken || undefined,
          expiresAt: connection.expiresAt || undefined,
          scope: connection.scope ? connection.scope.split(" ").filter(Boolean) : [], // 文字列からスコープ配列に変換
        }));
      });

      return ok(result);
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
  ): Promise<Result<GitHubConnection | null, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const connectionResults = await tx
          .select()
          .from(githubConnections)
          .where(eq(githubConnections.id, id))
          .limit(1);

        if (connectionResults.length === 0) return null;

        const connection = connectionResults[0];

        return {
          ...connection,
          refreshToken: connection.refreshToken || undefined,
          expiresAt: connection.expiresAt || undefined,
          scope: connection.scope ? connection.scope.split(" ").filter(Boolean) : [], // 文字列からスコープ配列に変換
        };
      });

      return ok(result);
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

