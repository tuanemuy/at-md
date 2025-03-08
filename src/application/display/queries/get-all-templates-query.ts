import { Result, err, ok } from "npm:neverthrow";
import { ApplicationError } from "../../../core/errors/base.ts";
import { ViewTemplate } from "../../../core/display/entities/view-template.ts";
import { TemplateRepository } from "../repositories/template-repository.ts";

/**
 * すべてのテンプレート取得クエリのエラー型
 */
export type GetAllTemplatesQueryError = ApplicationError;

/**
 * すべてのテンプレート取得クエリ
 * 
 * パラメータは不要
 */
export interface GetAllTemplatesQuery {
  // パラメータなし
}

/**
 * すべてのテンプレート取得クエリハンドラー
 * 
 * すべてのテンプレートを取得する
 */
export class GetAllTemplatesQueryHandler {
  constructor(private readonly templateRepository: TemplateRepository) {}

  /**
   * クエリを実行する
   * 
   * @param _query すべてのテンプレート取得クエリ（パラメータなし）
   * @returns テンプレートの配列のResult
   */
  async execute(_query: GetAllTemplatesQuery): Promise<Result<ViewTemplate[], GetAllTemplatesQueryError>> {
    // テンプレートリポジトリからすべてのテンプレートを取得
    const templatesResult = await this.templateRepository.findAll();

    // リポジトリでエラーが発生した場合はエラーを返す
    if (templatesResult.isErr()) {
      return err(new ApplicationError(
        `Failed to get all templates: ${templatesResult.error.message}`
      ));
    }

    // テンプレートの配列を返す
    return ok(templatesResult.value);
  }
} 