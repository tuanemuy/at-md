/**
 * IDによるコンテンツ取得クエリ
 * 
 * 指定されたIDのコンテンツを取得するクエリ
 */

import { Query, QueryHandler } from "../../common/mod.ts";
import { Result, ok, err } from "npm:neverthrow";
import { ContentAggregate } from "../../../core/content/mod.ts";
import { ContentRepository } from "../repositories/mod.ts";
import { ApplicationError, EntityNotFoundError } from "../../../core/errors/mod.ts";

/**
 * コンテンツ取得クエリのパラメータ
 */
export interface GetContentByIdQuery extends Query {
  readonly name: "GetContentById";
  readonly id: string;
}

/**
 * IDによってコンテンツを取得するクエリハンドラー
 */
export class GetContentByIdQueryHandler implements QueryHandler<GetContentByIdQuery, ContentAggregate> {
  constructor(private readonly contentRepository: ContentRepository) {}

  /**
   * クエリを実行する
   * @param query クエリパラメータ
   * @returns コンテンツ集約
   */
  async execute(query: GetContentByIdQuery): Promise<Result<ContentAggregate, ApplicationError>> {
    const { id } = query;
    
    const content = await this.contentRepository.findById(id);
    
    if (!content) {
      return err(new EntityNotFoundError("Content", id));
    }
    
    return ok(content);
  }
} 