import type {
  CreateGitHubConnection,
  GitHubConnectionRepository,
  UpdateGitHubConnection,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { ResultAsync, err, ok } from "@/lib/result";
import { eq, and } from "drizzle-orm";
import { type PgDatabase, mapRepositoryError } from "../../client";
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
  create(connection: CreateGitHubConnection) {
    return ResultAsync.fromPromise(
      this.db
        .insert(githubConnections)
        .values(connection)
        .onConflictDoUpdate({
          target: githubConnections.userId,
          set: connection,
        })
        .returning(),
      mapRepositoryError,
    ).andThen(([savedConnection]) =>
      savedConnection
        ? ok(savedConnection)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Failed to create GitHub connection",
            ),
          ),
    );
  }

  /**
   * GitHub連携情報を更新する
   */
  update(connection: UpdateGitHubConnection) {
    return ResultAsync.fromPromise(
      this.db
        .update(githubConnections)
        .set({
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
        })
        .where(
          and(
            eq(githubConnections.id, connection.id),
            eq(githubConnections.userId, connection.userId),
          ),
        )
        .returning(),
      mapRepositoryError,
    ).andThen(([updatedConnection]) =>
      updatedConnection
        ? ok(updatedConnection)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "GitHub connection not found",
            ),
          ),
    );
  }

  /**
   * 指定したユーザーIDのGitHub連携情報を取得する
   */
  findByUserId(userId: string) {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(githubConnections)
        .where(eq(githubConnections.userId, userId))
        .limit(1),
      mapRepositoryError,
    ).andThen(([githubConnection]) =>
      githubConnection
        ? ok(githubConnection)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "GitHub connection not found",
            ),
          ),
    );
  }

  /**
   * 指定したIDのGitHub連携情報を取得する
   */
  findById(id: string) {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(githubConnections)
        .where(eq(githubConnections.id, id))
        .limit(1),
      mapRepositoryError,
    ).andThen(([githubConnection]) =>
      githubConnection
        ? ok(githubConnection)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "GitHub connection not found",
            ),
          ),
    );
  }

  /**
   * 指定したIDのGitHub連携情報を削除する
   */
  deleteByUserId(userId: string) {
    return ResultAsync.fromPromise(
      this.db
        .delete(githubConnections)
        .where(eq(githubConnections.userId, userId)),
      mapRepositoryError,
    ).map(() => {});
  }

  /**
   * 指定したIDのGitHub連携情報を削除する
   */
  delete(id: string) {
    return ResultAsync.fromPromise(
      this.db.delete(githubConnections).where(eq(githubConnections.id, id)),
      mapRepositoryError,
    ).map(() => {});
  }
}
