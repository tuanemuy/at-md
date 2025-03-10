/**
 * Drizzle ORMを使用したコンテンツリポジトリの実装
 */

import {
  Result,
  ok,
  err,
  DomainError,
  db,
  eq,
  and,
  contentSchema,
  generateId,
  ContentAggregate,
  createContentAggregate,
  Content,
  ContentMetadata,
  ContentRepository,
  ContentCreatedEvent,
  ContentUpdatedEvent,
  DomainEvent,
  TransactionContext,
  PostgresUnitOfWork,
  PostgresTransactionContext
} from "./deps.ts";

// 追加のインポート
import { createContent } from "../../core/content/entities/content.ts";
import { createContentMetadata } from "../../core/content/value-objects/content-metadata.ts";
import type { Database } from "../database/schema/mod.ts";

/**
 * Drizzle ORMを使用したコンテンツリポジトリの実装
 */
export class DrizzleContentRepository implements ContentRepository {
  private domainEvents: DomainEvent[] = [];
  private db: Database;
  
  /**
   * コンストラクタ
   * @param db データベース接続
   */
  constructor(db: Database) {
    this.db = db;
  }

  /**
   * IDによってコンテンツを検索する
   * @param id コンテンツID
   * @returns コンテンツ集約、存在しない場合はnull
   */
  async findById(id: string): Promise<ContentAggregate | null> {
    const result = await this.db.select()
      .from(contentSchema.contents)
      .where(eq(contentSchema.contents.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const contentData = result[0];
    
    // コンテンツ集約を作成して返す
    const aggregateResult = this.createContentAggregateFromData(contentData);
    return aggregateResult ? aggregateResult : null;
  }
  
  /**
   * リポジトリIDとパスによってコンテンツを検索する
   * @param repositoryId リポジトリID
   * @param path パス
   * @returns コンテンツ集約、存在しない場合はnull
   */
  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null> {
    const result = await this.db.select()
      .from(contentSchema.contents)
      .where(and(
        eq(contentSchema.contents.repositoryId, repositoryId),
        eq(contentSchema.contents.path, path)
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const contentData = result[0];
    
    // コンテンツ集約を作成して返す
    const aggregateResult = this.createContentAggregateFromData(contentData);
    return aggregateResult ? aggregateResult : null;
  }
  
  /**
   * ユーザーIDによってコンテンツを検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns コンテンツ集約の配列
   */
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const query = this.db.select()
      .from(contentSchema.contents)
      .where(eq(contentSchema.contents.userId, userId));
    
    if (options?.limit) {
      query.limit(options.limit);
    }
    
    if (options?.offset) {
      query.offset(options.offset);
    }
    
    const result = await query;
    
    // 結果を集約の配列に変換
    const aggregates: ContentAggregate[] = [];
    for (const contentData of result) {
      const aggregate = this.createContentAggregateFromData(contentData);
      if (aggregate) {
        aggregates.push(aggregate);
      }
    }
    return aggregates;
  }
  
  /**
   * リポジトリIDによってコンテンツを検索する
   * @param repositoryId リポジトリID
   * @param options 検索オプション
   * @returns コンテンツ集約の配列
   */
  async findByRepositoryId(repositoryId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const query = this.db.select()
      .from(contentSchema.contents)
      .where(eq(contentSchema.contents.repositoryId, repositoryId));
    
    if (options?.limit) {
      query.limit(options.limit);
    }
    
    if (options?.offset) {
      query.offset(options.offset);
    }
    
    const result = await query;
    
    // 結果を集約の配列に変換
    const aggregates: ContentAggregate[] = [];
    for (const contentData of result) {
      const aggregate = this.createContentAggregateFromData(contentData);
      if (aggregate) {
        aggregates.push(aggregate);
      }
    }
    return aggregates;
  }
  
  /**
   * コンテンツを保存する
   * @param contentAggregate コンテンツ集約
   * @returns 保存されたコンテンツ集約
   */
  async save(contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    const content = contentAggregate.content;
    const isNew = !(await this.findById(content.id));
    
    const contentData = {
      id: content.id,
      userId: content.userId,
      repositoryId: content.repositoryId,
      path: content.path,
      title: content.title,
      body: content.body,
      metadata: content.metadata,
      status: content.visibility,
      createdAt: content.createdAt,
      updatedAt: new Date()
    };
    
    await this.db.insert(contentSchema.contents)
      .values(contentData)
      .onConflictDoUpdate({
        target: contentSchema.contents.id,
        set: {
          title: contentData.title,
          body: contentData.body,
          metadata: contentData.metadata,
          status: contentData.status,
          updatedAt: contentData.updatedAt
        }
      });
    
    // ドメインイベントの発行
    if (isNew) {
      this.domainEvents.push(new ContentCreatedEvent(content));
    } else {
      this.domainEvents.push(new ContentUpdatedEvent(content, ["title", "body", "metadata", "visibility"]));
    }
    
    return contentAggregate;
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
  ): Promise<Result<ContentAggregate, DomainError>> {
    try {
      // PostgresTransactionContextにキャスト
      const pgContext = context as PostgresTransactionContext;
      
      // コンテンツデータを作成
      const content = contentAggregate.content;
      const contentData = {
        id: content.id,
        userId: content.userId,
        repositoryId: content.repositoryId,
        path: content.path,
        title: content.title,
        body: content.body,
        metadata: content.metadata,
        status: content.visibility,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      };
      
      // トランザクション内でコンテンツを保存
      await pgContext.client.query(
        `INSERT INTO contents (id, user_id, repository_id, path, title, body, metadata, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE
         SET user_id = $2, repository_id = $3, path = $4, title = $5, body = $6, metadata = $7, status = $8, updated_at = $10`,
        [
          contentData.id,
          contentData.userId,
          contentData.repositoryId,
          contentData.path,
          contentData.title,
          contentData.body,
          JSON.stringify(contentData.metadata),
          contentData.status,
          contentData.createdAt,
          contentData.updatedAt
        ]
      );
      
      // ドメインイベントを発行
      this.domainEvents.push(new ContentUpdatedEvent(content, ["title", "body", "metadata", "visibility"]));
      
      return ok(contentAggregate);
    } catch (error) {
      return err(new DomainError(`コンテンツの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
  
  /**
   * コンテンツを削除する
   * @param id コンテンツID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(contentSchema.contents)
      .where(eq(contentSchema.contents.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
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
  ): Promise<Result<boolean, DomainError>> {
    try {
      // PostgresTransactionContextにキャスト
      const pgContext = context as PostgresTransactionContext;
      
      // トランザクション内でコンテンツを削除
      const result = await pgContext.client.query(
        `DELETE FROM contents WHERE id = $1`,
        [id]
      );
      
      return ok(result.rowCount !== null && result.rowCount > 0);
    } catch (error) {
      return err(new DomainError(`コンテンツの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * データベースから取得したデータからContentAggregateを作成する
   * @param contentData データベースから取得したデータ
   * @returns ContentAggregate
   */
  private createContentAggregateFromData(contentData: {
    id: string;
    userId: string;
    repositoryId: string | null;
    path: string | null;
    title: string;
    body: string;
    metadata: unknown;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): ContentAggregate | null {
    try {
      // 注: 実際の実装では、Contentエンティティの作成方法に合わせて適切に修正する必要があります
      const contentMetadata = contentData.metadata as Record<string, unknown>;
      
      const metadataResult = createContentMetadata({
        tags: Array.isArray(contentMetadata?.tags) ? contentMetadata.tags as string[] : [],
        categories: Array.isArray(contentMetadata?.categories) ? contentMetadata.categories as string[] : [],
        language: typeof contentMetadata?.language === 'string' ? contentMetadata.language : 'ja'
      });
      
      if (metadataResult.isErr()) {
        console.error(`メタデータの作成に失敗しました: ${metadataResult.error.message}`);
        return null;
      }
      
      const visibility = typeof contentMetadata?.visibility === 'string' 
        ? (contentMetadata.visibility as 'private' | 'unlisted' | 'public') 
        : 'private';
      
      const contentResult = createContent({
        id: contentData.id,
        userId: contentData.userId,
        repositoryId: contentData.repositoryId || '',
        path: contentData.path || '',
        title: contentData.title,
        body: contentData.body,
        metadata: metadataResult.value,
        visibility: visibility,
        versions: [],
        createdAt: contentData.createdAt,
        updatedAt: contentData.updatedAt
      });
      
      if (contentResult.isErr()) {
        console.error(`コンテンツの作成に失敗しました: ${contentResult.error.message}`);
        return null;
      }
      
      const aggregateResult = createContentAggregate(contentResult.value);
      
      if (aggregateResult.isErr()) {
        console.error(`コンテンツ集約の作成に失敗しました: ${aggregateResult.error.message}`);
        return null;
      }
      
      return aggregateResult.value;
    } catch (error) {
      console.error(`コンテンツ集約の作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
} 