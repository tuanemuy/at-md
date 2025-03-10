/**
 * Drizzleを使用したコンテンツリポジトリの実装
 */

import { ContentRepository } from "../../application/content/repositories/content-repository.ts";
import { ContentAggregate, createContentAggregate } from "../../core/content/aggregates/content-aggregate.ts";
import { Content, createContent } from "../../core/content/entities/content.ts";
import { createContentMetadata } from "../../core/content/value-objects/content-metadata.ts";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
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
   */
  private db: NodePgDatabase<Schema>;
  
  /**
   * イベントバス
   */
  private eventBus?: EventBus;
  
  /**
   * コンストラクタ
   * @param db データベース接続
   * @param eventBus イベントバス（オプション）
   */
  constructor(db: NodePgDatabase<Schema>, eventBus?: EventBus) {
    this.db = db;
    this.eventBus = eventBus;
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
      const contentIdResult = createContentId(contentResult[0].id);
      if (contentIdResult.isErr()) {
        throw new Error(`Invalid content ID: ${contentResult[0].id}`);
      }
      
      const content = createContent({
        id: contentIdResult._unsafeUnwrap(),
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
        .where(and(
          eq(contents.repositoryId, repositoryId),
          eq(contents.path, path)
        ))
        .limit(1);
      
      // コンテンツが見つからない場合はnullを返す
      if (contentResult.length === 0) {
        return null;
      }
      
      // メタデータを検索
      const metadataResult = await this.db.select()
        .from(contentMetadata)
        .where(eq(contentMetadata.contentId, contentResult[0].id))
        .limit(1);
      
      // コンテンツエンティティを作成
      const contentIdResult = createContentId(contentResult[0].id);
      if (contentIdResult.isErr()) {
        throw new Error(`Invalid content ID: ${contentResult[0].id}`);
      }
      
      const content = createContent({
        id: contentIdResult._unsafeUnwrap(),
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
      const content = contentAggregate.content;
      const contentId = String(content.id);
      
      // コンテンツが存在するか確認
      const existingContent = await this.db.select()
        .from(contents)
        .where(eq(contents.id, contentId))
        .limit(1);
      
      // トランザクションを開始
      await this.db.transaction(async (tx) => {
        if (existingContent.length === 0) {
          // 新規作成の場合
          await tx.insert(contents).values({
            id: contentId,
            userId: content.userId,
            repositoryId: content.repositoryId,
            path: content.path,
            title: content.title,
            body: content.body,
            visibility: content.visibility,
            createdAt: content.createdAt,
            updatedAt: content.updatedAt
          });
          
          // メタデータを保存
          await tx.insert(contentMetadata).values({
            contentId: contentId,
            tags: Array.isArray(content.metadata.tags) ? content.metadata.tags.map(tag => String(tag)) : [],
            categories: Array.isArray(content.metadata.categories) ? content.metadata.categories.map(category => String(category)) : [],
            language: content.metadata.language ? String(content.metadata.language) : "ja"
          });
          
          // イベントを発行
          if (this.eventBus) {
            this.eventBus.publish(new ContentCreatedEvent(content));
          }
        } else {
          // 更新の場合
          await tx.update(contents)
            .set({
              userId: content.userId,
              repositoryId: content.repositoryId,
              path: content.path,
              title: content.title,
              body: content.body,
              visibility: content.visibility,
              updatedAt: content.updatedAt
            })
            .where(eq(contents.id, contentId));
          
          // メタデータを更新
          const existingMetadata = await tx.select()
            .from(contentMetadata)
            .where(eq(contentMetadata.contentId, contentId))
            .limit(1);
          
          if (existingMetadata.length === 0) {
            // メタデータが存在しない場合は新規作成
            await tx.insert(contentMetadata).values({
              contentId: contentId,
              tags: Array.isArray(content.metadata.tags) ? content.metadata.tags.map(tag => String(tag)) : [],
              categories: Array.isArray(content.metadata.categories) ? content.metadata.categories.map(category => String(category)) : [],
              language: content.metadata.language ? String(content.metadata.language) : "ja"
            });
          } else {
            // メタデータが存在する場合は更新
            await tx.update(contentMetadata)
              .set({
                tags: Array.isArray(content.metadata.tags) ? content.metadata.tags.map(tag => String(tag)) : [],
                categories: Array.isArray(content.metadata.categories) ? content.metadata.categories.map(category => String(category)) : [],
                language: content.metadata.language ? String(content.metadata.language) : "ja"
              })
              .where(eq(contentMetadata.contentId, contentId));
          }
          
          // イベントを発行
          if (this.eventBus) {
            this.eventBus.publish(new ContentUpdatedEvent(content, []));
          }
        }
      });
      
      return contentAggregate;
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

// モック関数を定義（実際のファイルが存在しない場合に使用）
function createContentId(id: string) {
  return { _unsafeUnwrap: () => id as any, isErr: () => false };
} 