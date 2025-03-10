/**
 * DrizzleFeedRepository
 * フィードリポジトリのDrizzle実装
 */

import { 
  Result, 
  ok, 
  err, 
  eq, 
  and, 
  InfrastructureError, 
  FeedRepository, 
  FeedAggregate, 
  Feed, 
  createNewFeedAggregate, 
  FeedMetadataProps, 
  FeedType, 
  TransactionContext, 
  PostgresTransactionContext, 
  feeds, 
  db 
} from "./deps.ts";
import type { Database } from "../../database/schema/mod.ts";
import type { PgSelectQueryBuilder } from "npm:drizzle-orm/pg-core";

/**
 * フィードデータの型定義
 */
interface FeedData {
  id: string;
  userId: string;
  slug: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * クエリビルダーの型定義
 * Drizzle ORMのクエリビルダーの型を拡張して、limit/offsetメソッドを持つことを保証
 */
interface QueryBuilder<T> {
  limit(limit: number): QueryBuilder<T>;
  offset(offset: number): QueryBuilder<T>;
  then<U>(onfulfilled?: (value: T[]) => U | PromiseLike<U>): Promise<U>;
}

/**
 * Drizzle ORMを使用したフィードリポジトリの実装
 */
export class DrizzleFeedRepository implements FeedRepository {
  /**
   * コンストラクタ
   * @param db データベース接続
   */
  constructor(private readonly db: Database) {}

