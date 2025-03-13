import { eq } from "drizzle-orm";
import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { GitHubRepo } from "@/domain/document/models/githubRepo";
import type { GitHubRepoRepository } from "@/domain/document/repositories/githubRepo";
import type { RepositoryError } from "@/domain/shared/models/common";
import { createRepositoryError } from "@/domain/shared/models/common";
import type { PgDatabase } from "../../client";
import { githubRepos } from "../../schema";
import type { GitHubReposTable } from "../../schema/types";
import { logger } from "@/lib/logger";

/**
 * GitHubリポジトリリポジトリの実装
 */
export class DrizzleGitHubRepoRepository implements GitHubRepoRepository {
  /**
   * @param db データベースクライアント
   */
  constructor(private readonly db: PgDatabase) {}

  /**
   * IDによるGitHubリポジトリ検索
   * @param id GitHubリポジトリID
   * @returns GitHubリポジトリまたはnull
   */
  async findById(id: ID): Promise<Result<GitHubRepo | null, RepositoryError>> {
    try {
      logger.debug(`GitHubRepoRepository.findById: ${id}`);
      // GitHubリポジトリ情報を取得
      const repoData = await this.db.query.githubRepos.findFirst({
        where: eq(githubRepos.id, id),
      });

      if (!repoData) {
        logger.info(
          `GitHubRepoRepository.findById: リポジトリが見つかりませんでした ID=${id}`,
        );
        return ok(null);
      }

      // ドメインモデルに変換して返す
      logger.debug(
        `GitHubRepoRepository.findById: リポジトリが見つかりました ID=${id}`,
      );
      return ok(this.mapToGitHubRepo(repoData));
    } catch (error) {
      logger.error(
        `GitHubRepoRepository.findById: エラーが発生しました ID=${id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find GitHub repository by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * フルネームによるGitHubリポジトリ検索
   * @param fullName GitHubリポジトリのフルネーム（owner/name）
   * @returns GitHubリポジトリまたはnull
   */
  async findByFullName(
    fullName: string,
  ): Promise<Result<GitHubRepo | null, RepositoryError>> {
    try {
      logger.debug(`GitHubRepoRepository.findByFullName: ${fullName}`);
      // GitHubリポジトリ情報を取得
      const repoData = await this.db.query.githubRepos.findFirst({
        where: (githubRepos) => eq(githubRepos.fullName, fullName),
      });

      if (!repoData) {
        logger.info(
          `GitHubRepoRepository.findByFullName: リポジトリが見つかりませんでした fullName=${fullName}`,
        );
        return ok(null);
      }

      // ドメインモデルに変換して返す
      logger.debug(
        `GitHubRepoRepository.findByFullName: リポジトリが見つかりました fullName=${fullName}`,
      );
      return ok(this.mapToGitHubRepo(repoData));
    } catch (error) {
      logger.error(
        `GitHubRepoRepository.findByFullName: エラーが発生しました fullName=${fullName}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find GitHub repository by full name: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * ユーザーIDによるGitHubリポジトリ検索
   * @param userId ユーザーID
   * @returns GitHubリポジトリの配列
   */
  async findByUserId(
    userId: ID,
  ): Promise<Result<GitHubRepo[], RepositoryError>> {
    try {
      logger.debug(`GitHubRepoRepository.findByUserId: ${userId}`);
      // GitHubリポジトリ情報を取得
      const reposData = await this.db.query.githubRepos.findMany({
        where: (githubRepos) => eq(githubRepos.userId, userId),
      });

      // ドメインモデルに変換して返す
      logger.debug(
        `GitHubRepoRepository.findByUserId: ${reposData.length}件のリポジトリが見つかりました userId=${userId}`,
      );
      return ok(reposData.map((repo) => this.mapToGitHubRepo(repo)));
    } catch (error) {
      logger.error(
        `GitHubRepoRepository.findByUserId: エラーが発生しました userId=${userId}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find GitHub repositories by user ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * インストールIDによるGitHubリポジトリ検索
   * @param installationId GitHubアプリのインストールID
   * @returns GitHubリポジトリの配列
   */
  async findByInstallationId(
    installationId: string,
  ): Promise<Result<GitHubRepo[], RepositoryError>> {
    try {
      logger.debug(
        `GitHubRepoRepository.findByInstallationId: ${installationId}`,
      );
      // GitHubリポジトリ情報を取得
      const reposData = await this.db.query.githubRepos.findMany({
        where: eq(githubRepos.installationId, installationId),
      });

      // ドメインモデルに変換して返す
      logger.debug(
        `GitHubRepoRepository.findByInstallationId: ${reposData.length}件のリポジトリが見つかりました installationId=${installationId}`,
      );
      return ok(reposData.map((repo) => this.mapToGitHubRepo(repo)));
    } catch (error) {
      logger.error(
        `GitHubRepoRepository.findByInstallationId: エラーが発生しました installationId=${installationId}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find GitHub repositories by installation ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * GitHubリポジトリの保存
   * @param repo GitHubリポジトリオブジェクト
   * @returns 保存されたGitHubリポジトリ
   */
  async save(repo: GitHubRepo): Promise<Result<GitHubRepo, RepositoryError>> {
    try {
      logger.debug(`GitHubRepoRepository.save: ${repo.id}`);
      // GitHubリポジトリが存在するか確認
      const existingRepo = await this.db.query.githubRepos.findFirst({
        where: (githubRepos) => eq(githubRepos.id, repo.id),
      });

      let result: GitHubReposTable;

      if (existingRepo) {
        // 既存GitHubリポジトリの更新
        logger.debug(
          `GitHubRepoRepository.save: リポジトリを更新します ID=${repo.id}`,
        );
        [result] = await this.db
          .update(githubRepos)
          .set({
            name: repo.name,
            owner: repo.owner,
            fullName: repo.fullName,
            installationId: repo.installationId,
            webhookSecret: repo.webhookSecret,
            updatedAt: new Date(),
          })
          .where(eq(githubRepos.id, repo.id))
          .returning();
      } else {
        // 新規GitHubリポジトリの作成
        logger.debug(
          `GitHubRepoRepository.save: 新規リポジトリを作成します ID=${repo.id}`,
        );
        [result] = await this.db
          .insert(githubRepos)
          .values({
            id: repo.id,
            name: repo.name,
            owner: repo.owner,
            fullName: repo.fullName,
            installationId: repo.installationId,
            webhookSecret: repo.webhookSecret,
            userId: repo.userId,
            createdAt: repo.createdAt,
            updatedAt: repo.updatedAt,
          })
          .returning();
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToGitHubRepo(result));
    } catch (error) {
      logger.error(
        `GitHubRepoRepository.save: エラーが発生しました ID=${repo.id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to save GitHub repository: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * データベースのGitHubリポジトリデータをドメインモデルに変換
   * @param data データベースのGitHubリポジトリデータ
   * @returns GitHubリポジトリドメインモデル
   */
  private mapToGitHubRepo(data: GitHubReposTable): GitHubRepo {
    return {
      id: data.id,
      owner: data.owner,
      name: data.name,
      fullName: data.fullName,
      installationId: data.installationId,
      webhookSecret: data.webhookSecret ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      userId: data.userId,
    };
  }

  /**
   * GitHubリポジトリの削除
   * @param id GitHubリポジトリID
   * @returns void
   */
  async delete(id: ID): Promise<Result<void, RepositoryError>> {
    try {
      logger.debug(`GitHubRepoRepository.delete: ${id}`);
      // GitHubリポジトリを削除
      await this.db.delete(githubRepos).where(eq(githubRepos.id, id));

      logger.debug(`GitHubRepoRepository.delete: リポジトリを削除しました ID=${id}`);
      return ok(undefined);
    } catch (error) {
      logger.error(
        `GitHubRepoRepository.delete: エラーが発生しました ID=${id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to delete GitHub repository: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}
