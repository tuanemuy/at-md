/**
 * リポジトリリポジトリインターフェース
 * リポジトリの永続化を担当するリポジトリのインターフェース
 */

import { RepositoryAggregate } from "../../../core/content/aggregates/repository-aggregate.ts";

/**
 * リポジトリリポジトリインターフェース
 */
export interface RepositoryRepository {
  /**
   * IDによってリポジトリを検索する
   * @param id リポジトリID
   * @returns リポジトリ集約、存在しない場合はnull
   */
  findById(id: string): Promise<RepositoryAggregate | null>;
  
  /**
   * ユーザーIDによってリポジトリを検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns リポジトリ集約の配列
   */
  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<RepositoryAggregate[]>;
  
  /**
   * 名前によってリポジトリを検索する
   * @param userId ユーザーID
   * @param name リポジトリ名
   * @returns リポジトリ集約、存在しない場合はnull
   */
  findByName(userId: string, name: string): Promise<RepositoryAggregate | null>;
  
  /**
   * リポジトリを保存する
   * @param repositoryAggregate リポジトリ集約
   * @returns 保存されたリポジトリ集約
   */
  save(repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate>;
  
  /**
   * リポジトリを削除する
   * @param id リポジトリID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
} 