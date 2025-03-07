/**
 * フィードリポジトリインターフェース
 * フィードの永続化を担当するリポジトリのインターフェース
 */

import { FeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";

/**
 * フィードリポジトリインターフェース
 */
export interface FeedRepository {
  /**
   * IDによってフィードを検索する
   * @param id フィードID
   * @returns フィード集約、存在しない場合はnull
   */
  findById(id: string): Promise<FeedAggregate | null>;
  
  /**
   * ユーザーIDによってフィードを検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns フィード集約の配列
   */
  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<FeedAggregate[]>;
  
  /**
   * 名前によってフィードを検索する
   * @param userId ユーザーID
   * @param name フィード名
   * @returns フィード集約、存在しない場合はnull
   */
  findByName(userId: string, name: string): Promise<FeedAggregate | null>;
  
  /**
   * フィードを保存する
   * @param feedAggregate フィード集約
   * @returns 保存されたフィード集約
   */
  save(feedAggregate: FeedAggregate): Promise<FeedAggregate>;
  
  /**
   * フィードを削除する
   * @param id フィードID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
} 