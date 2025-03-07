/**
 * コンテンツ取得クエリ
 * IDによってコンテンツを取得するためのクエリ
 */

import { Query } from "../../common/query.ts";
import { Result, ok, err } from "npm:neverthrow";
import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { ContentRepository } from "../repositories/content-repository.ts";

/**
 * コンテンツ取得クエリ
 */
export interface GetContentByIdQuery extends Query {
  readonly name: "GetContentById";
  readonly id: string;
}

/**
 * コンテンツ取得クエリハンドラー
 */
export class GetContentByIdQueryHandler {
  private contentRepository: ContentRepository;
  
  /**
   * コンストラクタ
   * @param contentRepository コンテンツリポジトリ
   */
  constructor(contentRepository: ContentRepository) {
    this.contentRepository = contentRepository;
  }
  
  /**
   * クエリを実行する
   * @param query コンテンツ取得クエリ
   * @returns 取得されたコンテンツ集約
   */
  async execute(query: GetContentByIdQuery): Promise<Result<ContentAggregate, Error>> {
    try {
      const content = await this.contentRepository.findById(query.id);
      
      if (!content) {
        return err(new Error(`コンテンツが見つかりません: ${query.id}`));
      }
      
      return ok(content);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 