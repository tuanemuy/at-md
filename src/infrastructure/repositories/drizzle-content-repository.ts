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
   * コンテンツを保存する
   * 新規作成または更新を行う
   * @param contentAggregate コンテンツ集約
   * @returns 保存されたコンテンツ集約
   * @throws RepositoryError データベース操作に失敗した場合
   */
  async save(contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    try {
      // 既存のコンテンツを検索
      const existingContent = await this.findById(contentAggregate.content.id);
      const isNewContent = existingContent === null;
      
      // トランザクションを開始
      const result = await this.db.transaction(async (tx) => {
        // コンテンツを保存
        await tx.insert(contents)
          .values({
            id: contentAggregate.content.id,
            userId: contentAggregate.content.userId,
            repositoryId: contentAggregate.content.repositoryId,
            path: contentAggregate.content.path,
            title: contentAggregate.content.title,
            body: contentAggregate.content.body,
            visibility: contentAggregate.content.visibility,
            createdAt: contentAggregate.content.createdAt,
            updatedAt: contentAggregate.content.updatedAt
          })
          .onConflictDoUpdate({
            target: contents.id,
            set: {
              title: contentAggregate.content.title,
              body: contentAggregate.content.body,
              visibility: contentAggregate.content.visibility,
              updatedAt: contentAggregate.content.updatedAt
            }
          });
        
        // メタデータを保存
        if (isNewContent) {
          // 新規作成の場合はINSERT
          await tx.insert(contentMetadata)
            .values({
              id: contentAggregate.content.id,
              contentId: contentAggregate.content.id,
              tags: contentAggregate.content.metadata.tags,
              categories: contentAggregate.content.metadata.categories,
              language: contentAggregate.content.metadata.language,
              createdAt: contentAggregate.content.createdAt,
              updatedAt: contentAggregate.content.updatedAt
            });
        } else {
          // 更新の場合はUPDATE
          await tx.update(contentMetadata)
            .set({
              tags: contentAggregate.content.metadata.tags,
              categories: contentAggregate.content.metadata.categories,
              language: contentAggregate.content.metadata.language,
              updatedAt: contentAggregate.content.updatedAt
            })
            .where(eq(contentMetadata.id, contentAggregate.content.id));
        }
        
        return contentAggregate;
      });
      
      // ドメインイベントを発行
      const eventBus = EventBus.getInstance();
      if (isNewContent) {
        // 新規作成の場合
        eventBus.publish(new ContentCreatedEvent(contentAggregate.content));
      } else {
        // 更新の場合
        const updatedFields: string[] = [];
        
        if (existingContent && existingContent.content.title !== contentAggregate.content.title) {
          updatedFields.push('title');
        }
        
        if (existingContent && existingContent.content.body !== contentAggregate.content.body) {
          updatedFields.push('body');
        }
        
        if (existingContent && existingContent.content.visibility !== contentAggregate.content.visibility) {
          updatedFields.push('visibility');
        }
        
        if (existingContent && JSON.stringify(existingContent.content.metadata) !== JSON.stringify(contentAggregate.content.metadata)) {
          updatedFields.push('metadata');
        }
        
        if (updatedFields.length > 0) {
          eventBus.publish(new ContentUpdatedEvent(contentAggregate.content, updatedFields));
        }
      }
      
      return result;
    } catch (error) {
      const repositoryError: RepositoryError = {
        code: "SAVE_ERROR",
        message: `コンテンツの保存に失敗しました: ${contentAggregate.content.id}`,
        cause: error
      };
      console.error(repositoryError);
      throw repositoryError;
    }
  }
  
  /**
   * コンテンツを削除する
   * @param id コンテンツID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   * @throws RepositoryError データベース操作に失敗した場合
   */
  async delete(id: string): Promise<boolean> {
    try {
      // 削除前にコンテンツ情報を取得（イベント発行用）
      const contentToDelete = await this.findById(id);
      if (!contentToDelete) {
        return false;
      }
      
      // トランザクションを開始
      const result = await this.db.transaction(async (tx) => {
        // メタデータを削除
        await tx.delete(contentMetadata)
          .where(eq(contentMetadata.contentId, id));
        
        // コンテンツを削除
        const deleteResult = await tx.delete(contents)
          .where(eq(contents.id, id));
        
        return deleteResult && deleteResult.rowCount ? deleteResult.rowCount > 0 : false;
      });
      
      // 削除に成功した場合、ドメインイベントを発行
      if (result && contentToDelete) {
        const eventBus = EventBus.getInstance();
        eventBus.publish(new ContentDeletedEvent(
          id,
          contentToDelete.content.userId,
          contentToDelete.content.repositoryId
        ));
      }
      
      return result;
    } catch (error) {
      const repositoryError: RepositoryError = {
        code: "DELETE_ERROR",
        message: `コンテンツの削除に失敗しました: ${id}`,
        cause: error
      };
      console.error(repositoryError);
      throw repositoryError;
    }
  }
} 