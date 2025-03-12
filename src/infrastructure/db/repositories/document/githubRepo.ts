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
      // GitHubリポジトリ情報を取得
      const repoData = await this.db.query.githubRepos.findFirst({
        where: eq(githubRepos.id, id),
      });

      if (!repoData) {
        return ok(null);
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToGitHubRepo(repoData));
    } catch (error) {
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
   * @param fullName リポジトリのフルネーム（owner/name）
   * @returns GitHubリポジトリまたはnull
   */
  async findByFullName(
    fullName: string,
  ): Promise<Result<GitHubRepo | null, RepositoryError>> {
    try {
      // GitHubリポジトリ情報を取得
      const repoData = await this.db.query.githubRepos.findFirst({
        where: eq(githubRepos.fullName, fullName),
      });

      if (!repoData) {
        return ok(null);
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToGitHubRepo(repoData));
    } catch (error) {
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
      // GitHubリポジトリ情報を取得
      const reposData = await this.db.query.githubRepos.findMany({
        where: eq(githubRepos.userId, userId),
      });

      // ドメインモデルに変換して返す
      return ok(reposData.map((repo) => this.mapToGitHubRepo(repo)));
    } catch (error) {
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
   * GitHubリポジトリの保存
   * @param gitHubRepo GitHubリポジトリオブジェクト
   * @returns 保存されたGitHubリポジトリ
   */
  async save(
    gitHubRepo: GitHubRepo,
  ): Promise<Result<GitHubRepo, RepositoryError>> {
    try {
      // GitHubリポジトリが存在するか確認
      const existingRepo = await this.db.query.githubRepos.findFirst({
        where: eq(githubRepos.id, gitHubRepo.id),
      });

      let result: GitHubReposTable;

      if (existingRepo) {
        // 既存GitHubリポジトリの更新
        [result] = await this.db
          .update(githubRepos)
          .set({
            owner: gitHubRepo.owner,
            name: gitHubRepo.name,
            fullName: gitHubRepo.fullName,
            installationId: gitHubRepo.installationId,
            webhookSecret: gitHubRepo.webhookSecret,
            updatedAt: new Date(),
          })
          .where(eq(githubRepos.id, gitHubRepo.id))
          .returning();
      } else {
        // 新規GitHubリポジトリの作成
        [result] = await this.db
          .insert(githubRepos)
          .values({
            id: gitHubRepo.id,
            owner: gitHubRepo.owner,
            name: gitHubRepo.name,
            fullName: gitHubRepo.fullName,
            installationId: gitHubRepo.installationId,
            webhookSecret: gitHubRepo.webhookSecret,
            userId: gitHubRepo.userId,
            // スキーマにあるがドメインモデルにないフィールドのデフォルト値設定
            description: "",
            defaultBranch: "main",
            private: false,
            createdAt: gitHubRepo.createdAt,
            updatedAt: gitHubRepo.updatedAt,
          })
          .returning();
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToGitHubRepo(result));
    } catch (error) {
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
}
