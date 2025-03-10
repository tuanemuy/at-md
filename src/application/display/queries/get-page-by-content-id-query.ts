import { Query } from "../../common/mod.ts";
import { Result, ok, err } from "../deps.ts";
import { ApplicationError, EntityNotFoundError } from "../deps.ts";
import { PageAggregate } from "../deps.ts";
import { PageRepository } from "../repositories/page-repository.ts";

/**
 * コンテンツIDによるページ取得クエリのエラー型
 */
export type GetPageByContentIdQueryError = ApplicationError | EntityNotFoundError;

/**
 * コンテンツIDによるページ取得クエリ
 */
export interface GetPageByContentIdQuery {
  contentId: string;
}

/**
 * コンテンツIDによるページ取得クエリハンドラー
 * 
 * コンテンツIDを指定してページを取得する
 */
export class GetPageByContentIdQueryHandler {
  constructor(private readonly pageRepository: PageRepository) {}

  /**
   * クエリを実行する
   * 
   * @param query コンテンツIDによるページ取得クエリ
   * @returns ページ集約のResult
   */
  async execute(query: GetPageByContentIdQuery): Promise<Result<PageAggregate, GetPageByContentIdQueryError>> {
    // ページリポジトリからページを取得
    const pageResult = await this.pageRepository.findByContentId(query.contentId);

    // リポジトリでエラーが発生した場合はエラーを返す
    if (pageResult.isErr()) {
      return err(new ApplicationError(
        `Failed to get page by content ID: ${pageResult.error.message}`
      ));
    }

    // ページが見つからない場合はエラーを返す
    const page = pageResult.value;
    if (!page) {
      return err(new EntityNotFoundError("Page", `for content ${query.contentId}`));
    }

    // ページを返す
    return ok(page);
  }
} 