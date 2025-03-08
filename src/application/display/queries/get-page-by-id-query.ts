import { Result, err, ok } from "npm:neverthrow";
import { EntityNotFoundError } from "../../../core/errors/application.ts";
import { ApplicationError } from "../../../core/errors/base.ts";
import { PageAggregate } from "../../../core/display/aggregates/page-aggregate.ts";
import { PageRepository } from "../repositories/page-repository.ts";

/**
 * ページ取得クエリのエラー型
 */
export type GetPageByIdQueryError = ApplicationError | EntityNotFoundError;

/**
 * ページ取得クエリ
 */
export interface GetPageByIdQuery {
  id: string;
}

/**
 * ページ取得クエリハンドラー
 * 
 * ページIDを指定してページを取得する
 */
export class GetPageByIdQueryHandler {
  constructor(private readonly pageRepository: PageRepository) {}

  /**
   * クエリを実行する
   * 
   * @param query ページ取得クエリ
   * @returns ページ集約のResult
   */
  async execute(query: GetPageByIdQuery): Promise<Result<PageAggregate, GetPageByIdQueryError>> {
    // ページリポジトリからページを取得
    const pageResult = await this.pageRepository.findById(query.id);

    // リポジトリでエラーが発生した場合はエラーを返す
    if (pageResult.isErr()) {
      return err(new ApplicationError(
        `Failed to get page: ${pageResult.error.message}`
      ));
    }

    // ページが見つからない場合はエラーを返す
    const page = pageResult.value;
    if (!page) {
      return err(new EntityNotFoundError("Page", query.id));
    }

    // ページを返す
    return ok(page);
  }
} 