/**
 * Drizzleを使用したコンテンツリポジトリの実装
 */

import { ContentRepository } from "../../application/content/repositories/content-repository.ts";
import { ContentAggregate, createContentAggregate } from "../../core/content/aggregates/content-aggregate.ts";
import { createContent } from "../../core/content/entities/content.ts";
import { createContentMetadata } from "../../core/content/value-objects/content-metadata.ts";
import { eq, and, type NodePgDatabase } from "../../deps.ts";
import { contents, contentMetadata } from "../database/schema/content.ts";
import { ContentCreatedEvent, ContentUpdatedEvent, ContentDeletedEvent } from "../../core/content/events/content-events.ts";
import { EventBus } from "../../core/common/events/domain-event.ts";
import { Result, ok, err } from "../../deps.ts";
import { InfrastructureError } from "../../core/errors/base.ts";
import { TransactionContext } from "../database/unit-of-work.ts";
import { PostgresTransactionContext } from "../database/postgres-unit-of-work.ts";

/**
 * スキーマの型定義
 * データベーススキーマの型情報を提供します
 */
type Schema = {
  contents: typeof contents;
  contentMetadata: typeof contentMetadata;
};

/**
 * リポジトリエラーの型定義
 * リポジトリ操作中に発生するエラーを表現する型
 */
export type RepositoryError = {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** エラーの原因（オプション） */
  cause?: unknown;
};

/**
 * Drizzleを使用したコンテンツリポジトリの実装
 * PostgreSQLデータベースとの連携を担当します
 */
export class DrizzleContentRepository implements ContentRepository {
  /**
   * データベース接続
   * @private
   */
  private db: NodePgDatabase<Schema>;
  
  /**
   * コンストラクタ
   * @param db データベース接続
   */
  constructor(db: NodePgDatabase<Schema>) {
    this.db = db;
  }
  
  /**
   * IDによってコンテンツを検索する
   * @param id コンテンツID
   * @returns コンテンツ集約、存在しない場合はnull
   * @throws RepositoryError データベース操作に失敗した場合
   */
  async findById(id: string): Promise<ContentAggregate | null> {
    try {
      // コンテンツを検索
      const contentResult = await this.db.select()
        .from(contents)
        .where(eq(contents.id, id))
        .limit(1);
      
      if (contentResult.length === 0) {
        return null;
      }
      
      // メタデータを検索
      const metadataResult = await this.db.select()
        .from(contentMetadata)
        .where(eq(contentMetadata.contentId, id))
        .limit(1);
      
      // コンテンツエンティティを作成
      const content = createContent({
        id: contentResult[0].id,
        userId: contentResult[0].userId,
        repositoryId: contentResult[0].repositoryId,
        path: contentResult[0].path,
        title: contentResult[0].title,
        body: contentResult[0].body,
        visibility: contentResult[0].visibility as "private" | "unlisted" | "public",
        versions: [], // バージョン情報は別途取得する必要がある
        metadata: createContentMetadata({
          tags: metadataResult.length > 0 ? metadataResult[0].tags as string[] : [],
          categories: metadataResult.length > 0 ? metadataResult[0].categories as string[] : [],
          language: metadataResult.length > 0 ? metadataResult[0].language : "ja"
        }),
        createdAt: contentResult[0].createdAt,
        updatedAt: contentResult[0].updatedAt
      });
      
      // コンテンツ集約を作成
      return createContentAggregate(content);
    } catch (error) {
      const repositoryError: RepositoryError = {
        code: "FIND_BY_ID_ERROR",
        message: `コンテンツの検索に失敗しました: ${id}`,
        cause: error
      };
      console.error(repositoryError);
      throw repositoryError;
    }
  }
  
  /**
   * リポジトリIDとパスによってコンテンツを検索する
   * @param repositoryId リポジトリID
   * @param path パス
   * @returns コンテンツ集約、存在しない場合はnull
   * @throws RepositoryError データベース操作に失敗した場合
   */
  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null> {
    try {
      // コンテンツを検索
      const contentResult = await this.db.select()
        .from(contents)
        .where(
          and(
            eq(contents.repositoryId, repositoryId),
            eq(contents.path, path)
          )
        )
        .limit(1);
      
      if (contentResult.length === 0) {
        return null;
      }
      
      // IDで検索
      return this.findById(contentResult[0].id);
    } catch (error) {
      const repositoryError: RepositoryError = {
        code: "FIND_BY_REPO_AND_PATH_ERROR",
        message: `リポジトリIDとパスによるコンテンツの検索に失敗しました: ${repositoryId}, ${path}`,
        cause: error
      };
      console.error(repositoryError);
      throw repositoryError;
    }
  }
  
