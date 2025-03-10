/**
 * フィードリポジトリインターフェース
 * 
 * アプリケーション層のフィードリポジトリインターフェース
 */

import { FeedRepository as CoreFeedRepository, TransactionContext } from "../../../core/delivery/mod.ts";

/**
 * フィードリポジトリインターフェース
 */
export interface FeedRepository extends CoreFeedRepository {
  // 追加のメソッドがあればここに定義
}

export type { TransactionContext }; 