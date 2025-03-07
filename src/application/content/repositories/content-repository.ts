/**
 * コンテンツリポジトリインターフェース
 * コンテンツの永続化を担当するリポジトリのインターフェース
 */

import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";

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
   * コンテンツを削除する
   * @param id コンテンツID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
} 