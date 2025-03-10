/**
 * ページコントローラー
 */

import {
  Result,
  ok,
  err,
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  type Page,
  type PageMetadata,
  type PageRepository,
  type GetPageByIdQuery,
  type GetPageByIdQueryHandler,
  type GetPageBySlugQuery,
  type GetPageBySlugQueryHandler
} from "./deps.ts";

import { PageDto, toPageDto, createPageMetadataFromDto } from "../dtos/page-dto.ts";

/**
 * ページコントローラーのインターフェース
 */
export interface PageController {
  /**
   * IDによってページを取得する
   * @param id ページID
   * @returns ページDTOの結果
   */
  getPageById(id: string): Promise<Result<PageDto, ApplicationError>>;
  
  /**
   * スラッグによってページを取得する
   * @param slug ページスラッグ
   * @returns ページDTOの結果
   */
  getPageBySlug(slug: string): Promise<Result<PageDto, ApplicationError>>;
  
  /**
   * ページを作成する
   * @param dto ページDTO
   * @returns 作成されたページDTOの結果
   */
  createPage(dto: Partial<PageDto>): Promise<Result<PageDto, ApplicationError>>;
  
  /**
   * ページを更新する
   * @param id ページID
   * @param dto ページDTO
   * @returns 更新されたページDTOの結果
   */
  updatePage(id: string, dto: Partial<PageDto>): Promise<Result<PageDto, ApplicationError>>;
  
  /**
   * ページを削除する
   * @param id ページID
   * @returns 削除が成功したかどうかの結果
   */
  deletePage(id: string): Promise<Result<boolean, ApplicationError>>;
}

/**
 * ページコントローラーの実装
 */
export class PageControllerImpl implements PageController {
  private readonly pageRepository: PageRepository;
  private readonly getPageByIdQueryHandler: GetPageByIdQueryHandler;
  private readonly getPageBySlugQueryHandler: GetPageBySlugQueryHandler;
  
  /**
   * コンストラクタ
   * @param pageRepository ページリポジトリ
   * @param getPageByIdQueryHandler IDによるページ取得クエリハンドラー
   * @param getPageBySlugQueryHandler スラッグによるページ取得クエリハンドラー
   */
  constructor(
    pageRepository: PageRepository,
    getPageByIdQueryHandler: GetPageByIdQueryHandler,
    getPageBySlugQueryHandler: GetPageBySlugQueryHandler
  ) {
    this.pageRepository = pageRepository;
    this.getPageByIdQueryHandler = getPageByIdQueryHandler;
    this.getPageBySlugQueryHandler = getPageBySlugQueryHandler;
  }
  
  /**
   * IDによってページを取得する
   * @param id ページID
   * @returns ページDTOの結果
   */
  async getPageById(id: string): Promise<Result<PageDto, ApplicationError>> {
    try {
      const query: GetPageByIdQuery = { id };
      const result = await this.getPageByIdQueryHandler.execute(query);
      
      return result.map(page => toPageDto(page));
    } catch (error) {
      return err(new ApplicationError(`ページの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
  
  /**
   * スラッグによってページを取得する
   * @param slug ページスラッグ
   * @returns ページDTOの結果
   */
  async getPageBySlug(slug: string): Promise<Result<PageDto, ApplicationError>> {
    try {
      const query: GetPageBySlugQuery = { slug };
      const result = await this.getPageBySlugQueryHandler.execute(query);
      
      return result.map(page => toPageDto(page));
    } catch (error) {
      return err(new ApplicationError(`ページの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
  
  /**
   * ページを作成する
   * @param dto ページDTO
   * @returns 作成されたページDTOの結果
   */
  createPage(dto: Partial<PageDto>): Promise<Result<PageDto, ApplicationError>> {
    // 実装はここに記述
    throw new Error("Method not implemented.");
  }
  
  /**
   * ページを更新する
   * @param id ページID
   * @param dto ページDTO
   * @returns 更新されたページDTOの結果
   */
  updatePage(id: string, dto: Partial<PageDto>): Promise<Result<PageDto, ApplicationError>> {
    // 実装はここに記述
    throw new Error("Method not implemented.");
  }
  
  /**
   * ページを削除する
   * @param id ページID
   * @returns 削除が成功したかどうかの結果
   */
  deletePage(id: string): Promise<Result<boolean, ApplicationError>> {
    // 実装はここに記述
    throw new Error("Method not implemented.");
  }
} 