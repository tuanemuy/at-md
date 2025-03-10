import { Query } from "../../common/mod.ts";
import { Result, ok, err } from "../deps.ts";
import { ApplicationError, EntityNotFoundError } from "../deps.ts";
import { PageAggregate } from "../deps.ts";
import { PageRepository } from "../repositories/page-repository.ts";

/**
 * スラッグによるページ取得クエリのエラー型
 */
export type GetPageBySlugQueryError = ApplicationError | EntityNotFoundError;

/**
 * スラッグによるページ取得クエリ
 */
export interface GetPageBySlugQuery {
  slug: string;
}

/**
 * スラッグによるページ取得クエリハンドラー
 * 
 * スラッグを指定してページを取得する
 */
export class GetPageBySlugQueryHandler {
  constructor(private readonly pageRepository: PageRepository) {}

  /**
   * クエリを実行する
   * 
   * @param query スラッグによるページ取得クエリ
   * @returns ページ集約のResult
   */
  async execute(query: GetPageBySlugQuery): Promise<Result<PageAggregate, GetPageBySlugQueryError>> {
    // ページリポジトリからページを取得
    const pageResult = await this.pageRepository.findBySlug(query.slug);

    // リポジトリでエラーが発生した場合はエラーを返す
    if (pageResult.isErr()) {
      return err(new ApplicationError(
        `Failed to get page by slug: ${pageResult.error.message}`
      ));
    }

    // ページが見つからない場合はエラーを返す
    const page = pageResult.value;
    if (!page) {
      return err(new EntityNotFoundError("Page", `with slug ${query.slug}`));
    }

    // ページを返す
    return ok(page);
  }
} 