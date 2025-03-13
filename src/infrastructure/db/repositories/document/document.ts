import { eq, and } from "drizzle-orm";
import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Document } from "@/domain/document/models/document";
import type { DocumentRepository } from "@/domain/document/repositories/document";
import type { RepositoryError } from "@/domain/shared/models/common";
import { createRepositoryError } from "@/domain/shared/models/common";
import type { PgDatabase } from "../../client";
import { documents } from "../../schema";
import type { DocumentsTable } from "../../schema/types";
import { logger } from "@/lib/logger";

/**
 * 文書リポジトリの実装
 */
export class DrizzleDocumentRepository implements DocumentRepository {
  /**
   * @param db データベースクライアント
   */
  constructor(private readonly db: PgDatabase) {}

  /**
   * IDによる文書検索
   * @param id 文書ID
   * @returns 文書またはnull
   */
  async findById(id: ID): Promise<Result<Document | null, RepositoryError>> {
    try {
      logger.debug(`DocumentRepository.findById: ${id}`);
      // 文書情報を取得
      const documentData = await this.db.query.documents.findFirst({
        where: eq(documents.id, id),
      });

      if (!documentData) {
        logger.info(
          `DocumentRepository.findById: 文書が見つかりませんでした ID=${id}`,
        );
        return ok(null);
      }

      // ドメインモデルに変換して返す
      logger.debug(
        `DocumentRepository.findById: 文書が見つかりました ID=${id}`,
      );
      return ok(this.mapToDocument(documentData));
    } catch (error) {
      logger.error(
        `DocumentRepository.findById: エラーが発生しました ID=${id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find document by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * GitHubリポジトリとパスによる文書検索
   * @param gitHubRepoId GitHubリポジトリID
   * @param path 文書パス
   * @returns 文書またはnull
   */
  async findByGitHubRepoAndPath(
    gitHubRepoId: ID,
    path: string,
  ): Promise<Result<Document | null, RepositoryError>> {
    try {
      logger.debug(
        `DocumentRepository.findByGitHubRepoAndPath: repoId=${gitHubRepoId}, path=${path}`,
      );
      // 文書情報を取得
      const documentData = await this.db.query.documents.findFirst({
        where: (documents) =>
          and(
            eq(documents.gitHubRepoId, gitHubRepoId),
            eq(documents.path, path),
          ),
      });

      if (!documentData) {
        logger.info(
          `DocumentRepository.findByGitHubRepoAndPath: 文書が見つかりませんでした repoId=${gitHubRepoId}, path=${path}`,
        );
        return ok(null);
      }

      // ドメインモデルに変換して返す
      logger.debug(
        `DocumentRepository.findByGitHubRepoAndPath: 文書が見つかりました repoId=${gitHubRepoId}, path=${path}`,
      );
      return ok(this.mapToDocument(documentData));
    } catch (error) {
      logger.error(
        `DocumentRepository.findByGitHubRepoAndPath: エラーが発生しました repoId=${gitHubRepoId}, path=${path}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find document by GitHub repo and path: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * GitHubリポジトリによる文書検索
   * @param gitHubRepoId GitHubリポジトリID
   * @returns 文書の配列
   */
  async findByGitHubRepo(
    gitHubRepoId: ID,
  ): Promise<Result<Document[], RepositoryError>> {
    try {
      logger.debug(
        `DocumentRepository.findByGitHubRepo: repoId=${gitHubRepoId}`,
      );
      // 文書情報を取得
      const documentsData = await this.db.query.documents.findMany({
        where: (documents) => eq(documents.gitHubRepoId, gitHubRepoId),
      });

      logger.debug(
        `DocumentRepository.findByGitHubRepo: ${documentsData.length}件の文書が見つかりました repoId=${gitHubRepoId}`,
      );
      // ドメインモデルに変換して返す
      return ok(documentsData.map((doc) => this.mapToDocument(doc)));
    } catch (error) {
      logger.error(
        `DocumentRepository.findByGitHubRepo: エラーが発生しました repoId=${gitHubRepoId}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find documents by GitHub repo: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 文書の保存
   * @param document 文書オブジェクト
   * @returns 保存された文書
   */
  async save(document: Document): Promise<Result<Document, RepositoryError>> {
    try {
      logger.debug(`DocumentRepository.save: ${document.id}`);
      // 文書が存在するか確認
      const existingDocument = await this.db.query.documents.findFirst({
        where: (documents) => eq(documents.id, document.id),
      });

      let result: DocumentsTable;

      if (existingDocument) {
        // 既存文書の更新
        logger.debug(
          `DocumentRepository.save: 文書を更新します ID=${document.id}`,
        );
        [result] = await this.db
          .update(documents)
          .set({
            title: document.title,
            description: document.description,
            document: document.document,
            scope: document.scope,
            updatedAt: new Date(),
          })
          .where(eq(documents.id, document.id))
          .returning();
      } else {
        // 新規文書の作成
        logger.debug(
          `DocumentRepository.save: 新規文書を作成します ID=${document.id}`,
        );
        [result] = await this.db
          .insert(documents)
          .values({
            id: document.id,
            gitHubRepoId: document.gitHubRepoId,
            path: document.path,
            title: document.title,
            description: document.description,
            document: document.document,
            scope: document.scope,
            userId: document.userId,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          })
          .returning();
      }

      // ドメインモデルに変換して返す
      const savedDocument = this.mapToDocument(result);
      logger.debug(
        `DocumentRepository.save: 文書を保存しました ID=${document.id}`,
      );
      return ok(savedDocument);
    } catch (error) {
      const errorMessage = `Failed to save document: ${error instanceof Error ? error.message : "Unknown error"}`;
      logger.error(
        `DocumentRepository.save: エラーが発生しました ID=${document.id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          errorMessage,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 文書の削除
   * @param id 文書ID
   * @returns void
   */
  async delete(id: ID): Promise<Result<void, RepositoryError>> {
    try {
      logger.debug(`DocumentRepository.delete: ${id}`);
      // 文書を削除
      await this.db.delete(documents).where(eq(documents.id, id));

      logger.debug(`DocumentRepository.delete: 文書を削除しました ID=${id}`);
      return ok(undefined);
    } catch (error) {
      logger.error(
        `DocumentRepository.delete: エラーが発生しました ID=${id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to delete document: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * データベースの文書データをドメインモデルに変換
   * @param data データベースの文書データ
   * @returns 文書ドメインモデル
   */
  private mapToDocument(data: DocumentsTable): Document {
    return {
      id: data.id,
      gitHubRepoId: data.gitHubRepoId,
      path: data.path,
      title: data.title,
      description: data.description || undefined,
      document: data.document,
      scope: data.scope,
      userId: data.userId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
