import { Result, err, ok } from "npm:neverthrow";
import { EntityNotFoundError } from "../../../core/errors/application.ts";
import { ApplicationError } from "../../../core/errors/base.ts";
import { ViewTemplate } from "../../../core/display/entities/view-template.ts";
import { TemplateRepository } from "../repositories/template-repository.ts";

/**
 * テンプレート取得クエリのエラー型
 */
export type GetTemplateByIdQueryError = ApplicationError | EntityNotFoundError;

/**
 * テンプレート取得クエリ
 */
export interface GetTemplateByIdQuery {
  id: string;
}

/**
 * テンプレート取得クエリハンドラー
 * 
 * テンプレートIDを指定してテンプレートを取得する
 */
export class GetTemplateByIdQueryHandler {
  constructor(private readonly templateRepository: TemplateRepository) {}

  /**
   * クエリを実行する
   * 
   * @param query テンプレート取得クエリ
   * @returns テンプレートのResult
   */
  async execute(query: GetTemplateByIdQuery): Promise<Result<ViewTemplate, GetTemplateByIdQueryError>> {
    // テンプレートリポジトリからテンプレートを取得
    const templateResult = await this.templateRepository.findById(query.id);

    // リポジトリでエラーが発生した場合はエラーを返す
    if (templateResult.isErr()) {
      return err(new ApplicationError(
        `Failed to get template: ${templateResult.error.message}`
      ));
    }

    // テンプレートが見つからない場合はエラーを返す
    const template = templateResult.value;
    if (!template) {
      return err(new EntityNotFoundError("Template", query.id));
    }

    // テンプレートを返す
    return ok(template);
  }
} 