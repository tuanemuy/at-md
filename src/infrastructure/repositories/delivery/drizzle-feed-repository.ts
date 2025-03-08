/**
 * DrizzleFeedRepository
 * フィードリポジトリのDrizzle実装
 */

import { eq, and, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { FeedRepository } from "../../../application/delivery/repositories/feed-repository.ts";
import { FeedAggregate, createFeedAggregate, createNewFeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
import { Feed, createFeed } from "../../../core/delivery/entities/feed.ts";
import { FeedMetadata, createFeedMetadata } from "../../../core/delivery/value-objects/feed-metadata.ts";
import { feeds } from "../../database/schema/display.ts";
import { Schema } from "../../database/schema/mod.ts";

/**
 * DrizzleFeedRepository
 * フィードリポジトリのDrizzle実装
 */
export class DrizzleFeedRepository implements FeedRepository {
  private db: NodePgDatabase<Record<string, unknown>>;

  /**
   * コンストラクタ
   * @param db Drizzleデータベース
   */
  constructor(db: NodePgDatabase<Record<string, unknown>>) {
    this.db = db;
  }

  /**
   * IDによってフィードを検索する
   * @param id フィードID
   * @returns フィード集約、存在しない場合はnull
   */
  async findById(id: string): Promise<FeedAggregate | null> {
    try {
      const result = await this.db.select().from(feeds).where(eq(feeds.id, id)).execute();

      if (result.length === 0) {
        return null;
      }

      const feedData = result[0];
      return this.mapToFeedAggregate(feedData);
    } catch (error) {
      console.error("フィードの検索中にエラーが発生しました:", error);
      throw error;
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
      // 型エラーを回避するために別の方法でクエリを構築
      let query = this.db.select().from(feeds).where(eq(feeds.userId, userId));
      
      // 代わりにSQLを直接実行する方法を使用
      if (options?.limit !== undefined || options?.offset !== undefined) {
        // 生のSQLを使用
        const sql = this.db.select().from(feeds).where(eq(feeds.userId, userId));
        
        // 結果を取得
        const result = await sql.execute();
        
        // 結果をメモリ内でフィルタリング
        let filteredResult = result;
        if (options?.offset !== undefined) {
          filteredResult = filteredResult.slice(options.offset);
        }
        if (options?.limit !== undefined) {
          filteredResult = filteredResult.slice(0, options.limit);
        }
        
        return filteredResult.map((feedData) => this.mapToFeedAggregate(feedData));
      }
      
      // 通常のクエリ実行
      const result = await query.execute();
      return result.map((feedData) => this.mapToFeedAggregate(feedData));
    } catch (error) {
      console.error("ユーザーIDによるフィードの検索中にエラーが発生しました:", error);
      throw error;
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
      const result = await this.db.select().from(feeds)
        .where(and(eq(feeds.userId, userId), eq(feeds.name, name)))
        .execute();

      if (result.length === 0) {
        return null;
      }

      const feedData = result[0];
      return this.mapToFeedAggregate(feedData);
    } catch (error) {
      console.error("名前によるフィードの検索中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * フィードを保存する
   * @param feedAggregate フィード集約
   * @returns 保存されたフィード集約
   */
  async save(feedAggregate: FeedAggregate): Promise<FeedAggregate> {
    try {
      const feed = feedAggregate.getFeed();
      const feedData = {
        id: feed.id,
        userId: feed.userId,
        name: feed.name,
        description: feed.metadata.description || '',
        isDefault: false, // デフォルト値
        createdAt: feed.createdAt,
        updatedAt: feed.updatedAt
      };

      // 既存のフィードを確認
      const existingFeed = await this.findById(feed.id);

      if (existingFeed) {
        // 更新
        await this.db.update(feeds)
          .set(feedData)
          .where(eq(feeds.id, feed.id))
          .execute();
      } else {
        // 新規作成
        await this.db.insert(feeds)
          .values(feedData)
          .execute();
      }

      // 保存後のフィードを取得して返す
      const savedFeed = await this.findById(feed.id);
      if (!savedFeed) {
        throw new Error(`フィードの保存に失敗しました: ${feed.id}`);
      }

      return savedFeed;
    } catch (error) {
      console.error("フィードの保存中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * フィードを削除する
   * @param id フィードID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  async delete(id: string): Promise<boolean> {
    try {
      // 削除前にフィードが存在するか確認
      const existingFeed = await this.findById(id);
      if (!existingFeed) {
        return false;
      }
      
      // 削除実行
      const result = await this.db.delete(feeds)
        .where(eq(feeds.id, id))
        .execute();
      
      return true;
    } catch (error) {
      console.error("フィードの削除中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * データベースのフィードデータをフィード集約にマッピングする
   * @param feedData データベースのフィードデータ
   * @returns フィード集約
   */
  private mapToFeedAggregate(feedData: {
    id: string;
    userId: string;
    name: string;
    description: string;
    isDefault: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): FeedAggregate {
    // メタデータを作成
    const metadata = createFeedMetadata({
      type: "personal",
      description: feedData.description,
      language: "ja"
    });

    // フィードエンティティを作成
    const feed = createFeed({
      id: feedData.id,
      userId: feedData.userId,
      name: feedData.name,
      metadata,
      postIds: [],
      createdAt: feedData.createdAt instanceof Date ? feedData.createdAt : new Date(feedData.createdAt),
      updatedAt: feedData.updatedAt instanceof Date ? feedData.updatedAt : new Date(feedData.updatedAt)
    });

    // フィード集約を作成して返す
    return createFeedAggregate({
      feed
    });
  }
} 