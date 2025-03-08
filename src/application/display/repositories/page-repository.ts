import { Result } from "npm:neverthrow";
import { PageAggregate } from "../../../core/display/aggregates/page-aggregate.ts";
import { InfrastructureError } from "../../../core/errors/base.ts";

/**
 * ページリポジトリのエラー型
 */
export type PageRepositoryError = InfrastructureError;

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
   * ページを削除する
   * 
   * @param id 削除するページID
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  delete(id: string): Promise<Result<void, PageRepositoryError>>;
} 