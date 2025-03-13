import { eq, and } from "drizzle-orm";
import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Tag, DocumentTag } from "@/domain/document/models/tag";
import type {
  TagRepository,
  DocumentTagRepository,
} from "@/domain/document/repositories/tag";
import type { RepositoryError } from "@/domain/shared/models/common";
import { createRepositoryError } from "@/domain/shared/models/common";
import type { PgDatabase } from "../../client";
import { tags, documentTags, documents } from "../../schema";
import type { TagsTable, DocumentTagsTable } from "../../schema/types";
import { logger } from "@/lib/logger";

/**
 * タグリポジトリの実装
 */
export class DrizzleTagRepository implements TagRepository {
  /**
   * @param db データベースクライアント
   */
  constructor(private readonly db: PgDatabase) {}

  /**
   * IDによるタグ検索
   * @param id タグID
   * @returns タグまたはnull
   */
  async findById(id: ID): Promise<Result<Tag | null, RepositoryError>> {
    try {
      logger.debug(`TagRepository.findById: ${id}`);
      // タグ情報を取得
      const tagData = await this.db.query.tags.findFirst({
        where: eq(tags.id, id),
      });

      if (!tagData) {
        logger.info(
          `TagRepository.findById: タグが見つかりませんでした ID=${id}`,
        );
        return ok(null);
      }

      // ドメインモデルに変換して返す
      logger.debug(`TagRepository.findById: タグが見つかりました ID=${id}`);
      return ok(this.mapToTag(tagData));
    } catch (error) {
      logger.error(
        `TagRepository.findById: エラーが発生しました ID=${id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find tag by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * スラッグによるタグ検索
   * @param slug タグスラッグ
   * @returns タグまたはnull
   */
  async findBySlug(slug: string): Promise<Result<Tag | null, RepositoryError>> {
    try {
      logger.debug(`TagRepository.findBySlug: ${slug}`);
      // タグ情報を取得
      // 注意: ドメインモデルにはslugフィールドがないため、nameフィールドで検索
      const tagData = await this.db.query.tags.findFirst({
        where: eq(tags.name, slug),
      });

      if (!tagData) {
        logger.info(
          `TagRepository.findBySlug: タグが見つかりませんでした slug=${slug}`,
        );
        return ok(null);
      }

      // ドメインモデルに変換して返す
      logger.debug(
        `TagRepository.findBySlug: タグが見つかりました slug=${slug}`,
      );
      return ok(this.mapToTag(tagData));
    } catch (error) {
      logger.error(
        `TagRepository.findBySlug: エラーが発生しました slug=${slug}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find tag by slug: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * ユーザーIDによるタグ検索
   * @param userId ユーザーID
   * @returns タグの配列
   */
  async findByUserId(userId: ID): Promise<Result<Tag[], RepositoryError>> {
    try {
      logger.debug(`TagRepository.findByUserId: ${userId}`);
      // タグ情報を取得
      const tagsData = await this.db.query.tags.findMany({
        where: eq(tags.userId, userId),
      });

      // ドメインモデルに変換して返す
      logger.debug(
        `TagRepository.findByUserId: ${tagsData.length}件のタグが見つかりました userId=${userId}`,
      );
      return ok(tagsData.map((tag) => this.mapToTag(tag)));
    } catch (error) {
      logger.error(
        `TagRepository.findByUserId: エラーが発生しました userId=${userId}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find tags by user ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 文書IDによるタグ検索
   * @param documentId 文書ID
   * @returns タグの配列
   */
  async findByDocumentId(
    documentId: ID,
  ): Promise<Result<Tag[], RepositoryError>> {
    try {
      logger.debug(`TagRepository.findByDocumentId: ${documentId}`);
      // 文書に関連するタグIDを取得
      const documentTagsData = await this.db.query.documentTags.findMany({
        where: eq(documentTags.documentId, documentId),
      });

      if (documentTagsData.length === 0) {
        logger.info(
          `TagRepository.findByDocumentId: タグが見つかりませんでした documentId=${documentId}`,
        );
        return ok([]);
      }

      // タグIDの配列を作成
      const tagIds = documentTagsData.map((dt) => dt.tagId);

      // タグ情報を取得
      const tagsData = await this.db.query.tags.findMany({
        where: eq(tags.id, tagIds[0]),
      });

      if (tagIds.length > 1) {
        const additionalTags = await Promise.all(
          tagIds.slice(1).map((tagId) =>
            this.db.query.tags.findFirst({
              where: eq(tags.id, tagId),
            }),
          ),
        );

        // nullでない結果だけをフィルタリングして追加
        const filteredTags = additionalTags.filter(
          (tag): tag is NonNullable<typeof tag> => tag !== null,
        );
        for (const tag of filteredTags) {
          tagsData.push(tag);
        }
      }

      // ドメインモデルに変換して返す
      logger.debug(
        `TagRepository.findByDocumentId: ${tagsData.length}件のタグが見つかりました documentId=${documentId}`,
      );
      return ok(tagsData.map((tag) => this.mapToTag(tag)));
    } catch (error) {
      logger.error(
        `TagRepository.findByDocumentId: エラーが発生しました documentId=${documentId}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find tags by document ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * タグの保存
   * @param tag タグオブジェクト
   * @returns 保存されたタグ
   */
  async save(tag: Tag): Promise<Result<Tag, RepositoryError>> {
    try {
      logger.debug(`TagRepository.save: ${tag.id}`);
      // タグが存在するか確認
      const existingTag = await this.db.query.tags.findFirst({
        where: eq(tags.id, tag.id),
      });

      let result: TagsTable;

      if (existingTag) {
        // 既存タグの更新
        logger.debug(`TagRepository.save: タグを更新します ID=${tag.id}`);
        [result] = await this.db
          .update(tags)
          .set({
            name: tag.name,
            updatedAt: new Date(),
          })
          .where(eq(tags.id, tag.id))
          .returning();
      } else {
        // 新規タグの作成
        logger.debug(`TagRepository.save: 新規タグを作成します ID=${tag.id}`);
        [result] = await this.db
          .insert(tags)
          .values({
            id: tag.id,
            name: tag.name,
            userId: tag.userId,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
          })
          .returning();
      }

      // ドメインモデルに変換して返す
      return ok(this.mapToTag(result));
    } catch (error) {
      logger.error(
        `TagRepository.save: エラーが発生しました ID=${tag.id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to save tag: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * タグの削除
   * @param id タグID
   * @returns void
   */
  async delete(id: ID): Promise<Result<void, RepositoryError>> {
    try {
      logger.debug(`TagRepository.delete: ${id}`);
      // タグを削除
      await this.db.delete(tags).where(eq(tags.id, id));

      logger.info(`TagRepository.delete: タグを削除しました ID=${id}`);
      return ok(undefined);
    } catch (error) {
      logger.error(
        `TagRepository.delete: エラーが発生しました ID=${id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to delete tag: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * データベースのタグデータをドメインモデルに変換
   * @param data データベースのタグデータ
   * @returns タグドメインモデル
   */
  private mapToTag(data: TagsTable): Tag {
    return {
      id: data.id,
      name: data.name,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      userId: data.userId,
    };
  }
}

/**
 * 文書タグリポジトリの実装
 */
export class DrizzleDocumentTagRepository implements DocumentTagRepository {
  /**
   * @param db データベースクライアント
   */
  constructor(private readonly db: PgDatabase) {}

  /**
   * 文書IDによる文書タグ検索
   * @param documentId 文書ID
   * @returns 文書タグの配列
   */
  async findByDocumentId(
    documentId: ID,
  ): Promise<Result<DocumentTag[], RepositoryError>> {
    try {
      logger.debug(`DocumentTagRepository.findByDocumentId: ${documentId}`);
      // 文書タグ情報を取得
      const documentTagsData = await this.db.query.documentTags.findMany({
        where: eq(documentTags.documentId, documentId),
      });

      // ドメインモデルに変換して返す
      logger.debug(
        `DocumentTagRepository.findByDocumentId: ${documentTagsData.length}件の文書タグが見つかりました documentId=${documentId}`,
      );
      return ok(documentTagsData.map((dt) => this.mapToDocumentTag(dt)));
    } catch (error) {
      logger.error(
        `DocumentTagRepository.findByDocumentId: エラーが発生しました documentId=${documentId}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find document tags by document ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * タグIDによる文書タグ検索
   * @param tagId タグID
   * @returns 文書タグの配列
   */
  async findByTagId(
    tagId: ID,
  ): Promise<Result<DocumentTag[], RepositoryError>> {
    try {
      logger.debug(`DocumentTagRepository.findByTagId: ${tagId}`);
      // 文書タグ情報を取得
      const documentTagsData = await this.db.query.documentTags.findMany({
        where: eq(documentTags.tagId, tagId),
      });

      // ドメインモデルに変換して返す
      logger.debug(
        `DocumentTagRepository.findByTagId: ${documentTagsData.length}件の文書タグが見つかりました tagId=${tagId}`,
      );
      return ok(documentTagsData.map((dt) => this.mapToDocumentTag(dt)));
    } catch (error) {
      logger.error(
        `DocumentTagRepository.findByTagId: エラーが発生しました tagId=${tagId}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to find document tags by tag ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 文書タグの保存
   * @param documentTag 文書タグオブジェクト
   * @returns 保存された文書タグ
   */
  async save(
    documentTag: DocumentTag,
  ): Promise<Result<DocumentTag, RepositoryError>> {
    try {
      logger.debug(
        `DocumentTagRepository.save: documentId=${documentTag.documentId}, tagId=${documentTag.tagId}`,
      );
      // 文書タグが存在するか確認
      const existingDocumentTag = await this.db.query.documentTags.findFirst({
        where: and(
          eq(documentTags.documentId, documentTag.documentId),
          eq(documentTags.tagId, documentTag.tagId),
        ),
      });

      if (existingDocumentTag) {
        // 既に存在する場合は既存のものを返す
        logger.info(
          `DocumentTagRepository.save: 文書タグが既に存在します documentId=${documentTag.documentId}, tagId=${documentTag.tagId}`,
        );
        return ok(this.mapToDocumentTag(existingDocumentTag));
      }

      // 新規文書タグの作成
      logger.debug(
        `DocumentTagRepository.save: 新規文書タグを作成します ID=${documentTag.id}`,
      );
      const [result] = await this.db
        .insert(documentTags)
        .values({
          id: documentTag.id,
          documentId: documentTag.documentId,
          tagId: documentTag.tagId,
          createdAt: documentTag.createdAt,
          updatedAt: new Date(),
        })
        .returning();

      // ドメインモデルに変換して返す
      return ok(this.mapToDocumentTag(result));
    } catch (error) {
      logger.error(
        `DocumentTagRepository.save: エラーが発生しました ID=${documentTag.id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to save document tag: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 文書タグの削除
   * @param id 文書タグID
   * @returns void
   */
  async delete(id: ID): Promise<Result<void, RepositoryError>> {
    try {
      logger.debug(`DocumentTagRepository.delete: ${id}`);
      // 文書タグを削除
      await this.db.delete(documentTags).where(eq(documentTags.id, id));

      logger.info(
        `DocumentTagRepository.delete: 文書タグを削除しました ID=${id}`,
      );
      return ok(undefined);
    } catch (error) {
      logger.error(
        `DocumentTagRepository.delete: エラーが発生しました ID=${id}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to delete document tag: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * 文書IDとタグIDによる文書タグの削除
   * @param documentId 文書ID
   * @param tagId タグID
   * @returns void
   */
  async deleteByDocumentIdAndTagId(
    documentId: ID,
    tagId: ID,
  ): Promise<Result<void, RepositoryError>> {
    try {
      logger.debug(
        `DocumentTagRepository.deleteByDocumentIdAndTagId: documentId=${documentId}, tagId=${tagId}`,
      );
      // 文書タグを削除
      await this.db
        .delete(documentTags)
        .where(
          and(
            eq(documentTags.documentId, documentId),
            eq(documentTags.tagId, tagId),
          ),
        );

      logger.info(
        `DocumentTagRepository.deleteByDocumentIdAndTagId: 文書タグを削除しました documentId=${documentId}, tagId=${tagId}`,
      );
      return ok(undefined);
    } catch (error) {
      logger.error(
        `DocumentTagRepository.deleteByDocumentIdAndTagId: エラーが発生しました documentId=${documentId}, tagId=${tagId}`,
        error,
      );
      return err(
        createRepositoryError(
          "DATABASE_ERROR",
          `Failed to delete document tag by document ID and tag ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * データベースの文書タグデータをドメインモデルに変換
   * @param data データベースの文書タグデータ
   * @returns 文書タグドメインモデル
   */
  private mapToDocumentTag(data: DocumentTagsTable): DocumentTag {
    return {
      id: data.id,
      documentId: data.documentId,
      tagId: data.tagId,
      createdAt: data.createdAt,
    };
  }
}
