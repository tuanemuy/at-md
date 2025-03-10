/**
 * コンテンツ同期サービス
 * 外部リポジトリ（GitHub、Obsidian）とのコンテンツ同期を担当するサービス
 */

import { Result } from "npm:neverthrow";
import { ContentAggregate, RepositoryAggregate } from "../../../core/content/mod.ts";

/**
 * 同期結果
 */
export interface SyncResult {
  added: ContentAggregate[];
  updated: ContentAggregate[];
  deleted: string[];
  errors: Error[];
}

/**
 * コンテンツ同期サービスインターフェース
 */
export interface ContentSyncService {
  /**
   * リポジトリのコンテンツを同期する
   * 
   * @param repositoryAggregate リポジトリ集約
   * @returns 同期結果
   */
  syncRepository(repositoryAggregate: RepositoryAggregate): Promise<Result<SyncResult, Error>>;
  
  /**
   * 特定のコンテンツを同期する
   * 
   * @param contentAggregate コンテンツ集約
   * @returns 同期されたコンテンツ集約
   */
  syncContent(contentAggregate: ContentAggregate): Promise<Result<ContentAggregate, Error>>;
  
  /**
   * リポジトリのコンテンツを外部リポジトリにプッシュする
   * 
   * @param repositoryAggregate リポジトリ集約
   * @returns 同期結果
   */
  pushRepository(repositoryAggregate: RepositoryAggregate): Promise<Result<SyncResult, Error>>;
  
  /**
   * 特定のコンテンツを外部リポジトリにプッシュする
   * 
   * @param contentAggregate コンテンツ集約
   * @returns 同期されたコンテンツ集約
   */
  pushContent(contentAggregate: ContentAggregate): Promise<Result<ContentAggregate, Error>>;
} 