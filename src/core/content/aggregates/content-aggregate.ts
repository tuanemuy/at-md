import { Result, err, ok } from "../deps.ts";
import { Content, createContent, ContentParams } from "../entities/content.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { Version, createVersion, VersionParams, ContentChanges } from "../value-objects/version.ts";
import { generateId } from "../../common/mod.ts";
import { DomainError } from "../../errors/mod.ts";
import { 
  titleSchema, 
  bodySchema, 
  tagSchema, 
  categorySchema, 
  languageSchema, 
  readingTimeSchema,
  Tag as BrandedTag,
  Category as BrandedCategory,
  Language as BrandedLanguage,
  ReadingTime as BrandedReadingTime
} from "../../common/schemas/base-schemas.ts";

/**
 * コンテンツ集約作成エラー
 */
export class ContentAggregateCreationError extends DomainError {
  constructor(message: string) {
    super(`コンテンツ集約の作成に失敗しました: ${message}`);
  }
}

/**
 * コンテンツ集約
 * コンテンツエンティティとそれに関連する操作をカプセル化する
 */
export interface ContentAggregate {
  /** コンテンツエンティティ */
  readonly content: Content;
  
  /**
   * タイトルを更新する
   * @param title 新しいタイトル
   * @returns 更新されたコンテンツ集約
   */
  updateTitle(title: string): Result<ContentAggregate, DomainError>;
  
  /**
   * 本文を更新する
   * @param body 新しい本文
   * @returns 更新されたコンテンツ集約
   */
  updateBody(body: string): Result<ContentAggregate, DomainError>;
  
  /**
   * メタデータを更新する
   * @param metadata 新しいメタデータ
   * @returns 更新されたコンテンツ集約
   */
  updateMetadata(metadata: ContentMetadata): Result<ContentAggregate, DomainError>;
  
  /**
   * コンテンツを公開する
   * @returns 更新されたコンテンツ集約
   */
  publish(): Result<ContentAggregate, DomainError>;
  
  /**
   * コンテンツを非公開にする
   * @returns 更新されたコンテンツ集約
   */
  makePrivate(): Result<ContentAggregate, DomainError>;
  
  /**
   * コンテンツを限定公開にする
   * @returns 更新されたコンテンツ集約
   */
  makeUnlisted(): Result<ContentAggregate, DomainError>;
}

/**
 * コンテンツ集約を作成する
 * @param content コンテンツエンティティ
 * @returns 不変なコンテンツ集約オブジェクトを含むResult、またはエラー
 */
