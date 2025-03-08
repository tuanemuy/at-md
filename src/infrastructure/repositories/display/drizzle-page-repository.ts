import { Result, ok, err } from "npm:neverthrow";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PageRepository, PageRepositoryError } from "../../../application/display/repositories/page-repository.ts";
import { PageAggregate } from "../../../core/display/aggregates/page-aggregate.ts";
import { Page } from "../../../core/display/entities/page.ts";
import { PageMetadata } from "../../../core/display/value-objects/page-metadata.ts";
import { RenderingOptions } from "../../../core/display/value-objects/rendering-options.ts";
import { InfrastructureError } from "../../../core/errors/base.ts";
import { pages } from "../../database/schema/display.ts";
import { Database } from "../../database/schema/mod.ts";

/**
 * Drizzle ORMを使用したPageRepositoryの実装
 */
export class DrizzlePageRepository implements PageRepository {
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
   * IDによってページを検索する
   * 
   * @param id 検索するページID
   * @returns ページ集約のResult、見つからない場合はnull
   */
  async findById(id: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
    try {
      const result = await this.db.select().from(pages).where(eq(pages.id, id)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }

      const pageData = result[0];
      const page = this.mapToPageAggregate(pageData);
      
      return ok(page);
    } catch (error) {
      return err(new InfrastructureError(
        `ページの検索中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * スラッグによってページを検索する
   * 
   * @param slug 検索するスラッグ
   * @returns ページ集約のResult、見つからない場合はnull
   */
  async findBySlug(slug: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
    try {
      const result = await this.db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }

      const pageData = result[0];
      const page = this.mapToPageAggregate(pageData);
      
      return ok(page);
    } catch (error) {
      return err(new InfrastructureError(
        `ページの検索中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * コンテンツIDによってページを検索する
   * 
   * @param contentId 検索するコンテンツID
   * @returns ページ集約のResult、見つからない場合はnull
   */
  async findByContentId(contentId: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
    try {
      const result = await this.db.select().from(pages).where(eq(pages.contentId, contentId)).limit(1);
      
      if (result.length === 0) {
        return ok(null);
      }

      const pageData = result[0];
      const page = this.mapToPageAggregate(pageData);
      
      return ok(page);
    } catch (error) {
      return err(new InfrastructureError(
        `ページの検索中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * ページを保存する
   * 
   * @param pageAggregate 保存するページ集約
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  async save(pageAggregate: PageAggregate): Promise<Result<void, PageRepositoryError>> {
    try {
      const page = pageAggregate.page;
      const metadata = page.metadata;
      const renderingOptions = pageAggregate.renderingOptions;

      // 既存のページを確認
      const existingPage = await this.db.select()
        .from(pages)
        .where(eq(pages.id, page.id))
        .limit(1);

      if (existingPage.length > 0) {
        // 更新
        await this.db.update(pages)
          .set({
            slug: page.slug,
            contentId: page.contentId,
            title: page.title,
            description: metadata.description || '',
            templateId: page.templateId,
            renderingOptions: {
              theme: renderingOptions.theme,
              codeHighlighting: renderingOptions.codeHighlighting,
              tableOfContents: renderingOptions.tableOfContents,
              syntaxHighlightingTheme: renderingOptions.syntaxHighlightingTheme,
              renderMath: renderingOptions.renderMath,
              renderDiagrams: renderingOptions.renderDiagrams
            },
            updatedAt: new Date()
          })
          .where(eq(pages.id, page.id));
      } else {
        // 新規作成
        await this.db.insert(pages).values({
          id: page.id,
          slug: page.slug,
          contentId: page.contentId,
          title: page.title,
          description: metadata.description || '',
          templateId: page.templateId,
          renderingOptions: {
            theme: renderingOptions.theme,
            codeHighlighting: renderingOptions.codeHighlighting,
            tableOfContents: renderingOptions.tableOfContents,
            syntaxHighlightingTheme: renderingOptions.syntaxHighlightingTheme,
            renderMath: renderingOptions.renderMath,
            renderDiagrams: renderingOptions.renderDiagrams
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return ok(undefined);
    } catch (error) {
      return err(new InfrastructureError(
        `ページの保存中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * ページを削除する
   * 
   * @param id 削除するページID
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  async delete(id: string): Promise<Result<void, PageRepositoryError>> {
    try {
      await this.db.delete(pages).where(eq(pages.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new InfrastructureError(
        `ページの削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      ));
    }
  }

  /**
   * データベースの結果をPageAggregateに変換する
   * 
   * @param data データベースの結果
   * @returns PageAggregate
   */
  private mapToPageAggregate(data: typeof pages.$inferSelect): PageAggregate {
    const metadata = new PageMetadata({
      description: data.description
    });

    const renderingOptionsData = data.renderingOptions as Record<string, unknown>;
    const renderingOptions = new RenderingOptions({
      theme: (renderingOptionsData.theme as 'light' | 'dark' | 'auto') || 'auto',
      codeHighlighting: Boolean(renderingOptionsData.codeHighlighting) || true,
      tableOfContents: Boolean(renderingOptionsData.tableOfContents) || true,
      syntaxHighlightingTheme: String(renderingOptionsData.syntaxHighlightingTheme) || 'github',
      renderMath: Boolean(renderingOptionsData.renderMath) || false,
      renderDiagrams: Boolean(renderingOptionsData.renderDiagrams) || false
    });

    const page = new Page({
      id: data.id,
      slug: data.slug,
      contentId: data.contentId,
      title: data.title,
      content: '', // データベースにはコンテンツが保存されていないため空文字列を設定
      templateId: data.templateId || '',
      metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    return new PageAggregate(page, renderingOptions);
  }
} 