import { 
  Result, 
  ok, 
  err, 
  type TemplateRepository, 
  TemplateRepositoryError, 
  ViewTemplate,
  type TemplateLayout,
  type TemplateComponent,
  InfrastructureError, 
  type TransactionContext,
  PostgresTransactionContext,
  db,
  eq,
  templates
} from "./deps.ts";
import type { Database } from "../../database/schema/mod.ts";

// テンプレートデータの型定義
interface TemplateData {
  id: string;
  userId: string;
  slug: string;
  name: string;
  description: string | null;
  content: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Drizzle ORMを使用したテンプレートリポジトリの実装
 */
export class DrizzleTemplateRepository implements TemplateRepository {
  /**
   * コンストラクタ
   * @param db データベース接続
   */
  constructor(private readonly db: Database) {}

  /**
   * IDによってテンプレートを検索する
   * @param id テンプレートID
   * @returns テンプレートの結果、存在しない場合はnull
   */
  async findById(id: string): Promise<Result<ViewTemplate | null, TemplateRepositoryError>> {
    try {
      const result = await this.db.select().from(templates).where(eq(templates.id, id)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }
      
      return ok(this.mapToViewTemplate(result[0] as TemplateData));
    } catch (error) {
      console.error("テンプレート検索エラー:", error);
      return err(new TemplateRepositoryError(`テンプレートの検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * 名前によってテンプレートを検索する
   * @param name テンプレート名
   * @returns テンプレートの結果、存在しない場合はnull
   */
  async findByName(name: string): Promise<Result<ViewTemplate | null, TemplateRepositoryError>> {
    try {
      const result = await this.db.select().from(templates).where(eq(templates.name, name)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }
      
      const templateData = result[0];
      return ok(this.mapToViewTemplate(templateData));
    } catch (error) {
      console.error("名前によるテンプレート検索エラー:", error);
      return err(new TemplateRepositoryError(`名前によるテンプレートの検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * すべてのテンプレートを取得する
   * @returns テンプレートのリスト
   */
  async findAll(): Promise<Result<ViewTemplate[], TemplateRepositoryError>> {
    try {
      const result = await this.db.select().from(templates);
      
      const templateList = result.map((templateData) => this.mapToViewTemplate(templateData as TemplateData));
      return ok(templateList);
    } catch (error) {
      console.error("テンプレート一覧取得エラー:", error);
      return err(new TemplateRepositoryError(`テンプレート一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * テンプレートを保存する
   * @param template テンプレート
   * @returns 保存結果
   */
  async save(template: ViewTemplate): Promise<Result<void, TemplateRepositoryError>> {
    try {
      // テンプレートのコンテンツデータを作成
      const contentData = {
        layout: template.layout,
        components: template.components
      };
      
      // テンプレートデータの作成
      const templateData = {
        id: template.id,
        userId: "system", // 実際の実装ではユーザーIDを適切に設定する必要があります
        slug: template.name.toLowerCase().replace(/\s+/g, '-'), // 名前からスラッグを生成
        name: template.name,
        description: template.description || null,
        content: JSON.stringify(contentData),
        metadata: {},
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };
      
      // 既存のテンプレートを確認
      const existingTemplateResult = await this.findById(template.id);
      
      if (existingTemplateResult.isErr()) {
        return err(existingTemplateResult.error);
      }
      
      const existingTemplate = existingTemplateResult.value;
      
      if (existingTemplate) {
        // 更新
        await this.db.update(templates)
          .set(templateData)
          .where(eq(templates.id, template.id));
      } else {
        // 新規作成
        await this.db.insert(templates).values(templateData);
      }
      
      return ok(undefined);
    } catch (error) {
      console.error("テンプレート保存エラー:", error);
      return err(new TemplateRepositoryError(`テンプレートの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * トランザクション内でテンプレートを保存する
   * @param template テンプレート
   * @param context トランザクションコンテキスト
   * @returns 保存結果
   */
  async saveWithTransaction(
    template: ViewTemplate, 
    context: TransactionContext
  ): Promise<Result<void, InfrastructureError>> {
    try {
      if (!(context instanceof PostgresTransactionContext)) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }
      
      // テンプレートデータの作成
      const templateData = {
        id: template.id,
        name: template.name,
        description: template.description || "",
        layout: JSON.stringify(template.layout || "default"),
        components: JSON.stringify(template.components || []),
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };
      
      // 既存のテンプレートを確認
      const existingTemplateResult = await this.findById(template.id);
      
      if (existingTemplateResult.isErr()) {
        return err(new InfrastructureError(`テンプレートの検索に失敗しました: ${existingTemplateResult.error.message}`));
      }
      
      const existingTemplate = existingTemplateResult.value;
      
      if (existingTemplate) {
        // 更新
        await context.client.query(
          `UPDATE templates SET 
            name = $1, 
            description = $2, 
            layout = $3, 
            components = $4, 
            created_at = $5, 
            updated_at = $6 
          WHERE id = $7`,
          [
            templateData.name,
            templateData.description,
            templateData.layout,
            templateData.components,
            templateData.createdAt,
            templateData.updatedAt,
            templateData.id
          ]
        );
      } else {
        // 新規作成
        await context.client.query(
          `INSERT INTO templates (
            id, name, description, layout, components, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          )`,
          [
            templateData.id,
            templateData.name,
            templateData.description,
            templateData.layout,
            templateData.components,
            templateData.createdAt,
            templateData.updatedAt
          ]
        );
      }
      
      return ok(undefined);
    } catch (error) {
      return err(new InfrastructureError(`テンプレートの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * テンプレートを削除する
   * @param id テンプレートID
   * @returns 削除結果
   */
  async delete(id: string): Promise<Result<void, TemplateRepositoryError>> {
    try {
      await this.db.delete(templates).where(eq(templates.id, id));
      return ok(undefined);
    } catch (error) {
      console.error("テンプレート削除エラー:", error);
      return err(new TemplateRepositoryError(`テンプレートの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * トランザクション内でテンプレートを削除する
   * @param id テンプレートID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  async deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<void, InfrastructureError>> {
    try {
      if (!(context instanceof PostgresTransactionContext)) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }
      
      await context.client.query("DELETE FROM templates WHERE id = $1", [id]);
      return ok(undefined);
    } catch (error) {
      return err(new InfrastructureError(`テンプレートの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * データベースのテンプレートデータをViewTemplateにマッピングする
   * @param data データベースのテンプレートデータ
   * @returns ViewTemplate
   */
  private mapToViewTemplate(data: TemplateData): ViewTemplate {
    try {
      // contentからlayoutとcomponentsを解析
      const contentData = JSON.parse(data.content);
      const layout = contentData.layout || "default";
      const components = contentData.components || [];
      
      return new ViewTemplate({
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        layout: layout as TemplateLayout,
        components: components as TemplateComponent[],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    } catch (error) {
      console.error("テンプレートデータのパース中にエラーが発生しました:", error);
      // エラーが発生した場合はデフォルト値を使用
      return new ViewTemplate({
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        layout: "default",
        components: [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    }
  }
} 