export function createContentAggregate(content: Content): Result<ContentAggregate, DomainError> {
  if (!content) {
    return err(new ContentAggregateCreationError("コンテンツが指定されていません"));
  }
  
  const contentAggregate: ContentAggregate = {
    content,
    
    updateTitle(title: string): Result<ContentAggregate, DomainError> {
      // タイトルのバリデーション
      const titleResult = titleSchema.safeParse(title);
      if (!titleResult.success) {
        return err(new Error(`タイトルのバリデーションに失敗しました: ${titleResult.error.message}`));
      }
      
      // 新しいコンテンツを作成
      const contentResult = createContent({
        ...this.content,
        title: titleResult.data,
        updatedAt: new Date()
      });
      
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      // 新しい集約を作成
      return createContentAggregate(contentResult.value);
    },
    
    updateBody(body: string): Result<ContentAggregate, DomainError> {
      // 本文のバリデーション
      const bodyResult = bodySchema.safeParse(body);
      if (!bodyResult.success) {
        return err(new Error(`本文のバリデーションに失敗しました: ${bodyResult.error.message}`));
      }
      
      // 新しいコンテンツを作成
      const contentResult = createContent({
        ...this.content,
        body: bodyResult.data,
        updatedAt: new Date()
      });
      
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      // 新しい集約を作成
      return createContentAggregate(contentResult.value);
    },
    
    updateMetadata(metadata: ContentMetadata): Result<ContentAggregate, DomainError> {
      // タグとカテゴリのバリデーション
      const brandedTags: BrandedTag[] = [];
      for (const tag of metadata.tags) {
        const tagResult = tagSchema.safeParse(tag);
        if (!tagResult.success) {
          return err(new Error(`タグのバリデーションに失敗しました: ${tagResult.error.message}`));
        }
        brandedTags.push(tagResult.data);
      }
      
      const brandedCategories: BrandedCategory[] = [];
      for (const category of metadata.categories) {
        const categoryResult = categorySchema.safeParse(category);
        if (!categoryResult.success) {
          return err(new Error(`カテゴリのバリデーションに失敗しました: ${categoryResult.error.message}`));
        }
        brandedCategories.push(categoryResult.data);
      }
      
      // 言語のバリデーション
      const languageResult = languageSchema.safeParse(metadata.language);
      if (!languageResult.success) {
        return err(new Error(`言語のバリデーションに失敗しました: ${languageResult.error.message}`));
      }
      
      // 読み時間のバリデーション
      let brandedReadingTime: BrandedReadingTime | undefined = undefined;
      if (metadata.readingTime !== undefined) {
        const readingTimeResult = readingTimeSchema.safeParse(metadata.readingTime);
        if (!readingTimeResult.success) {
          return err(new Error(`読み時間のバリデーションに失敗しました: ${readingTimeResult.error.message}`));
        }
        brandedReadingTime = readingTimeResult.data;
      }
      
      // 新しいメタデータを作成
      const metadataResult = createContentMetadata({
        tags: brandedTags,
        categories: brandedCategories,
        language: languageResult.data,
        readingTime: brandedReadingTime
      });
      
      if (metadataResult.isErr()) {
        return err(metadataResult.error);
      }
      
      // 新しいコンテンツを作成
      const contentResult = this.content.updateMetadata(metadataResult.value);
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      // 新しい集約を作成
      return createContentAggregate(contentResult.value);
    },
    
    publish(): Result<ContentAggregate, DomainError> {
      // 公開状態に変更
      const contentResult = this.content.changeVisibility("public");
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      // メタデータのバリデーション
      const brandedTags: BrandedTag[] = [];
      for (const tag of this.content.metadata.tags) {
        const tagResult = tagSchema.safeParse(tag);
        if (!tagResult.success) {
          return err(new Error(`タグのバリデーションに失敗しました: ${tagResult.error.message}`));
        }
        brandedTags.push(tagResult.data);
      }
      
      const brandedCategories: BrandedCategory[] = [];
      for (const category of this.content.metadata.categories) {
        const categoryResult = categorySchema.safeParse(category);
        if (!categoryResult.success) {
          return err(new Error(`カテゴリのバリデーションに失敗しました: ${categoryResult.error.message}`));
        }
        brandedCategories.push(categoryResult.data);
      }
      
      // 言語のバリデーション
      const languageResult = languageSchema.safeParse(this.content.metadata.language);
      if (!languageResult.success) {
        return err(new Error(`言語のバリデーションに失敗しました: ${languageResult.error.message}`));
      }
      
      // 読み時間のバリデーション
      let brandedReadingTime: BrandedReadingTime | undefined = undefined;
      if (this.content.metadata.readingTime !== undefined) {
        const readingTimeResult = readingTimeSchema.safeParse(this.content.metadata.readingTime);
        if (!readingTimeResult.success) {
          return err(new Error(`読み時間のバリデーションに失敗しました: ${readingTimeResult.error.message}`));
        }
        brandedReadingTime = readingTimeResult.data;
      }
      
      // バージョンを作成
      const versionParams: VersionParams = {
        id: generateId(),
        contentId: this.content.id,
        commitId: generateId(), // 実際の実装ではリポジトリからコミットIDを取得する
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
        return err(versionResult.error);
      }
      
      // バージョンを追加
      const contentWithVersionResult = contentResult.value.addVersion(versionResult.value);
      if (contentWithVersionResult.isErr()) {
        return err(contentWithVersionResult.error);
      }
      
      // 新しい集約を作成
      return createContentAggregate(contentWithVersionResult.value);
    },
    
    makePrivate(): Result<ContentAggregate, DomainError> {
      // 非公開状態に変更
      const contentResult = this.content.changeVisibility("private");
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      // 新しい集約を作成
      return createContentAggregate(contentResult.value);
    },
    
    makeUnlisted(): Result<ContentAggregate, DomainError> {
      // 限定公開状態に変更
      const contentResult = this.content.changeVisibility("unlisted");
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      // 新しい集約を作成
      return createContentAggregate(contentResult.value);
    }
  };
  
  return ok(Object.freeze(contentAggregate));
} 