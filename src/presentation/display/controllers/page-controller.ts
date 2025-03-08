import { Result, err, ok } from "npm:neverthrow";
import { PresentationError } from "../../../core/errors/base.ts";
import { EntityNotFoundError } from "../../../core/errors/application.ts";
import { 
  GetPageByIdQuery, 
  GetPageByIdQueryHandler,
  GetPageBySlugQuery,
  GetPageBySlugQueryHandler,
  GetPageByContentIdQuery,
  GetPageByContentIdQueryHandler
} from "../../../application/display/queries/mod.ts";
import { toPageDto, PageDto } from "../dtos/page-dto.ts";

/**
 * ページコントローラーのエラー型
 */
export type PageControllerError = PresentationError | EntityNotFoundError;

/**
 * ページコントローラー
 * 
 * ページの取得に関するエンドポイントを提供する
 */
export class PageController {
  constructor(
    private readonly getPageByIdQueryHandler: GetPageByIdQueryHandler,
    private readonly getPageBySlugQueryHandler: GetPageBySlugQueryHandler,
    private readonly getPageByContentIdQueryHandler: GetPageByContentIdQueryHandler
  ) {}

  /**
   * IDでページを取得する
   * 
   * @param id ページID
   * @returns ページDTOのResult
   */
  async getPageById(id: string): Promise<Result<PageDto, PageControllerError>> {
    // IDの検証
    if (!id) {
      return err(new PresentationError("Page ID is required"));
    }

    // クエリを実行
    const query: GetPageByIdQuery = { id };
    const pageResult = await this.getPageByIdQueryHandler.execute(query);

    // エラーハンドリング
    if (pageResult.isErr()) {
      if (pageResult.error instanceof EntityNotFoundError) {
        return err(pageResult.error);
      }
      return err(new PresentationError(`Failed to get page: ${pageResult.error.message}`));
    }

    // ページをDTOに変換して返す
    return ok(toPageDto(pageResult.value.page));
  }

  /**
   * スラッグでページを取得する
   * 
   * @param slug ページスラッグ
   * @returns ページDTOのResult
   */
  async getPageBySlug(slug: string): Promise<Result<PageDto, PageControllerError>> {
    // スラッグの検証
    if (!slug) {
      return err(new PresentationError("Page slug is required"));
    }

    // クエリを実行
    const query: GetPageBySlugQuery = { slug };
    const pageResult = await this.getPageBySlugQueryHandler.execute(query);

    // エラーハンドリング
    if (pageResult.isErr()) {
      if (pageResult.error instanceof EntityNotFoundError) {
        return err(pageResult.error);
      }
      return err(new PresentationError(`Failed to get page: ${pageResult.error.message}`));
    }

    // ページをDTOに変換して返す
    return ok(toPageDto(pageResult.value.page));
  }

  /**
   * コンテンツIDでページを取得する
   * 
   * @param contentId コンテンツID
   * @returns ページDTOのResult
   */
  async getPageByContentId(contentId: string): Promise<Result<PageDto, PageControllerError>> {
    // コンテンツIDの検証
    if (!contentId) {
      return err(new PresentationError("Content ID is required"));
    }

    // クエリを実行
    const query: GetPageByContentIdQuery = { contentId };
    const pageResult = await this.getPageByContentIdQueryHandler.execute(query);

    // エラーハンドリング
    if (pageResult.isErr()) {
      if (pageResult.error instanceof EntityNotFoundError) {
        return err(pageResult.error);
      }
      return err(new PresentationError(`Failed to get page: ${pageResult.error.message}`));
    }

    // ページをDTOに変換して返す
    return ok(toPageDto(pageResult.value.page));
  }
} 