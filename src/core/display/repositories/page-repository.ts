import { Result } from "../deps.ts";
import { PageAggregate } from "../aggregates/page-aggregate.ts";
import { DomainError } from "../../errors/mod.ts";
import { TransactionContext } from "./transaction-context.ts";

/**
 * ページリポジトリのエラー型
 */
export type PageRepositoryError = DomainError;

/**
 * ページリポジトリインターフェース
 * 
 * ページの永続化と検索機能を提供する
 */
export interface PageRepository {
  /**
   * IDによってページを検索する
   * 
   * @param id 検索するページID
   * @returns ページ集約のResult、見つからない場合はnull
   */
  findById(id: string): Promise<Result<PageAggregate | null, PageRepositoryError>>;

  /**
   * スラッグによってページを検索する
   * 
   * @param slug 検索するスラッグ
   * @returns ページ集約のResult、見つからない場合はnull
   */
  findBySlug(slug: string): Promise<Result<PageAggregate | null, PageRepositoryError>>;

  /**
   * コンテンツIDによってページを検索する
   * 
   * @param contentId 検索するコンテンツID
   * @returns ページ集約のResult、見つからない場合はnull
   */
  findByContentId(contentId: string): Promise<Result<PageAggregate | null, PageRepositoryError>>;

  /**
   * ページを保存する
   * 
   * @param page 保存するページ集約
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  save(page: PageAggregate): Promise<Result<void, PageRepositoryError>>;

  /**
   * トランザクション内でページを保存する
   * 
   * @param page 保存するページ集約
   * @param context トランザクションコンテキスト
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  saveWithTransaction(
    page: PageAggregate,
    context: TransactionContext
  ): Promise<Result<void, PageRepositoryError>>;

  /**
   * ページを削除する
   * 
   * @param id 削除するページID
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  delete(id: string): Promise<Result<void, PageRepositoryError>>;

  /**
   * トランザクション内でページを削除する
   * 
   * @param id 削除するページID
   * @param context トランザクションコンテキスト
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  deleteWithTransaction(
    id: string,
    context: TransactionContext
  ): Promise<Result<void, PageRepositoryError>>;
} 