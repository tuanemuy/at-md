import { eq } from "drizzle-orm";
import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { User, GitHubConnection } from "@/domain/account/models/user";
import type { UserRepository } from "@/domain/account/repositories/user";
import type { RepositoryError } from "@/domain/shared/models/common";
import { createRepositoryError } from "@/domain/shared/models/common";
import type { PgDatabase } from "../../client";
import { users, githubConnections } from "../../schema";
import type { UsersTable, GitHubConnectionsTable } from "../../schema/types";

/**
 * ユーザーリポジトリの実装
 */
export class DrizzleUserRepository implements UserRepository {
  /**
   * @param db データベースクライアント
   */
  constructor(private readonly db: PgDatabase) {}

  /**
   * IDによるユーザー検索
   * @param id ユーザーID
   * @returns ユーザーまたはnull
   */
  async findById(id: ID): Promise<Result<User | null, RepositoryError>> {
    try {
      // ユーザー情報を取得
      const userData = await this.db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          githubConnections: true,
        },
      });

      if (!userData) {
        return ok(null);
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToUser(userData));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find user by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * DIDによるユーザー検索
   * @param did DID (Decentralized Identifier)
   * @returns ユーザーまたはnull
   */
  async findByDid(did: string): Promise<Result<User | null, RepositoryError>> {
    try {
      // ユーザー情報を取得
      const userData = await this.db.query.users.findFirst({
        where: eq(users.did, did),
        with: {
          githubConnections: true,
        },
      });

      if (!userData) {
        return ok(null);
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToUser(userData));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find user by DID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * ユーザーの保存
   * @param user ユーザーオブジェクト
   * @returns 保存されたユーザー
   */
  async save(user: User): Promise<Result<User, RepositoryError>> {
    try {
      // ユーザーが存在するか確認
      const existingUser = await this.db.query.users.findFirst({
        where: eq(users.id, user.id),
      });

      let result: UsersTable;

      if (existingUser) {
        // 既存ユーザーの更新
        [result] = await this.db
          .update(users)
          .set({
            name: user.name,
            did: user.did,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        // 新規ユーザーの作成
        [result] = await this.db
          .insert(users)
          .values({
            id: user.id,
            name: user.name,
            did: user.did,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })
          .returning();
      }

      // GitHub連携情報を取得
      const connections = await this.db.query.githubConnections.findMany({
        where: eq(githubConnections.userId, result.id),
      });

      // ドメインモデルに変換して返す
      return ok({
        id: result.id,
        name: result.name,
        did: result.did,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        gitHubConnections: connections.map((conn: GitHubConnectionsTable) =>
          this.mapToGitHubConnection(conn),
        ),
      });
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to save user: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * GitHub連携情報の追加
   * @param userId ユーザーID
   * @param connection GitHub連携情報
   * @returns 保存されたGitHub連携情報
   */
  async addGitHubConnection(
    userId: ID,
    connection: GitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      // ユーザーが存在するか確認
      const existingUser = await this.db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!existingUser) {
        return err(
          createRepositoryError(
            "NOT_FOUND",
            `User with ID ${userId} not found`,
          ),
        );
      }

      // 既存の連携情報を確認
      const existingConnection =
        await this.db.query.githubConnections.findFirst({
          where: eq(
            githubConnections.installationId,
            connection.installationId,
          ),
        });

      let result: GitHubConnectionsTable;

      if (existingConnection) {
        // 既存の連携情報を更新
        [result] = await this.db
          .update(githubConnections)
          .set({
            accessToken: connection.accessToken || "",
            updatedAt: new Date(),
          })
          .where(eq(githubConnections.id, existingConnection.id))
          .returning();
      } else {
        // 新規連携情報を作成
        [result] = await this.db
          .insert(githubConnections)
          .values({
            id: connection.id,
            userId: userId,
            installationId: connection.installationId,
            accessToken: connection.accessToken || "",
            tokenType: "bearer", // デフォルト値
            expiresAt: "", // 必要に応じて設定
            createdAt: connection.createdAt,
            updatedAt: connection.updatedAt,
          })
          .returning();
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToGitHubConnection(result));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to add GitHub connection: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * データベースのユーザーデータをドメインモデルに変換
   * @param data データベースのユーザーデータ
   * @returns ユーザードメインモデル
   */
  private mapToUser(
    data: UsersTable & { githubConnections?: GitHubConnectionsTable[] },
  ): User {
    return {
      id: data.id,
      name: data.name,
      did: data.did,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      gitHubConnections:
        data.githubConnections?.map((conn: GitHubConnectionsTable) =>
          this.mapToGitHubConnection(conn),
        ) || [],
    };
  }

  /**
   * データベースのGitHub連携データをドメインモデルに変換
   * @param data データベースのGitHub連携データ
   * @returns GitHub連携ドメインモデル
   */
  private mapToGitHubConnection(
    data: GitHubConnectionsTable,
  ): GitHubConnection {
    return {
      id: data.id,
      userId: data.userId,
      installationId: data.installationId,
      accessToken: data.accessToken,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