  /**
   * ユーザーIDによってコンテンツを検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns コンテンツ集約の配列
   * @throws RepositoryError データベース操作に失敗した場合
   */
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    try {
      // クエリを構築
      let query = this.db.select()
        .from(contents)
        .where(eq(contents.userId, userId));
      
      // オプションを適用
      if (options?.limit !== undefined) {
        // @ts-ignore: Drizzle ORMの型定義の問題
        query = query.limit(options.limit);
      }
      
      if (options?.offset !== undefined) {
        // @ts-ignore: Drizzle ORMの型定義の問題
        query = query.offset(options.offset);
      }
      
      // コンテンツを検索
      const contentResults = await query;
      
      // 結果が空の場合は空配列を返す
      if (!contentResults || !Array.isArray(contentResults) || contentResults.length === 0) {
        return [];
      }
      
      // 各コンテンツをIDで検索して集約を取得
      const contentPromises = [];
      for (const content of contentResults) {
        if (content && content.id) {
          contentPromises.push(this.findById(content.id));
        }
      }
      
      const contentAggregates = await Promise.all(contentPromises);
      
      // nullを除外
      return contentAggregates.filter((aggregate): aggregate is ContentAggregate => aggregate !== null);
    } catch (error) {
      const repositoryError: RepositoryError = {
        code: "FIND_BY_USER_ID_ERROR",
        message: `ユーザーIDによるコンテンツの検索に失敗しました: ${userId}`,
        cause: error
      };
      console.error(repositoryError);
      throw repositoryError;
    }
  }
  
  /**
   * リポジトリIDによってコンテンツを検索する
   * @param repositoryId リポジトリID
   * @param options 検索オプション
   * @returns コンテンツ集約の配列
   * @throws RepositoryError データベース操作に失敗した場合
   */
  async findByRepositoryId(repositoryId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    try {
      // クエリを構築
      let query = this.db.select()
        .from(contents)
        .where(eq(contents.repositoryId, repositoryId));
      
      // オプションを適用
      if (options?.limit !== undefined) {
        // @ts-ignore: Drizzle ORMの型定義の問題
        query = query.limit(options.limit);
      }
      
      if (options?.offset !== undefined) {
        // @ts-ignore: Drizzle ORMの型定義の問題
        query = query.offset(options.offset);
      }
      
      // コンテンツを検索
      const contentResults = await query;
      
      // 結果が空の場合は空配列を返す
      if (!contentResults || !Array.isArray(contentResults) || contentResults.length === 0) {
        return [];
      }
      
      // 各コンテンツをIDで検索して集約を取得
      const contentPromises = [];
      for (const content of contentResults) {
        if (content && content.id) {
          contentPromises.push(this.findById(content.id));
        }
      }
      
      const contentAggregates = await Promise.all(contentPromises);
      
      // nullを除外
      return contentAggregates.filter((aggregate): aggregate is ContentAggregate => aggregate !== null);
    } catch (error) {
      const repositoryError: RepositoryError = {
        code: "FIND_BY_REPOSITORY_ID_ERROR",
        message: `リポジトリIDによるコンテンツの検索に失敗しました: ${repositoryId}`,
        cause: error
      };
      console.error(repositoryError);
      throw repositoryError;
    }
  }
  
  /**
   * トランザクション内でコンテンツを保存する
   * @param contentAggregate コンテンツ集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたコンテンツ集約の結果
   */
  async saveWithTransaction(
    contentAggregate: ContentAggregate,
    context: TransactionContext
  ): Promise<Result<ContentAggregate, InfrastructureError>> {
    try {
      // PostgreSQLのトランザクションコンテキストにキャスト
      const pgContext = context as PostgresTransactionContext;
      if (!pgContext.client) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }

      // 既存のコンテンツを検索
      const existingContent = await this.findById(contentAggregate.content.id);
      const isNewContent = existingContent === null;
      
      // コンテンツを保存
      await pgContext.client.query(
        `INSERT INTO contents (
          id, user_id, repository_id, path, title, body, visibility, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          title = $5,
          body = $6,
          visibility = $7,
          updated_at = $9`,
        [
          contentAggregate.content.id,
          contentAggregate.content.userId,
          contentAggregate.content.repositoryId,
          contentAggregate.content.path,
          contentAggregate.content.title,
          contentAggregate.content.body,
          contentAggregate.content.visibility,
          contentAggregate.content.createdAt.toISOString(),
          contentAggregate.content.updatedAt.toISOString()
        ]
      );
      
      // メタデータを保存
      if (isNewContent) {
        // 新規作成の場合はINSERT
        await pgContext.client.query(
          `INSERT INTO content_metadata (
            id, content_id, tags, categories, language, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            contentAggregate.content.id,
            contentAggregate.content.id,
            JSON.stringify(contentAggregate.content.metadata.tags),
            JSON.stringify(contentAggregate.content.metadata.categories),
            contentAggregate.content.metadata.language,
            contentAggregate.content.createdAt.toISOString(),
            contentAggregate.content.updatedAt.toISOString()
          ]
        );
      } else {
        // 更新の場合はUPDATE
        await pgContext.client.query(
          `UPDATE content_metadata SET
            tags = $1,
            categories = $2,
            language = $3,
            updated_at = $4
          WHERE id = $5`,
          [
            JSON.stringify(contentAggregate.content.metadata.tags),
            JSON.stringify(contentAggregate.content.metadata.categories),
            contentAggregate.content.metadata.language,
            contentAggregate.content.updatedAt.toISOString(),
            contentAggregate.content.id
          ]
        );
      }
      
      return ok(contentAggregate);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new InfrastructureError(`コンテンツの保存に失敗しました: ${errorMessage}`));
    }
  }

  /**
   * トランザクション内でコンテンツを削除する
   * @param id コンテンツID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  async deleteWithTransaction(
    id: string,
    context: TransactionContext
  ): Promise<Result<boolean, InfrastructureError>> {
    try {
      // PostgreSQLのトランザクションコンテキストにキャスト
      const pgContext = context as PostgresTransactionContext;
      if (!pgContext.client) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }

      // メタデータを削除
      await pgContext.client.query(
        "DELETE FROM content_metadata WHERE content_id = $1",
        [id]
      );
      
      // コンテンツを削除
      const result = await pgContext.client.query(
        "DELETE FROM contents WHERE id = $1",
        [id]
      );
      
      const rowCount = result.rowCount || 0;
      return ok(rowCount > 0);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new InfrastructureError(`コンテンツの削除に失敗しました: ${errorMessage}`));
    }
  }
} 