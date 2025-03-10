/**
 * コンテンツリポジトリインターフェース
 * 
 * アプリケーション層のコンテンツリポジトリインターフェース
 */

import { ContentRepository as CoreContentRepository, TransactionContext } from "../../../core/content/mod.ts";
import { ContentAggregate } from "../../../core/content/mod.ts";

/**
 * コンテンツリポジトリインターフェース
 */
export interface ContentRepository extends CoreContentRepository {
  // 追加のメソッドがあればここに定義
}

export type { TransactionContext }; 