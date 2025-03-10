/**
 * フィードリポジトリインターフェース
 * フィードの永続化を担当するリポジトリのインターフェース
 */

import { FeedAggregate } from "../aggregates/feed-aggregate.ts";
import { TransactionContext } from "./transaction-context.ts";
import { Result } from "../deps.ts";
import { DomainError } from "../../errors/mod.ts";

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
   * トランザクション内でフィードを保存する
   * @param feedAggregate フィード集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたフィード集約の結果
   */
  saveWithTransaction(
    feedAggregate: FeedAggregate, 
    context: TransactionContext
  ): Promise<Result<FeedAggregate, DomainError>>;
  
  /**
   * フィードを削除する
   * @param id フィードID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * トランザクション内でフィードを削除する
   * @param id フィードID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<boolean, DomainError>>;
} 