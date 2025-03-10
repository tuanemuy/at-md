import { PageRepository as CorePageRepository, PageRepositoryError, TransactionContext } from "../../../core/display/repositories/mod.ts";

/**
 * ページリポジトリインターフェース
 * 
 * ページの永続化と検索機能を提供する
 */
export type PageRepository = CorePageRepository;

// 型の再エクスポート
export type { PageRepositoryError, TransactionContext }; 