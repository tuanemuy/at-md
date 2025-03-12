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
      // 文書情報を取得
      const documentData = await this.db.query.documents.findFirst({
        where: eq(documents.id, id),
      });

      if (!documentData) {
        return ok(null);
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToDocument(documentData));
    } catch (error) {
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
   * @param path ファイルパス
   * @returns 文書またはnull
   */
  async findByGitHubRepoAndPath(
    gitHubRepoId: ID,
    path: string,
  ): Promise<Result<Document | null, RepositoryError>> {
    try {
      // 文書情報を取得
      const documentData = await this.db.query.documents.findFirst({
        where: and(
          eq(documents.gitHubRepoId, gitHubRepoId),
          eq(documents.path, path),
        ),
      });

      if (!documentData) {
        return ok(null);
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToDocument(documentData));
    } catch (error) {
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
      // 文書情報を取得
      const documentsData = await this.db.query.documents.findMany({
        where: eq(documents.gitHubRepoId, gitHubRepoId),
      });

      // ドメインモデルに変換して返す
      return ok(documentsData.map((doc) => this.mapToDocument(doc)));
    } catch (error) {
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
      // 文書が存在するか確認
      const existingDocument = await this.db.query.documents.findFirst({
        where: eq(documents.id, document.id),
      });

      let result: DocumentsTable;

      if (existingDocument) {
        // 既存文書の更新
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
        [result] = await this.db
          .insert(documents)
          .values({
            id: document.id,
            gitHubRepoId: document.gitHubRepoId,
            userId: document.userId,
            path: document.path,
            title: document.title,
            description: document.description,
            document: document.document,
            scope: document.scope,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          })
          .returning();
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToDocument(result));
    } catch (error) {
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to save document: ${error instanceof Error ? error.message : "Unknown error"}`,
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
      userId: data.userId,
      path: data.path,
      title: data.title,
      description: data.description ?? undefined,
      document: data.document,
      scope: data.scope,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
