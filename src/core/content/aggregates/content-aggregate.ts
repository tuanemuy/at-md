import { Content, createContent, ContentParams } from "../entities/content.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { Version, createVersion, VersionParams } from "../value-objects/version.ts";
import { generateId } from "../../common/id.ts";
import { Result } from "../../../deps.ts";
import { DomainError } from "../../errors/base.ts";
import { 
  titleSchema, 
  bodySchema, 
  tagSchema, 
  categorySchema, 
  languageSchema,
  readingTimeSchema
} from "../../common/schemas/base-schemas.ts";

/**
 * コンテンツ集約を表すインターフェース
 * コンテンツエンティティとそれに関連する操作をカプセル化する
 */
export interface ContentAggregate {
  /** コンテンツエンティティ */
  readonly content: Content;

  /**
   * タイトルを更新する
   * @param title 新しいタイトル
   * @returns 新しいContentAggregateインスタンス
   */
  updateTitle(title: string): ContentAggregate;

  /**
   * 本文を更新する
   * @param body 新しい本文
   * @returns 新しいContentAggregateインスタンス
   */
  updateBody(body: string): ContentAggregate;

  /**
   * メタデータを更新する
   * @param metadata 新しいメタデータ
   * @returns 新しいContentAggregateインスタンス
   */
  updateMetadata(metadata: ContentMetadata): ContentAggregate;

  /**
   * コンテンツを公開する（public）
   * @returns 新しいContentAggregateインスタンス
   */
  publish(): ContentAggregate;

  /**
   * コンテンツを非公開にする（private）
   * @returns 新しいContentAggregateインスタンス
   */
  makePrivate(): ContentAggregate;

  /**
   * コンテンツを限定公開にする（unlisted）
   * @returns 新しいContentAggregateインスタンス
   */
  makeUnlisted(): ContentAggregate;
}

/**
 * ContentAggregateを作成する
 * @param content コンテンツエンティティ
 * @returns 不変なContentAggregateオブジェクト
 */
