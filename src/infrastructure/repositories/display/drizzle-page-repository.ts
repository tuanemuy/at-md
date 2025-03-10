import { 
  Result, 
  ok, 
  err, 
  type PageRepository, 
  PageRepositoryError, 
  PageAggregate, 
  Page,
  PageMetadata,
  RenderingOptions,
  InfrastructureError, 
  type TransactionContext,
  PostgresTransactionContext,
  db,
  eq,
  pages
} from "./deps.ts";
import type { Database } from "../../database/schema/mod.ts";

// ページデータの型定義
interface PageData {
  id: string;
  userId: string;
  contentId: string | null;
  templateId: string | null;
  slug: string;
  title: string;
  description: string | null;
  metadata: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Drizzle ORMを使用したページリポジトリの実装
 */
export class DrizzlePageRepository implements PageRepository {
  /**
   * コンストラクタ
   * @param db データベース接続
   */
  constructor(private readonly db: Database) {}

  /**
   * IDによってページを検索する
   * @param id ページID
   * @returns ページ集約の結果、存在しない場合はnull
   */
  async findById(id: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
    try {
      const result = await this.db.select().from(pages).where(eq(pages.id, id)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }
      
      const pageData = result[0];
      return ok(this.mapToPageAggregate(pageData));
    } catch (error) {
      console.error("ページ検索エラー:", error);
      return err(new PageRepositoryError(`ページの検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * スラッグによってページを検索する
   * @param slug ページスラッグ
   * @returns ページ集約の結果、存在しない場合はnull
   */
  async findBySlug(slug: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
    try {
      const result = await this.db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }
      
      const pageData = result[0];
      return ok(this.mapToPageAggregate(pageData));
    } catch (error) {
      console.error("スラッグによるページ検索エラー:", error);
      return err(new PageRepositoryError(`スラッグによるページの検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * コンテンツIDによってページを検索する
   * @param contentId コンテンツID
   * @returns ページ集約の結果、存在しない場合はnull
   */
  async findByContentId(contentId: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
    try {
      const result = await this.db.select().from(pages).where(eq(pages.contentId, contentId)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }
      
      const pageData = result[0];
      return ok(this.mapToPageAggregate(pageData));
    } catch (error) {
      console.error("コンテンツIDによるページ検索エラー:", error);
      return err(new PageRepositoryError(`コンテンツIDによるページの検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * ページを保存する
   * @param pageAggregate ページ集約
   * @returns 保存結果
   */
  async save(pageAggregate: PageAggregate): Promise<Result<void, PageRepositoryError>> {
    try {
      const page = pageAggregate.page;
      const metadata = page.metadata;
      
      // メタデータをJSONに変換
      const metadataObj = {
        keywords: metadata.keywords || [],
        ogImage: metadata.ogImage,
        canonicalUrl: metadata.canonicalUrl,
        publishedAt: metadata.publishedAt,
        updatedAt: metadata.updatedAt
      };
      
      // ページデータの作成
      const pageData = {
        id: page.id,
        userId: "system", // 実際の実装ではユーザーIDを適切に設定する必要があります
        slug: page.slug,
        contentId: page.contentId || null,
        templateId: page.templateId || null,
        title: page.title,
        description: metadata.description || null,
        metadata: metadataObj,
        status: "published", // デフォルト値
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      };
      
      // 既存のページを確認
      const existingPageResult = await this.findById(page.id);
      
      if (existingPageResult.isErr()) {
        return err(existingPageResult.error);
      }
      
      const existingPage = existingPageResult.value;
      
      if (existingPage) {
        // 更新
        await this.db.update(pages)
          .set(pageData)
          .where(eq(pages.id, page.id));
      } else {
        // 新規作成
        await this.db.insert(pages).values(pageData);
      }
      
      return ok(undefined);
    } catch (error) {
      console.error("ページ保存エラー:", error);
      return err(new PageRepositoryError(`ページの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * トランザクション内でページを保存する
   * @param pageAggregate ページ集約
   * @param context トランザクションコンテキスト
   * @returns 保存結果
   */
  async saveWithTransaction(
    pageAggregate: PageAggregate, 
    context: TransactionContext
  ): Promise<Result<void, InfrastructureError>> {
    try {
      if (!(context instanceof PostgresTransactionContext)) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }
      
      const page = pageAggregate.page;
      const metadata = page.metadata;
      
      // ページデータの作成
      const pageData = {
        id: page.id,
        slug: page.slug,
        contentId: page.contentId,
        templateId: page.templateId,
        title: page.title,
        description: metadata.description,
        keywords: JSON.stringify(metadata.keywords || []),
        ogImage: metadata.ogImage || "",
        ogTitle: metadata.ogTitle || "",
        ogDescription: metadata.ogDescription || "",
        twitterCard: metadata.twitterCard || "",
        twitterImage: metadata.twitterImage || "",
        twitterTitle: metadata.twitterTitle || "",
        twitterDescription: metadata.twitterDescription || "",
        canonicalUrl: metadata.canonicalUrl || "",
        noIndex: metadata.noIndex || false,
        theme: "light", // デフォルト値
        layout: "default", // デフォルト値
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      };
      
      // 既存のページを確認
      const existingPageResult = await this.findById(page.id);
      
      if (existingPageResult.isErr()) {
        return err(new InfrastructureError(`ページの検索に失敗しました: ${existingPageResult.error.message}`));
      }
      
      const existingPage = existingPageResult.value;
      
      if (existingPage) {
        // 更新
        await context.client.query(
          `UPDATE pages SET 
            slug = $1, 
            content_id = $2, 
            template_id = $3, 
            title = $4, 
            description = $5, 
            keywords = $6, 
            og_image = $7, 
            og_title = $8, 
            og_description = $9, 
            twitter_card = $10, 
            twitter_image = $11, 
            twitter_title = $12, 
            twitter_description = $13, 
            canonical_url = $14, 
            no_index = $15, 
            theme = $16, 
            layout = $17, 
            created_at = $18, 
            updated_at = $19 
          WHERE id = $20`,
          [
            pageData.slug,
            pageData.contentId,
            pageData.templateId,
            pageData.title,
            pageData.description,
            pageData.keywords,
            pageData.ogImage,
            pageData.ogTitle,
            pageData.ogDescription,
            pageData.twitterCard,
            pageData.twitterImage,
            pageData.twitterTitle,
            pageData.twitterDescription,
            pageData.canonicalUrl,
            pageData.noIndex,
            pageData.theme,
            pageData.layout,
            pageData.createdAt,
            pageData.updatedAt,
            pageData.id
          ]
        );
      } else {
        // 新規作成
        await context.client.query(
          `INSERT INTO pages (
            id, slug, content_id, template_id, title, description, keywords, 
            og_image, og_title, og_description, twitter_card, twitter_image, 
            twitter_title, twitter_description, canonical_url, no_index, 
            theme, layout, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
            $15, $16, $17, $18, $19, $20
          )`,
          [
            pageData.id,
            pageData.slug,
            pageData.contentId,
            pageData.templateId,
            pageData.title,
            pageData.description,
            pageData.keywords,
            pageData.ogImage,
            pageData.ogTitle,
            pageData.ogDescription,
            pageData.twitterCard,
            pageData.twitterImage,
            pageData.twitterTitle,
            pageData.twitterDescription,
            pageData.canonicalUrl,
            pageData.noIndex,
            pageData.theme,
            pageData.layout,
            pageData.createdAt,
            pageData.updatedAt
          ]
        );
      }
      
      return ok(undefined);
    } catch (error) {
      return err(new InfrastructureError(`ページの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * ページを削除する
   * @param id ページID
   * @returns 削除結果
   */
  async delete(id: string): Promise<Result<void, PageRepositoryError>> {
    try {
      await this.db.delete(pages).where(eq(pages.id, id));
      return ok(undefined);
    } catch (error) {
      console.error("ページ削除エラー:", error);
      return err(new PageRepositoryError(`ページの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * トランザクション内でページを削除する
   * @param id ページID
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
      
      await context.client.query("DELETE FROM pages WHERE id = $1", [id]);
      return ok(undefined);
    } catch (error) {
      return err(new InfrastructureError(`ページの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * ページデータをページ集約にマッピングする
   * @param data ページデータ
   * @returns ページ集約
   */
  private mapToPageAggregate(data: PageData): PageAggregate {
    try {
      // メタデータの解析
      const metadataObj = data.metadata ? (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) : {};
      
      // ページエンティティの作成
      const page = new Page({
        id: data.id,
        contentId: data.contentId || "",
        slug: data.slug,
        title: data.title,
        content: "", // データベースにはコンテンツが保存されていないため空文字列を設定
        templateId: data.templateId || "",
        metadata: new PageMetadata({
          description: data.description || undefined,
          keywords: metadataObj.keywords || [],
          ogImage: metadataObj.ogImage,
          canonicalUrl: metadataObj.canonicalUrl,
          publishedAt: metadataObj.publishedAt ? new Date(metadataObj.publishedAt) : undefined,
          updatedAt: metadataObj.updatedAt ? new Date(metadataObj.updatedAt) : undefined
        }),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
      
      // デフォルトのレンダリングオプション
      const renderingOptions = new RenderingOptions({
        theme: 'light',
        codeHighlighting: true,
        tableOfContents: true,
        syntaxHighlightingTheme: 'github',
        renderMath: false,
        renderDiagrams: false
      });
      
      // ページ集約の作成
      return new PageAggregate(page, renderingOptions);
    } catch (error) {
      console.error("ページデータのマッピング中にエラーが発生しました:", error);
      throw new PageRepositoryError(`ページデータのマッピングに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 