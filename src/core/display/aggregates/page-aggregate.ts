import { generateId } from "../../common/id.ts";
import { Page } from "../entities/page.ts";
import { PageMetadata, RenderingOptions } from "../value-objects/mod.ts";

/**
 * ページ集約
 * 
 * ページエンティティとレンダリングオプションを管理する集約
 */
export class PageAggregate {
  private readonly _page: Page;
  private readonly _renderingOptions: RenderingOptions;

  /**
   * PageAggregateを作成する
   * 
   * @param page ページエンティティ
   * @param renderingOptions レンダリングオプション
   */
  constructor(page: Page, renderingOptions: RenderingOptions) {
    this._page = page;
    this._renderingOptions = renderingOptions;

    // 不変性を保証するためにオブジェクトをフリーズする
    Object.freeze(this);
  }

  /**
   * 新しいページ集約を作成する
   * 
   * @param params ページ作成パラメータ
   * @returns 新しいPageAggregate
   */
  static create(params: {
    contentId: string;
    slug: string;
    title: string;
    content: string;
    templateId: string;
    metadata?: PageMetadata;
    renderingOptions?: RenderingOptions;
  }): PageAggregate {
    const now = new Date();
    
    const page = new Page({
      id: generateId(),
      contentId: params.contentId,
      slug: params.slug,
      title: params.title,
      content: params.content,
      templateId: params.templateId,
      metadata: params.metadata ?? new PageMetadata({}),
      createdAt: now,
      updatedAt: now,
    });

    const renderingOptions = params.renderingOptions ?? RenderingOptions.createDefault();

    return new PageAggregate(page, renderingOptions);
  }

  /**
   * ページのIDを取得する
   */
  get id(): string {
    return this._page.id;
  }

  /**
   * コンテンツIDを取得する
   */
  get contentId(): string {
    return this._page.contentId;
  }

  /**
   * スラッグを取得する
   */
  get slug(): string {
    return this._page.slug;
  }

  /**
   * タイトルを取得する
   */
  get title(): string {
    return this._page.title;
  }

  /**
   * コンテンツを取得する
   */
  get content(): string {
    return this._page.content;
  }

  /**
   * テンプレートIDを取得する
   */
  get templateId(): string {
    return this._page.templateId;
  }

  /**
   * メタデータを取得する
   */
  get metadata(): PageMetadata {
    return this._page.metadata;
  }

  /**
   * レンダリングオプションを取得する
   */
  get renderingOptions(): RenderingOptions {
    return this._renderingOptions;
  }

  /**
   * 作成日時を取得する
   */
  get createdAt(): Date {
    return this._page.createdAt;
  }

  /**
   * 更新日時を取得する
   */
  get updatedAt(): Date {
    return this._page.updatedAt;
  }

  /**
   * ページエンティティを取得する
   */
  get page(): Page {
    return this._page;
  }

  /**
   * タイトルを更新したPageAggregateを返す
   * 
   * @param title 新しいタイトル
   * @returns 更新されたPageAggregate
   */
  updateTitle(title: string): PageAggregate {
    const updatedPage = this._page.updateTitle(title);
    return new PageAggregate(updatedPage, this._renderingOptions);
  }

  /**
   * コンテンツを更新したPageAggregateを返す
   * 
   * @param content 新しいコンテンツ
   * @returns 更新されたPageAggregate
   */
  updateContent(content: string): PageAggregate {
    const updatedPage = this._page.updateContent(content);
    return new PageAggregate(updatedPage, this._renderingOptions);
  }

  /**
   * スラッグを更新したPageAggregateを返す
   * 
   * @param slug 新しいスラッグ
   * @returns 更新されたPageAggregate
   */
  updateSlug(slug: string): PageAggregate {
    const updatedPage = this._page.updateSlug(slug);
    return new PageAggregate(updatedPage, this._renderingOptions);
  }

  /**
   * テンプレートを変更したPageAggregateを返す
   * 
   * @param templateId 新しいテンプレートID
   * @returns 更新されたPageAggregate
   */
  changeTemplate(templateId: string): PageAggregate {
    const updatedPage = this._page.changeTemplate(templateId);
    return new PageAggregate(updatedPage, this._renderingOptions);
  }

  /**
   * メタデータを更新したPageAggregateを返す
   * 
   * @param metadata 新しいメタデータ
   * @returns 更新されたPageAggregate
   */
  updateMetadata(metadata: PageMetadata): PageAggregate {
    const updatedPage = this._page.updateMetadata(metadata);
    return new PageAggregate(updatedPage, this._renderingOptions);
  }

  /**
   * レンダリングオプションを更新したPageAggregateを返す
   * 
   * @param options 更新するオプション
   * @returns 更新されたPageAggregate
   */
  updateRenderingOptions(options: Partial<{
    theme: 'light' | 'dark' | 'auto';
    codeHighlighting: boolean;
    tableOfContents: boolean;
    syntaxHighlightingTheme: string;
    renderMath: boolean;
    renderDiagrams: boolean;
  }>): PageAggregate {
    const updatedOptions = this._renderingOptions.update(options);
    return new PageAggregate(this._page, updatedOptions);
  }

  /**
   * 正規URLを取得する
   * 
   * @returns 正規URL（存在する場合）
   */
  getCanonicalUrl(): string | undefined {
    return this._page.metadata.canonicalUrl;
  }

  /**
   * 最終更新日時を取得する
   * 
   * @returns 最終更新日時
   */
  getLastUpdatedAt(): Date {
    return this._page.metadata.updatedAt ?? this._page.updatedAt;
  }
} 