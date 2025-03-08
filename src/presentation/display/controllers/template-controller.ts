import { Result, err, ok } from "npm:neverthrow";
import { PresentationError } from "../../../core/errors/base.ts";
import { EntityNotFoundError } from "../../../core/errors/application.ts";
import { 
  GetTemplateByIdQuery, 
  GetTemplateByIdQueryHandler,
  GetAllTemplatesQuery,
  GetAllTemplatesQueryHandler
} from "../../../application/display/queries/mod.ts";
import { toTemplateDto, TemplateDto } from "../dtos/template-dto.ts";

/**
 * テンプレートコントローラーのエラー型
 */
export type TemplateControllerError = PresentationError | EntityNotFoundError;

/**
 * テンプレートコントローラー
 * 
 * テンプレートの取得に関するエンドポイントを提供する
 */
export class TemplateController {
  constructor(
    private readonly getTemplateByIdQueryHandler: GetTemplateByIdQueryHandler,
    private readonly getAllTemplatesQueryHandler: GetAllTemplatesQueryHandler
  ) {}

  /**
   * IDでテンプレートを取得する
   * 
   * @param id テンプレートID
   * @returns テンプレートDTOのResult
   */
  async getTemplateById(id: string): Promise<Result<TemplateDto, TemplateControllerError>> {
    // IDの検証
    if (!id) {
      return err(new PresentationError("Template ID is required"));
    }

    // クエリを実行
    const query: GetTemplateByIdQuery = { id };
    const templateResult = await this.getTemplateByIdQueryHandler.execute(query);

    // エラーハンドリング
    if (templateResult.isErr()) {
      if (templateResult.error instanceof EntityNotFoundError) {
        return err(templateResult.error);
      }
      return err(new PresentationError(`Failed to get template: ${templateResult.error.message}`));
    }

    // テンプレートをDTOに変換して返す
    return ok(toTemplateDto(templateResult.value));
  }

  /**
   * すべてのテンプレートを取得する
   * 
   * @returns テンプレートDTOの配列のResult
   */
  async getAllTemplates(): Promise<Result<TemplateDto[], TemplateControllerError>> {
    // クエリを実行
    const query: GetAllTemplatesQuery = {};
    const templatesResult = await this.getAllTemplatesQueryHandler.execute(query);

    // エラーハンドリング
    if (templatesResult.isErr()) {
      return err(new PresentationError(`Failed to get all templates: ${templatesResult.error.message}`));
    }

    // テンプレートをDTOに変換して返す
    return ok(templatesResult.value.map(template => toTemplateDto(template)));
  }
} 