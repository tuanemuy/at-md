import { InvalidContentStateError } from "../../errors/domain.ts";
import { PageMetadata } from "../value-objects/page-metadata.ts";

/**
 * ページエンティティ
 * 
 * コンテンツをウェブページとして表示するためのエンティティ
 */
export class Page {
  readonly id: string;
  readonly contentId: string;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly templateId: string;
  readonly metadata: PageMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  /**
   * Pageエンティティを作成する
   * 
   * @param params ページのパラメータ
   */
  constructor(params: {
    id: string;
    contentId: string;
    slug: string;
    title: string;
    content: string;
    templateId: string;
    metadata: PageMetadata;
    createdAt: Date;
    updatedAt: Date;
  }) {
    // 必須項目の検証
    if (!params.id) {
      throw new InvalidContentStateError("missing id", "create page");
    }
    if (!params.contentId) {
      throw new InvalidContentStateError("missing contentId", "create page");
    }
    if (!params.slug) {
      throw new InvalidContentStateError("missing slug", "create page");
    }
    if (!params.title) {
      throw new InvalidContentStateError("missing title", "create page");
    }
    if (!params.templateId) {
      throw new InvalidContentStateError("missing templateId", "create page");
    }

    this.id = params.id;
    this.contentId = params.contentId;
    this.slug = params.slug;
    this.title = params.title;
    this.content = params.content;
    this.templateId = params.templateId;
    this.metadata = params.metadata;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;

    // 不変性を保証するためにオブジェクトをフリーズする
    Object.freeze(this);
  }

  /**
   * タイトルを更新したPageを返す
   * 
   * @param title 新しいタイトル
   * @returns 更新されたPage
   */
  updateTitle(title: string): Page {
    if (!title) {
      throw new InvalidContentStateError("missing title", "update title");
    }

    return new Page({
      ...this,
      title,
      updatedAt: new Date(),
    });
  }

  /**
   * コンテンツを更新したPageを返す
   * 
   * @param content 新しいコンテンツ
   * @returns 更新されたPage
   */
  updateContent(content: string): Page {
    return new Page({
      ...this,
      content,
      updatedAt: new Date(),
    });
  }

  /**
   * スラッグを更新したPageを返す
   * 
   * @param slug 新しいスラッグ
   * @returns 更新されたPage
   */
  updateSlug(slug: string): Page {
    if (!slug) {
      throw new InvalidContentStateError("missing slug", "update slug");
    }

    return new Page({
      ...this,
      slug,
      updatedAt: new Date(),
    });
  }

  /**
   * テンプレートを変更したPageを返す
   * 
   * @param templateId 新しいテンプレートID
   * @returns 更新されたPage
   */
  changeTemplate(templateId: string): Page {
    if (!templateId) {
      throw new InvalidContentStateError("missing templateId", "change template");
    }

    return new Page({
      ...this,
      templateId,
      updatedAt: new Date(),
    });
  }

  /**
   * メタデータを更新したPageを返す
   * 
   * @param metadata 新しいメタデータ
   * @returns 更新されたPage
   */
  updateMetadata(metadata: PageMetadata): Page {
    return new Page({
      ...this,
      metadata,
      updatedAt: new Date(),
    });
  }
} 