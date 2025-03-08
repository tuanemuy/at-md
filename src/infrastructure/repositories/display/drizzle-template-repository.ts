import { Result, ok, err } from "npm:neverthrow";
import { eq } from "drizzle-orm";
import { TemplateRepository, TemplateRepositoryError } from "../../../application/display/repositories/template-repository.ts";
import { ViewTemplate, TemplateLayout, TemplateComponent } from "../../../core/display/entities/view-template.ts";
import { InfrastructureError } from "../../../core/errors/base.ts";
import { templates } from "../../database/schema/display.ts";
import { Database } from "../../database/schema/mod.ts";

/**
 * Drizzle ORMを使用したTemplateRepositoryの実装
 */
export class DrizzleTemplateRepository implements TemplateRepository {
  private db: Database;

  /**
   * コンストラクタ
   * 
   * @param db Drizzleデータベース接続
   */
  constructor(db: Database) {
    this.db = db;
  }

  /**
   * IDによってテンプレートを検索する
   * 
   * @param id 検索するテンプレートID
   * @returns テンプレートのResult、見つからない場合はnull
   */
  async findById(id: string): Promise<Result<ViewTemplate | null, TemplateRepositoryError>> {
    try {
      const result = await this.db.select().from(templates).where(eq(templates.id, id)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }

      const templateData = result[0];
      const template = this.mapToViewTemplate(templateData);
      
      return ok(template);
    } catch (error) {
      return err(new InfrastructureError(
        `テンプレートの検索中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * 名前によってテンプレートを検索する
   * 
   * @param name 検索するテンプレート名
   * @returns テンプレートのResult、見つからない場合はnull
   */
  async findByName(name: string): Promise<Result<ViewTemplate | null, TemplateRepositoryError>> {
    try {
      const result = await this.db.select().from(templates).where(eq(templates.name, name)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }

      const templateData = result[0];
      const template = this.mapToViewTemplate(templateData);
      
      return ok(template);
    } catch (error) {
      return err(new InfrastructureError(
        `テンプレートの検索中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * すべてのテンプレートを取得する
   * 
   * @returns テンプレートの配列のResult
   */
  async findAll(): Promise<Result<ViewTemplate[], TemplateRepositoryError>> {
    try {
      const result = await this.db.select().from(templates);
      
      const templateList = result.map(data => this.mapToViewTemplate(data));
      
      return ok(templateList);
    } catch (error) {
      return err(new InfrastructureError(
        `テンプレートの取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * テンプレートを保存する
   * 
   * @param template 保存するテンプレート
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  async save(template: ViewTemplate): Promise<Result<void, TemplateRepositoryError>> {
    try {
      // 既存のテンプレートを確認
      const existingTemplate = await this.db.select()
        .from(templates)
        .where(eq(templates.id, template.id))
        .limit(1);

      const templateContent = JSON.stringify({
        layout: template.layout,
        components: template.components
      });

      if (existingTemplate.length > 0) {
        // 更新
        await this.db.update(templates)
          .set({
            name: template.name,
            description: template.description || '',
            content: templateContent,
            updatedAt: new Date()
          })
          .where(eq(templates.id, template.id));
      } else {
        // 新規作成
        await this.db.insert(templates).values({
          id: template.id,
          name: template.name,
          description: template.description || '',
          content: templateContent,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return ok(undefined);
    } catch (error) {
      return err(new InfrastructureError(
        `テンプレートの保存中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * テンプレートを削除する
   * 
   * @param id 削除するテンプレートID
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  async delete(id: string): Promise<Result<void, TemplateRepositoryError>> {
    try {
      await this.db.delete(templates).where(eq(templates.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new InfrastructureError(
        `テンプレートの削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * データベースの結果をViewTemplateに変換する
   * 
   * @param data データベースの結果
   * @returns ViewTemplate
   */
  private mapToViewTemplate(data: typeof templates.$inferSelect): ViewTemplate {
    let layout: TemplateLayout = 'default';
    let components: TemplateComponent[] = [];

    try {
      const contentData = JSON.parse(data.content);
      layout = contentData.layout || 'default';
      components = contentData.components || [];
    } catch (error) {
      console.error('テンプレートのコンテンツのパースに失敗しました:', error);
    }

    return new ViewTemplate({
      id: data.id,
      name: data.name,
      description: data.description,
      layout,
      components,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }
} 