/**
 * 投稿リポジトリインターフェース
 * 
 * アプリケーション層の投稿リポジトリインターフェース
 */

import { PostRepository as CorePostRepository, TransactionContext } from "../../../core/delivery/mod.ts";

/**
 * 投稿リポジトリインターフェース
 */
export interface PostRepository extends CorePostRepository {
  // 追加のメソッドがあればここに定義
}

export type { TransactionContext }; 