  /**
   * IDによってフィードを検索する
   * @param id フィードID
   * @returns フィード集約、存在しない場合はnull
   */
  async findById(id: string): Promise<FeedAggregate | null> {
    try {
      const result = await this.db
        .select()
        .from(feeds)
        .where(eq(feeds.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const feedData = result[0] as FeedData;
      const metadata = feedData.metadata as Record<string, unknown>;
      
      const metadataProps: FeedMetadataProps = {
        type: ((metadata.type as string) || "personal") as FeedType,
        description: metadata.description as string | undefined,
        language: (metadata.language as string) || "ja",
      };
      
      return createNewFeedAggregate({
        userId: feedData.userId,
        name: feedData.name,
        metadataProps: metadataProps,
      });
    } catch (error) {
      console.error("Error in findById:", error);
      return null;
    }
  }

  /**
   * ユーザーIDによってフィードを検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns フィード集約の配列
   */
  async findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<FeedAggregate[]> {
    try {
      const baseQuery = this.db.select().from(feeds).where(eq(feeds.userId, userId));
      const query = baseQuery as unknown as QueryBuilder<FeedData>;
      
      if (options?.limit) {
        query.limit(options.limit);
      }
      
      if (options?.offset) {
        query.offset(options.offset);
      }
      
      const results = await query;
      
      return results.map((result: unknown) => {
        const feedData = result as FeedData;
        const metadata = feedData.metadata as Record<string, unknown>;
        
        // メタデータの作成
        const metadataProps: FeedMetadataProps = {
          type: ((metadata.type as string) || "personal") as FeedType,
          description: metadata.description as string | undefined,
          language: (metadata.language as string) || "ja",
        };
        
        // フィード集約の作成
        return createNewFeedAggregate({
          userId: feedData.userId,
          name: feedData.name,
          metadataProps: metadataProps,
        });
      });
    } catch (error) {
      console.error("ユーザーのフィード検索エラー:", error);
      return [];
    }
  }

  /**
   * 名前によってフィードを検索する
   * @param userId ユーザーID
   * @param name フィード名
   * @returns フィード集約、存在しない場合はnull
   */
  async findByName(userId: string, name: string): Promise<FeedAggregate | null> {
    try {
      const result = await this.db.select()
        .from(feeds)
        .where(and(
          eq(feeds.userId, userId),
          eq(feeds.name, name)
        ))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const feedData = result[0] as FeedData;
      const metadata = feedData.metadata as Record<string, unknown>;
      
      // メタデータの作成
      const metadataProps: FeedMetadataProps = {
        type: ((metadata.type as string) || "personal") as FeedType,
        description: metadata.description as string | undefined,
        language: (metadata.language as string) || "ja",
      };
      
      // フィード集約の作成
      return createNewFeedAggregate({
        userId: feedData.userId,
        name: feedData.name,
        metadataProps: metadataProps,
      });
    } catch (error) {
      console.error("フィード名検索エラー:", error);
      return null;
    }
  }

  /**
   * フィードを保存する
   * @param feedAggregate フィード集約
   * @returns 保存されたフィード集約
   */
  async save(feedAggregate: FeedAggregate): Promise<FeedAggregate> {
    const feed = feedAggregate.feed;
    const metadata = feed.metadata;
    
    try {
      // メタデータをJSONに変換
      const metadataJson: Record<string, unknown> = {
        type: metadata.type,
        description: metadata.description,
        language: metadata.language,
      };
      
      // フィードデータの作成
      const feedData = {
        id: feed.id,
        userId: feed.userId,
        slug: feed.id, // slugがない場合はIDを使用
        name: feed.name,
        description: null, // 必要に応じて設定
        metadata: metadataJson,
        createdAt: feed.createdAt,
        updatedAt: feed.updatedAt
      };
      
      // 既存のフィードを確認
      const existingFeed = await this.findById(feed.id);
      
      if (existingFeed) {
        // 更新
        await this.db.update(feeds)
          .set(feedData)
          .where(eq(feeds.id, feed.id));
      } else {
        // 新規作成
        await this.db.insert(feeds).values(feedData);
      }
      
      return feedAggregate;
    } catch (error) {
      console.error("フィード保存エラー:", error);
      throw new Error(`フィードの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * トランザクション内でフィードを保存する
   * @param feedAggregate フィード集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたフィード集約の結果
   */
  async saveWithTransaction(
    feedAggregate: FeedAggregate, 
    context: TransactionContext
  ): Promise<Result<FeedAggregate, InfrastructureError>> {
    const feed = feedAggregate.feed;
    const metadata = feed.metadata;
    
    try {
      if (!(context instanceof PostgresTransactionContext)) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }
      
      // メタデータをJSONに変換
      const metadataJson = JSON.stringify({
        type: metadata.type,
        description: metadata.description,
        language: metadata.language,
      });
      
      // 既存のフィードを確認
      const existingFeed = await this.findById(feed.id);
      
      if (existingFeed) {
        // 更新
        await context.client.query(
          `UPDATE feeds SET 
            user_id = $1, 
            name = $2, 
            description = $3, 
            metadata = $4, 
            updated_at = $5 
          WHERE id = $6`,
          [
            feed.userId,
            feed.name,
            null, // 必要に応じて設定
            metadataJson,
            feed.updatedAt,
            feed.id
          ]
        );
      } else {
        // 新規作成
        await context.client.query(
          `INSERT INTO feeds (
            id, user_id, slug, name, description, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            feed.id,
            feed.userId,
            feed.id, // slugがない場合はIDを使用
            feed.name,
            null, // 必要に応じて設定
            metadataJson,
            feed.createdAt,
            feed.updatedAt
          ]
        );
      }
      
      return ok(feedAggregate);
    } catch (error) {
      return err(new InfrastructureError(`フィードの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * フィードを削除する
   * @param id フィードID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.db.delete(feeds).where(eq(feeds.id, id));
      return true;
    } catch (error) {
      console.error("フィード削除エラー:", error);
      return false;
    }
  }

  /**
   * トランザクション内でフィードを削除する
   * @param id フィードID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  async deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<boolean, InfrastructureError>> {
    try {
      if (!(context instanceof PostgresTransactionContext)) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }
      
      await context.client.query("DELETE FROM feeds WHERE id = $1", [id]);
      return ok(true);
    } catch (error) {
      return err(new InfrastructureError(`フィードの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
} 