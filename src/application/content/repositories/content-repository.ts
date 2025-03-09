/**
 * コンテンツリポジトリインターフェース
 * コンテンツの永続化を担当するリポジトリのインターフェース
 */

import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { TransactionContext } from "../../../infrastructure/database/unit-of-work.ts";
import { Result } from "../../../deps.ts";
import { InfrastructureError } from "../../../core/errors/base.ts";

/**
 * コンテンツリポジトリインターフェース
 */
export interface ContentRepository {
  /**
   * IDによってコンテンツを検索する
   * @param id コンテンツID
   * @returns コンテンツ集約、存在しない場合はnull
   */
  findById(id: string): Promise<ContentAggregate | null>;
  
  /**
   * リポジトリIDとパスによってコンテンツを検索する
   * @param repositoryId リポジトリID
   * @param path パス
   * @returns コンテンツ集約、存在しない場合はnull
   */
  findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null>;
  
  /**
   * ユーザーIDによってコンテンツを検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns コンテンツ集約の配列
   */
  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]>;
  
  /**
   * リポジトリIDによってコンテンツを検索する
   * @param repositoryId リポジトリID
   * @param options 検索オプション
   * @returns コンテンツ集約の配列
   */
  findByRepositoryId(repositoryId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]>;
  
  /**
   * コンテンツを保存する
   * @param contentAggregate コンテンツ集約
   * @returns 保存されたコンテンツ集約
   */
  save(contentAggregate: ContentAggregate): Promise<ContentAggregate>;
  
  /**
   * トランザクション内でコンテンツを保存する
   * @param contentAggregate コンテンツ集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたコンテンツ集約の結果
   */
  saveWithTransaction(
    contentAggregate: ContentAggregate, 
    context: TransactionContext
  ): Promise<Result<ContentAggregate, InfrastructureError>>;
  
  /**
   * コンテンツを削除する
   * @param id コンテンツID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * トランザクション内でコンテンツを削除する
   * @param id コンテンツID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<boolean, InfrastructureError>>;
} 