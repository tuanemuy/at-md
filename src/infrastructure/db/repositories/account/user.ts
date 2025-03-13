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
import { logger } from "@/lib/logger";

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
      logger.debug(`UserRepository.findById: ${id}`);
      // ユーザー情報を取得
      const userData = await this.db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          githubConnections: true,
        },
      });

      if (!userData) {
        logger.info(
          `UserRepository.findById: ユーザーが見つかりませんでした ID=${id}`,
        );
        return ok(null);
      }

      // ドメインモデルに変換して返す
      logger.debug(
        `UserRepository.findById: ユーザーが見つかりました ID=${id}`,
      );
      return ok(this.mapToUser(userData));
    } catch (error) {
      logger.error(
        `UserRepository.findById: エラーが発生しました ID=${id}`,
        error,
      );
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
   * @param did ユーザーDID
   * @returns ユーザーまたはnull
   */
  async findByDid(did: string): Promise<Result<User | null, RepositoryError>> {
    try {
      logger.debug(`UserRepository.findByDid: ${did}`);
      // ユーザー情報を取得
      const userData = await this.db.query.users.findFirst({
        where: eq(users.did, did),
        with: {
          githubConnections: true,
        },
      });

      if (!userData) {
        logger.info(
          `UserRepository.findByDid: ユーザーが見つかりませんでした DID=${did}`,
        );
        return ok(null);
      }

      // ドメインモデルに変換して返す
      logger.debug(
        `UserRepository.findByDid: ユーザーが見つかりました DID=${did}`,
      );
      return ok(this.mapToUser(userData));
    } catch (error) {
      logger.error(
        `UserRepository.findByDid: エラーが発生しました DID=${did}`,
        error,
      );
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
      logger.debug(`UserRepository.save: ${user.id}`);
      // ユーザーが存在するか確認
      const existingUser = await this.db.query.users.findFirst({
        where: (users) => eq(users.id, user.id),
      });

      let result: UsersTable;

      if (existingUser) {
        // 既存ユーザーの更新
        logger.debug(`UserRepository.save: ユーザーを更新します ID=${user.id}`);
        [result] = await this.db
          .update(users)
          .set({
            name: user.name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        // 新規ユーザーの作成
        logger.debug(
          `UserRepository.save: 新規ユーザーを作成します ID=${user.id}`,
        );
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

      // GitHubコネクションの保存
      if (user.gitHubConnections && user.gitHubConnections.length > 0) {
        logger.debug(
          `UserRepository.save: GitHubコネクションを保存します userId=${user.id}`,
        );
        for (const connection of user.gitHubConnections) {
          await this.saveGitHubConnection(user.id, connection);
        }
      }

      // GitHubコネクションを取得
      const connections = await this.db.query.githubConnections.findMany({
        where: (githubConnections) => eq(githubConnections.userId, result.id),
      });

      // ユーザーオブジェクトを作成して返す
      const savedUser = this.mapToUser({
        ...result,
        githubConnections: connections,
      });
      return ok(savedUser);
    } catch (error) {
      logger.error(
        `UserRepository.save: エラーが発生しました ID=${user.id}`,
        error,
      );
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
   * GitHubコネクションの追加
   * @param userId ユーザーID
   * @param connection GitHubコネクション
   * @returns 保存されたGitHubコネクション
   */
  async addGitHubConnection(
    userId: ID,
    connection: GitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      logger.debug(
        `UserRepository.addGitHubConnection: userId=${userId}, installationId=${connection.installationId}`,
      );
      // ユーザーが存在するか確認
      const userExists = await this.db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!userExists) {
        logger.error(
          `UserRepository.addGitHubConnection: ユーザーが見つかりませんでした userId=${userId}`,
        );
        return err(
          createRepositoryError(
            "NOT_FOUND",
            `User with ID ${userId} not found`,
          ),
        );
      }

      return await this.saveGitHubConnection(userId, connection);
    } catch (error) {
      logger.error(
        `UserRepository.addGitHubConnection: エラーが発生しました userId=${userId}`,
        error,
      );
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
   * GitHubコネクションの保存（内部メソッド）
   * @param userId ユーザーID
   * @param connection GitHubコネクション
   * @returns 保存されたGitHubコネクション
   */
  private async saveGitHubConnection(
    userId: ID,
    connection: GitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>> {
    try {
      logger.debug(
        `UserRepository.saveGitHubConnection: userId=${userId}, installationId=${connection.installationId}`,
      );
      // GitHubコネクションが存在するか確認
      const existingConnection =
        await this.db.query.githubConnections.findFirst({
          where: eq(githubConnections.id, connection.id),
        });

      let result: GitHubConnectionsTable;

      if (existingConnection) {
        // 既存GitHubコネクションの更新
        logger.debug(
          `UserRepository.saveGitHubConnection: GitHubコネクションを更新します ID=${connection.id}`,
        );
        [result] = await this.db
          .update(githubConnections)
          .set({
            accessToken: connection.accessToken ?? "",
            updatedAt: new Date(),
          })
          .where(eq(githubConnections.id, connection.id))
          .returning();
      } else {
        // 新規GitHubコネクションの作成
        logger.debug(
          `UserRepository.saveGitHubConnection: 新規GitHubコネクションを作成します ID=${connection.id}`,
        );
        [result] = await this.db
          .insert(githubConnections)
          .values({
            id: connection.id,
            userId,
            installationId: connection.installationId,
            accessToken: connection.accessToken ?? "",
            tokenType: "bearer", // デフォルト値を設定
            expiresAt: "9999-12-31", // 遠い将来の日付を設定
            createdAt: connection.createdAt,
            updatedAt: connection.updatedAt,
          })
          .returning();
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToGitHubConnection(result));
    } catch (error) {
      logger.error(
        `UserRepository.saveGitHubConnection: エラーが発生しました userId=${userId}`,
        error,
      );
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
      gitHubConnections: data.githubConnections
        ? data.githubConnections.map((conn) => this.mapToGitHubConnection(conn))
        : [],
    };
  }

  /**
   * データベースのGitHubコネクションデータをドメインモデルに変換
   * @param data データベースのGitHubコネクションデータ
   * @returns GitHubコネクションドメインモデル
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
