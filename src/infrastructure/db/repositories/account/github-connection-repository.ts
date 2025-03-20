import { eq } from "drizzle-orm";
import { type Result, err, ok } from "@/lib/result";
import type { GitHubConnection } from "@/domain/account/models";
import { gitHubConnectionSchema } from "@/domain/account/models";
import type {
  GitHubConnectionRepository,
  CreateGitHubConnection,
  UpdateGitHubConnection,
} from "@/domain/account/repositories";
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
   * GitHub連携情報を作成する
   */
  async create(
    connection: CreateGitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      const [savedConnection] = await this.db
        .insert(githubConnections)
        .values(connection)
        .returning();

      if (!savedConnection) {
        throw new Error("Failed to create GitHub connection");
      }

      const parsed = gitHubConnectionSchema.safeParse({
        ...savedConnection,
        scope: savedConnection.scope ? savedConnection.scope : "",
      });

      if (!parsed.success) {
        throw new Error("Failed to parse GitHub connection data");
      }

      return ok(parsed.data);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
            RepositoryErrorCode.DATA_ERROR,
            "GitHub connection not found",
          ),
        );
      }

      const parsed = gitHubConnectionSchema.safeParse({
        ...updatedConnection,
        scope: updatedConnection.scope ? updatedConnection.scope : "",
      });

      if (!parsed.success) {
        throw new Error("Failed to parse GitHub connection data");
      }

      return ok(parsed.data);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
  ): Promise<Result<GitHubConnection[], RepositoryError>> {
    try {
      const connectionResults = await this.db
        .select()
        .from(githubConnections)
        .where(eq(githubConnections.userId, userId));

      const parsedConnections = connectionResults.map((connection) => {
        const parsed = gitHubConnectionSchema.safeParse({
          ...connection,
          scope: connection.scope ? connection.scope : "",
        });
        if (!parsed.success) {
          throw new Error("Failed to parse GitHub connection data");
        }
        return parsed.data;
      });

      return ok(parsedConnections);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
      const [connection] = await this.db
        .select()
        .from(githubConnections)
        .where(eq(githubConnections.id, id))
        .limit(1);

      if (!connection) return ok(null);

      const parsed = gitHubConnectionSchema.safeParse({
        ...connection,
        scope: connection.scope ? connection.scope : "",
      });

      if (!parsed.success) {
        throw new Error("Failed to parse GitHub connection data");
      }

      return ok(parsed.data);
    } catch (error) {
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
      if (error instanceof RepositoryError) {
        return err(error);
      }
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