export function createContentAggregate(content: Content): ContentAggregate {
  const aggregate: ContentAggregate = {
    content,

    updateTitle(title: string): ContentAggregate {
      // タイトルをブランド型に変換
      const titleResult = titleSchema.safeParse(title);
      if (!titleResult.success) {
        throw new Error(`タイトルのバリデーションに失敗しました: ${titleResult.error.message}`);
      }

      // バージョンを作成
      const versionParams: VersionParams = {
        id: generateId(),
        contentId: this.content.id,
        commitId: generateId(), // 実際の実装ではGitHubのコミットIDを使用
        createdAt: new Date(),
        changes: {
          title: titleResult.data
        }
      };
      
      const versionResult = createVersion(versionParams);
      if (versionResult.isErr()) {
        throw new Error(`バージョンの作成に失敗しました: ${versionResult.error.message}`);
      }

      // コンテンツを更新
      const updatedContentResult = this.content.addVersion(versionResult.value);
      if (updatedContentResult.isErr()) {
        throw new Error(`コンテンツの更新に失敗しました: ${updatedContentResult.error.message}`);
      }

      // タイトルを更新したコンテンツを作成
      const contentParams: ContentParams = {
        ...updatedContentResult.value,
        title: titleResult.data,
        updatedAt: new Date()
      };
      
      const contentWithNewTitleResult = createContent(contentParams);
      if (contentWithNewTitleResult.isErr()) {
        throw new Error(`コンテンツの作成に失敗しました: ${contentWithNewTitleResult.error.message}`);
      }

      return createContentAggregate(contentWithNewTitleResult.value);
    },

    updateBody(body: string): ContentAggregate {
      // 本文をブランド型に変換
      const bodyResult = bodySchema.safeParse(body);
      if (!bodyResult.success) {
        throw new Error(`本文のバリデーションに失敗しました: ${bodyResult.error.message}`);
      }

      // バージョンを作成
      const versionParams: VersionParams = {
        id: generateId(),
        contentId: this.content.id,
        commitId: generateId(), // 実際の実装ではGitHubのコミットIDを使用
        createdAt: new Date(),
        changes: {
          body: bodyResult.data
        }
      };
      
      const versionResult = createVersion(versionParams);
      if (versionResult.isErr()) {
        throw new Error(`バージョンの作成に失敗しました: ${versionResult.error.message}`);
      }

      // コンテンツを更新
      const updatedContentResult = this.content.addVersion(versionResult.value);
      if (updatedContentResult.isErr()) {
        throw new Error(`コンテンツの更新に失敗しました: ${updatedContentResult.error.message}`);
      }

      // 本文を更新したコンテンツを作成
      const contentParams: ContentParams = {
        ...updatedContentResult.value,
        body: bodyResult.data,
        updatedAt: new Date()
      };
      
      const contentWithNewBodyResult = createContent(contentParams);
      if (contentWithNewBodyResult.isErr()) {
        throw new Error(`コンテンツの作成に失敗しました: ${contentWithNewBodyResult.error.message}`);
      }

      return createContentAggregate(contentWithNewBodyResult.value);
    },

    updateMetadata(metadata: ContentMetadata): ContentAggregate {
      // メタデータのタグとカテゴリをブランド型に変換
      const brandedTags = [];
      for (const tag of metadata.tags) {
        const tagResult = tagSchema.safeParse(tag);
        if (!tagResult.success) {
          throw new Error(`タグのバリデーションに失敗しました: ${tagResult.error.message}`);
        }
        brandedTags.push(tagResult.data);
      }
      
      const brandedCategories = [];
      for (const category of metadata.categories) {
        const categoryResult = categorySchema.safeParse(category);
        if (!categoryResult.success) {
          throw new Error(`カテゴリのバリデーションに失敗しました: ${categoryResult.error.message}`);
        }
        brandedCategories.push(categoryResult.data);
      }
      
      const languageResult = languageSchema.safeParse(metadata.language);
      if (!languageResult.success) {
        throw new Error(`言語のバリデーションに失敗しました: ${languageResult.error.message}`);
      }
      
      // 読了時間をブランド型に変換（存在する場合）
      let brandedReadingTime = undefined;
      if (metadata.readingTime !== undefined) {
        const readingTimeResult = readingTimeSchema.safeParse(metadata.readingTime);
        if (!readingTimeResult.success) {
          throw new Error(`読了時間のバリデーションに失敗しました: ${readingTimeResult.error.message}`);
        }
        brandedReadingTime = readingTimeResult.data;
      }
      
      // ブランド型に変換したメタデータを作成
      const metadataResult = createContentMetadata({
        tags: brandedTags,
        categories: brandedCategories,
        language: languageResult.data,
        publishedAt: metadata.publishedAt,
        lastPublishedAt: metadata.lastPublishedAt,
        excerpt: metadata.excerpt,
        featuredImage: metadata.featuredImage,
        readingTime: brandedReadingTime
      });
      
      if (metadataResult.isErr()) {
        throw new Error(`メタデータの作成に失敗しました: ${metadataResult.error.message}`);
      }

      // バージョンを作成
      const versionParams: VersionParams = {
        id: generateId(),
        contentId: this.content.id,
        commitId: generateId(), // 実際の実装ではGitHubのコミットIDを使用
        createdAt: new Date(),
        changes: {
          // contentChangesSchemaの定義に合わせてmetadataを設定
          metadata: {
            tags: brandedTags,
            categories: brandedCategories,
            language: languageResult.data,
            readingTime: brandedReadingTime
          }
        }
      };
      
      const versionResult = createVersion(versionParams);
      if (versionResult.isErr()) {
        throw new Error(`バージョンの作成に失敗しました: ${versionResult.error.message}`);
      }

      // コンテンツを更新
      const updatedContentResult = this.content.addVersion(versionResult.value);
      if (updatedContentResult.isErr()) {
        throw new Error(`コンテンツの更新に失敗しました: ${updatedContentResult.error.message}`);
      }

      // メタデータを更新したコンテンツを作成
      const contentParams: ContentParams = {
        ...updatedContentResult.value,
        metadata: metadataResult.value,
        updatedAt: new Date()
      };
      
      const contentWithNewMetadataResult = createContent(contentParams);
      if (contentWithNewMetadataResult.isErr()) {
        throw new Error(`コンテンツの作成に失敗しました: ${contentWithNewMetadataResult.error.message}`);
      }

      return createContentAggregate(contentWithNewMetadataResult.value);
    },

    publish(): ContentAggregate {
      const updatedContentResult = this.content.changeVisibility("public");
      if (updatedContentResult.isErr()) {
        throw new Error(`公開範囲の変更に失敗しました: ${updatedContentResult.error.message}`);
      }
      return createContentAggregate(updatedContentResult.value);
    },

    makePrivate(): ContentAggregate {
      const updatedContentResult = this.content.changeVisibility("private");
      if (updatedContentResult.isErr()) {
        throw new Error(`公開範囲の変更に失敗しました: ${updatedContentResult.error.message}`);
      }
      return createContentAggregate(updatedContentResult.value);
    },

    makeUnlisted(): ContentAggregate {
      const updatedContentResult = this.content.changeVisibility("unlisted");
      if (updatedContentResult.isErr()) {
        throw new Error(`公開範囲の変更に失敗しました: ${updatedContentResult.error.message}`);
      }
      return createContentAggregate(updatedContentResult.value);
    }
  };

  return Object.freeze(aggregate);
} 